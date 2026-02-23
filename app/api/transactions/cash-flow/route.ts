import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

type SankeyNode = {
  id: string
  label: string
  amount: number
  color?: string
  level: number
}

type SankeyLink = {
  source: string
  target: string
  value: number
}

type CashFlowData = {
  period: string
  totalIncome: number
  totalExpenses: number
  nodes: SankeyNode[]
  links: SankeyLink[]
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const periodParam = searchParams.get('period')
    const dateFromParam = searchParams.get('dateFrom')
    const dateToParam = searchParams.get('dateTo')
    // Only support 'major' and 'category' levels now (subcategory removed - use tags)
    let level = searchParams.get('level') || 'major'
    if (level === 'subcategory') level = 'category' // Fallback for old requests

    const originFilter = searchParams.get('origin')
    const bankFilter = searchParams.get('bank')
    const majorCategoryFilter = searchParams.get('majorCategory')
    const categoryFilter = searchParams.get('category')

    let startDate: Date
    let endDate: Date
    let period: string

    // Priority: dateFrom/dateTo > period > default (current month)
    if (dateFromParam && dateToParam) {
      startDate = new Date(dateFromParam)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(dateToParam)
      endDate.setHours(23, 59, 59, 999)

      const fromDate = new Date(dateFromParam)
      const toDate = new Date(dateToParam)
      period = `${fromDate.toLocaleDateString('pt-PT')} - ${toDate.toLocaleDateString('pt-PT')}`
    } else if (periodParam) {
      const [year, month] = periodParam.split('-').map(Number)
      startDate = new Date(year, month - 1, 1)
      endDate = new Date(year, month, 0, 23, 59, 59)
      period = periodParam
    } else {
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    }

    // Build where clause with filters (excluding soft-deleted)
    const whereClause: any = {
      userId: user.userId,
      deletedAt: null, // Exclude soft-deleted transactions
      rawDate: {
        gte: startDate,
        lte: endDate,
      },
    }

    if (originFilter && originFilter !== 'all') {
      whereClause.origin = originFilter
    }

    if (bankFilter && bankFilter !== 'all') {
      whereClause.bank = bankFilter
    }

    if (majorCategoryFilter && majorCategoryFilter !== 'all') {
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          OR: [
            { majorCategory: majorCategoryFilter },
            { majorCategoryRef: { name: majorCategoryFilter } },
          ],
        },
      ]
    }

    if (categoryFilter && categoryFilter !== 'all') {
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          OR: [{ category: categoryFilter }, { categoryRef: { name: categoryFilter } }],
        },
      ]
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        majorCategoryRef: true,
        categoryRef: true,
      },
    })

    const nodes: SankeyNode[] = []
    const links: SankeyLink[] = []

    // Issue #127: Single-pass aggregation (4x faster than 4 separate loops)
    // Combines: totals calculation, income sources, income hierarchy, expense hierarchy
    interface CategoryGroup {
      majorName: string
      categories: Record<string, number>
    }

    type AggregationState = {
      totalIncome: number
      totalExpenses: number
      incomeSources: Record<string, number>
      incomeHierarchy: Record<string, CategoryGroup>
      expenseHierarchy: Record<string, CategoryGroup>
    }

    const aggregated = transactions.reduce<AggregationState>(
      (acc, txn) => {
        const amount = txn.rawAmount

        if (amount > 0) {
          // Income: combine Loop 1 + Loop 2 + Loop 3 logic
          acc.totalIncome += amount

          const majorCat =
            txn.majorCategoryRef?.name ||
            txn.majorCategory ||
            txn.categoryRef?.name ||
            txn.category ||
            'Outros Rendimentos'
          acc.incomeSources[majorCat] = (acc.incomeSources[majorCat] || 0) + amount

          // Always build hierarchy (needed for both 'major' and 'category' levels)
          const cat = txn.categoryRef?.name || txn.category || 'Outros'
          if (!acc.incomeHierarchy[majorCat]) {
            acc.incomeHierarchy[majorCat] = { majorName: majorCat, categories: {} }
          }
          acc.incomeHierarchy[majorCat].categories[cat] =
            (acc.incomeHierarchy[majorCat].categories[cat] || 0) + amount
        } else {
          // Expense: combine Loop 1 + Loop 4 logic
          const absAmount = Math.abs(amount)
          acc.totalExpenses += absAmount

          // Always build hierarchy (needed for both 'major' and 'category' levels)
          const majorCat = txn.majorCategoryRef?.name || txn.majorCategory || 'Não categorizado'
          const cat = txn.categoryRef?.name || txn.category || 'Outros'

          if (!acc.expenseHierarchy[majorCat]) {
            acc.expenseHierarchy[majorCat] = { majorName: majorCat, categories: {} }
          }
          acc.expenseHierarchy[majorCat].categories[cat] =
            (acc.expenseHierarchy[majorCat].categories[cat] || 0) + absAmount
        }

        return acc
      },
      {
        totalIncome: 0,
        totalExpenses: 0,
        incomeSources: {},
        incomeHierarchy: {},
        expenseHierarchy: {},
      }
    )

    const { totalIncome, totalExpenses, incomeSources, incomeHierarchy, expenseHierarchy } =
      aggregated

    // Add income source nodes (level 0)
    const sortedIncomeSources = Object.entries(incomeSources).sort((a, b) => b[1] - a[1])
    sortedIncomeSources.forEach(([name, amount]) => {
      const nodeId = `income-${name.replace(/\s+/g, '-').toLowerCase()}`
      nodes.push({
        id: nodeId,
        label: name,
        amount,
        color: '#10b981',
        level: 0,
      })
    })

    if (level === 'major') {
      // Structure: Income Sources → Budget → Major Categories

      nodes.push({
        id: 'budget',
        label: 'Orçamento',
        amount: totalIncome,
        color: '#3b82f6',
        level: 1,
      })

      sortedIncomeSources.forEach(([incomeName, incomeAmount]) => {
        const incomeNodeId = `income-${incomeName.replace(/\s+/g, '-').toLowerCase()}`
        links.push({
          source: incomeNodeId,
          target: 'budget',
          value: incomeAmount,
        })
      })

      // Derive major categories from already-built expenseHierarchy (no extra loop needed)
      const majorCategories: Record<string, number> = {}
      Object.entries(expenseHierarchy).forEach(([majorCat, data]) => {
        majorCategories[majorCat] = Object.values(data.categories).reduce(
          (sum, val) => sum + val,
          0
        )
      })

      const sortedMajor = Object.entries(majorCategories).sort((a, b) => b[1] - a[1])

      sortedMajor.forEach(([name, amount]) => {
        const nodeId = `major-${name.replace(/\s+/g, '-').toLowerCase()}`
        nodes.push({
          id: nodeId,
          label: name,
          amount,
          color: getMajorCategoryColor(name),
          level: 2,
        })

        links.push({
          source: 'budget',
          target: nodeId,
          value: amount,
        })
      })
    } else if (level === 'category') {
      // Structure: Income Major → Income Categories → Budget → Expense Major → Expense Categories
      // Note: incomeHierarchy and expenseHierarchy already built by single-pass reduce() above

      // Sort income majors
      const sortedIncomeMajors = Object.entries(incomeHierarchy)
        .map(([name, data]) => ({
          name,
          total: Object.values(data.categories).reduce((sum, val) => sum + val, 0),
          categories: data.categories,
        }))
        .sort((a, b) => b.total - a.total)

      // Add income nodes
      sortedIncomeMajors.forEach(major => {
        const majorNodeId = `income-major-${major.name.replace(/\s+/g, '-').toLowerCase()}`

        nodes.push({
          id: majorNodeId,
          label: major.name,
          amount: major.total,
          color: '#10b981',
          level: 0,
        })

        const sortedCategories = Object.entries(major.categories).sort((a, b) => b[1] - a[1])
        sortedCategories.forEach(([catName, amount]) => {
          const catNodeId = `income-cat-${major.name}-${catName}`.replace(/\s+/g, '-').toLowerCase()

          nodes.push({
            id: catNodeId,
            label: catName,
            amount,
            color: '#22c55e',
            level: 1,
          })

          links.push({
            source: majorNodeId,
            target: catNodeId,
            value: amount,
          })
        })
      })

      // Add Budget node
      nodes.push({
        id: 'budget',
        label: 'Orçamento',
        amount: totalIncome,
        color: '#3b82f6',
        level: 2,
      })

      // Link income categories to Budget
      sortedIncomeMajors.forEach(major => {
        const sortedCategories = Object.entries(major.categories).sort((a, b) => b[1] - a[1])
        sortedCategories.forEach(([catName, amount]) => {
          const catNodeId = `income-cat-${major.name}-${catName}`.replace(/\s+/g, '-').toLowerCase()
          links.push({
            source: catNodeId,
            target: 'budget',
            value: amount,
          })
        })
      })

      // Sort expense majors
      const sortedExpenseMajors = Object.entries(expenseHierarchy)
        .map(([name, data]) => ({
          name,
          total: Object.values(data.categories).reduce((sum, val) => sum + val, 0),
          categories: data.categories,
        }))
        .sort((a, b) => b.total - a.total)

      sortedExpenseMajors.forEach(major => {
        const majorNodeId = `expense-major-${major.name.replace(/\s+/g, '-').toLowerCase()}`

        nodes.push({
          id: majorNodeId,
          label: major.name,
          amount: major.total,
          color: getMajorCategoryColor(major.name),
          level: 3,
        })

        links.push({
          source: 'budget',
          target: majorNodeId,
          value: major.total,
        })

        const sortedCategories = Object.entries(major.categories).sort((a, b) => b[1] - a[1])
        sortedCategories.forEach(([catName, amount]) => {
          const catNodeId = `expense-cat-${major.name}-${catName}`
            .replace(/\s+/g, '-')
            .toLowerCase()

          nodes.push({
            id: catNodeId,
            label: catName,
            amount,
            color: getCategoryColor(catName),
            level: 4,
          })

          links.push({
            source: majorNodeId,
            target: catNodeId,
            value: amount,
          })
        })
      })
    }

    // Filter out invalid data
    const validLinks = links.filter(link => {
      const value = Number(link.value)
      return !isNaN(value) && isFinite(value) && value > 0
    })

    const validNodes = nodes.filter(node => {
      const amount = Number(node.amount)
      return !isNaN(amount) && isFinite(amount) && amount > 0
    })

    const cashFlowData: CashFlowData = {
      period,
      totalIncome,
      totalExpenses,
      nodes: validNodes,
      links: validLinks,
    }

    return NextResponse.json(cashFlowData)
  } catch (error) {
    console.error('Cash flow error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

function getMajorCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'Custos Fixos': '#ef4444',
    'Custos Variaveis': '#f97316',
    'Custos Variáveis': '#f97316',
    'Gastos sem culpa': '#f59e0b',
    'Gastos sem Culpa': '#f59e0b',
    'Economia e Investimentos': '#06b6d4',
  }
  return colors[category] || '#dc2626'
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Alimentação: '#fb923c',
    Transportes: '#fbbf24',
    Habitação: '#f87171',
    Saúde: '#fb7185',
    Educação: '#f472b6',
    Lazer: '#e879f9',
  }
  return colors[category] || '#f97316'
}
