'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { User, Transaction, Rule } from '@prisma/client'
import { MAJOR_CATEGORIES, SUBCATEGORIES, getCategoryColor } from '@/lib/categories'
import { parseFile, exportToCSV } from '@/lib/parsers'
import { formatCurrency, formatNumber, formatDate, formatDateTime } from '@/lib/format'
import { normalizeBankName } from '@/lib/bank-normalizer'
import {
  Upload,
  Download,
  Settings,
  Home,
  FileText,
  BarChart3,
  PieChart,
  Eye,
  EyeOff,
  Plus,
  Save,
  Trash2,
  Filter,
  Search,
  CheckSquare,
  Moon,
  Sun,
  Edit,
  Edit2,
  Copy,
  Flag,
  Sparkles,
  FolderTree,
  ChevronDown,
  ChevronRight,
  Check,
  TrendingUp,
  Languages,
} from 'lucide-react'
import { Select } from '@/components/ui/Select'
import { OriginAvatar } from '@/components/ui/OriginAvatar'
import { CategorySelector } from '@/components/ui/CategorySelector'
import { BankSelector } from '@/components/ui/BankSelector'
import { DateInput } from '@/components/ui/DateInput'
import { AIClassifier, ConfidenceBadge, AIBatchClassifier } from '@/components/ui/AIClassifier'
import { TagBadges, TagsLabel, TagNamespaceLegend } from '@/components/ui/TagDisplay'
import { CategoryBadge, CategoryBadgeCompact } from '@/components/ui/CategoryBadge'
import { TagSelector } from '@/components/ui/TagSelector'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
}

interface TransactionWithUser extends Transaction {
  user: User
  majorCategoryRef?: {
    id: string
    emoji?: string | null
    name: string
  } | null
  categoryRef?: {
    id: string
    name: string
    icon?: string | null
  } | null
}

interface Category {
  id: string
  name: string
  nameEn?: string | null
  slug: string
  icon?: string | null
}

interface MajorCategory {
  id: string
  name: string
  nameEn?: string | null
  emoji: string
  slug: string
  budgetCategory?: string | null
  categories: Category[]
}

interface TagDefinition {
  id: string
  namespace: string
  value: string
  label: string
  labelEn?: string | null
  color?: string | null
  sortOrder?: number
}

/**
 * Helper function to create fetch options with CSRF token and credentials
 * Automatically includes:
 * - x-csrf-token header for POST/PATCH/DELETE requests
 * - credentials: 'include' to send HTTP-only cookies
 * - Authorization header if token provided
 */
function createFetchOptions(
  token?: string | null,
  additionalHeaders: Record<string, string> = {}
): RequestInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  }

  // Add Authorization header if token provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Add CSRF token for state-changing requests
  const csrfToken = typeof window !== 'undefined' ? localStorage.getItem('csrf-token') : null
  if (csrfToken) {
    headers['x-csrf-token'] = csrfToken
  }

  return {
    headers,
    credentials: 'include', // Required for HTTP-only CSRF cookies
  }
}

/**
 * Legacy helper - kept for backward compatibility
 * Use createFetchOptions instead for full CSRF support
 */
function createFetchHeaders(
  token?: string | null,
  additionalHeaders: Record<string, string> = {}
): HeadersInit {
  const options = createFetchOptions(token, additionalHeaders)
  return options.headers as HeadersInit
}

export default function App() {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
  })

  const [activeTab, setActiveTab] = useState('transactions')
  const [transactions, setTransactions] = useState<TransactionWithUser[]>([])
  const [rules, setRules] = useState<Rule[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [reviewTransactions, setReviewTransactions] = useState<any[]>([])
  const [selectedReviewIds, setSelectedReviewIds] = useState<string[]>([])
  const [lastSelectedReviewId, setLastSelectedReviewId] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(false)
  const [language, setLanguage] = useState<'pt' | 'en'>('pt')
  const [authChecked, setAuthChecked] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<
    Partial<Transaction> & {
      majorCategoryId?: string | null
      categoryId?: string | null
      tags?: string[]
    }
  >({})
  const [savingEdit, setSavingEdit] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [notification, setNotification] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
  } | null>(null)

  // Auth states
  const [showLogin, setShowLogin] = useState(true)
  const [pinInput, setPinInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [showPin, setShowPin] = useState(false)

  // Filter states
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterMajorCategory, setFilterMajorCategory] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [filterFlagged, setFilterFlagged] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState<Date | null>(null)
  const [filterDateTo, setFilterDateTo] = useState<Date | null>(null)
  const [filterOrigin, setFilterOrigin] = useState('all')
  const [filterBank, setFilterBank] = useState('all')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Sort states
  const [sortField, setSortField] = useState<'date' | 'amount' | 'description' | 'origin' | 'bank'>(
    'date'
  )
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Clear all filters function
  const clearAllFilters = () => {
    setFilterStatus('all')
    setFilterMajorCategory('all')
    setFilterCategory('all')
    setFilterTags([])
    setFilterFlagged('all')
    setSearchTerm('')
    setFilterDateFrom(null)
    setFilterDateTo(null)
    setFilterOrigin('all')
    setFilterBank('all')
  }

  // Check if any filters are active
  const hasActiveFilters =
    filterStatus !== 'all' ||
    filterMajorCategory !== 'all' ||
    filterCategory !== 'all' ||
    filterTags.length > 0 ||
    filterFlagged !== 'all' ||
    searchTerm !== '' ||
    filterDateFrom !== null ||
    filterDateTo !== null ||
    filterOrigin !== 'all' ||
    filterBank !== 'all'

  // Import dialog states
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importOrigin, setImportOrigin] = useState('Couple')
  const [importBank, setImportBank] = useState('Auto-detect')
  const [isDragging, setIsDragging] = useState(false)

  // Manual add transaction states
  const [showAddTransactionDialog, setShowAddTransactionDialog] = useState(false)
  const [newTransactionForm, setNewTransactionForm] = useState<{
    rawDate: Date | null
    rawDescription: string
    rawAmount: string
    rawBalance: string
    origin: string
    bank: string
    majorCategoryId: string | null
    categoryId: string | null
    majorCategory: string | null
    category: string | null
    tags: string[]
  }>({
    rawDate: new Date(),
    rawDescription: '',
    rawAmount: '',
    rawBalance: '',
    origin: 'Couple',
    bank: '',
    majorCategoryId: null,
    categoryId: null,
    majorCategory: null,
    category: null,
    tags: [],
  })

  // Add category dialog states
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false)
  const [selectedMajorIdForNewCategory, setSelectedMajorIdForNewCategory] = useState<string | null>(
    null
  )
  const [newCategoryName, setNewCategoryName] = useState('')

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)

  // Bulk selection states for transactions
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([])
  const [lastSelectedTransactionId, setLastSelectedTransactionId] = useState<string | null>(null)
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false)
  const [bulkEditForm, setBulkEditForm] = useState<{
    majorCategoryId?: string | null
    categoryId?: string | null
    majorCategory?: string | null
    category?: string | null
    tags?: string[]
    status?: string
    bank?: string
    origin?: string
    month?: number | null
    year?: number | null
  }>({})
  const [pageSize, setPageSize] = useState(20)

  // Form states
  const [newRule, setNewRule] = useState({
    keyword: '',
    majorCategory: '',
    category: '',
    subCategory: '',
  })

  // Categories tab states
  const [taxonomy, setTaxonomy] = useState<MajorCategory[]>([])
  const [tagDefinitions, setTagDefinitions] = useState<TagDefinition[]>([])
  const [expandedMajor, setExpandedMajor] = useState<Set<string>>(new Set())
  const [expandedCategory, setExpandedCategory] = useState<Set<string>>(new Set())
  const [expandedNamespace, setExpandedNamespace] = useState<Set<string>>(new Set())
  const [editValue, setEditValue] = useState('')

  // Banks tab states
  const [banks, setBanks] = useState<any[]>([])
  const [showNewBankForm, setShowNewBankForm] = useState(false)
  const [newBankForm, setNewBankForm] = useState({ name: '', logo: '', color: '' })
  const [savingBank, setSavingBank] = useState(false)
  const [editingBank, setEditingBank] = useState<any | null>(null)

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  const showConfirmDialog = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm })
  }

  const handleConfirm = () => {
    confirmDialog.onConfirm()
    setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })
  }

  const handleCancel = () => {
    setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })
  }

  // Dashboard filters
  const [dashboardDateRange, setDashboardDateRange] = useState<'all' | '1y' | '6m' | '3m' | '1m'>(
    '1y'
  )
  const [dashboardOriginFilter, setDashboardOriginFilter] = useState<string>('all')

  useEffect(() => {
    // Load dark mode preference first to prevent flash
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'
    setDarkMode(savedDarkMode)
    if (savedDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // Try to restore session from localStorage
    const savedToken = localStorage.getItem('token')
    if (savedToken && savedToken !== 'dev-token-no-auth') {
      // Verify token is still valid by attempting to load data
      loadData(savedToken)
        .then(() => {
          // Token is valid, restore auth state
          // Note: We don't have user info, but the token works
          setAuth({
            isAuthenticated: true,
            user: null, // Will be populated when data loads
            token: savedToken,
          })
        })
        .catch(() => {
          // Token is invalid, clear it
          localStorage.removeItem('token')
        })
        .finally(() => {
          setAuthChecked(true)
        })
    } else {
      // No token, mark auth as checked
      setAuthChecked(true)
    }
  }, [])

  // Read URL parameters for filters (from Cash Flow page navigation)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)

      const majorCategory = params.get('majorCategory')
      const category = params.get('category')
      const dateFrom = params.get('dateFrom')
      const dateTo = params.get('dateTo')

      if (majorCategory) setFilterMajorCategory(majorCategory)
      if (category) setFilterCategory(category)
      if (dateFrom) setFilterDateFrom(new Date(dateFrom))
      if (dateTo) setFilterDateTo(new Date(dateTo))

      // Show advanced filters if any filter params are present
      if (majorCategory || category) {
        setShowAdvancedFilters(true)
      }

      // Clear URL params after reading (to allow fresh navigation)
      if (params.toString()) {
        window.history.replaceState({}, '', '/')
      }
    }
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newMode = !prev
      localStorage.setItem('darkMode', String(newMode))
      if (newMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      return newMode
    })
  }

  const loadData = async (token: string) => {
    try {
      // Load transactions
      const transactionsRes = await fetch('/api/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json()
        setTransactions(transactionsData)
      }

      // Load rules
      const rulesRes = await fetch('/api/rules', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (rulesRes.ok) {
        const rulesData = await rulesRes.json()
        setRules(rulesData)
      }

      // Load stats
      const statsRes = await fetch('/api/transactions/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      // Load review transactions
      const reviewRes = await fetch('/api/transactions/review', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (reviewRes.ok) {
        const reviewData = await reviewRes.json()
        setReviewTransactions(reviewData)
      }
    } catch (error) {
      // Error loading data
    }
  }

  // Refresh a single transaction without reloading the entire list
  const refreshTransaction = async (transactionId: string) => {
    try {
      const token = auth.token || localStorage.getItem('token')
      const res = await fetch(`/api/transactions?id=${transactionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) return

      const updatedTransaction = await res.json()

      // Update in transactions array
      setTransactions(prev => prev.map(t => (t.id === transactionId ? updatedTransaction : t)))

      // Update in reviewTransactions array if present
      setReviewTransactions(prev =>
        prev.map(t => (t.id === transactionId ? updatedTransaction : t))
      )
    } catch (error) {
      console.error('Error refreshing transaction:', error)
    }
  }

  const handleAuth = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: showLogin ? 'login' : 'register',
          name: nameInput,
          pin: pinInput,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        // Store JWT token
        localStorage.setItem('token', data.token)

        // Store CSRF token from response header
        const csrfToken = res.headers.get('X-CSRF-Token')
        if (csrfToken) {
          localStorage.setItem('csrf-token', csrfToken)
        }

        setAuth({
          isAuthenticated: true,
          user: data.user,
          token: data.token,
        })
        await loadData(data.token)
        setPinInput('')
        setNameInput('')
        showNotification(`Welcome, ${data.user.name}!`, 'success')
      } else {
        showNotification(data.message || 'Authentication failed', 'error')
      }
    } catch (error) {
      showNotification('Error during authentication', 'error')
    }
    setLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('csrf-token')
    setAuth({ isAuthenticated: false, user: null, token: null })
    setTransactions([])
    setRules([])
    setStats({})
  }

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  // Categories tab functions
  const loadTaxonomy = async () => {
    try {
      const token = auth.token || localStorage.getItem('token')

      // Load taxonomy and tags in parallel
      const [taxonomyRes, tagsRes] = await Promise.all([
        fetch('/api/categories/manage', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/tags', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (!taxonomyRes.ok) {
        throw new Error(`HTTP error! status: ${taxonomyRes.status}`)
      }

      const taxonomyData = await taxonomyRes.json()
      setTaxonomy(taxonomyData.taxonomy || [])

      // Expand all majors by default
      setExpandedMajor(new Set(taxonomyData.taxonomy?.map((m: MajorCategory) => m.id) || []))

      // Load tags
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json()
        setTagDefinitions(tagsData.tags || [])
      }
    } catch (error) {
      console.error('Failed to load taxonomy:', error)
      showNotification('Failed to load categories', 'error')
    }
  }

  const toggleNamespace = (namespace: string) => {
    const newExpanded = new Set(expandedNamespace)
    if (newExpanded.has(namespace)) {
      newExpanded.delete(namespace)
    } else {
      newExpanded.add(namespace)
    }
    setExpandedNamespace(newExpanded)
  }

  const toggleMajor = (id: string) => {
    const newExpanded = new Set(expandedMajor)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedMajor(newExpanded)
  }

  const toggleCategory = (id: string) => {
    const newExpanded = new Set(expandedCategory)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedCategory(newExpanded)
  }

  const startEditCategory = (id: string, currentValue: string) => {
    setEditingId(id)
    setEditValue(currentValue)
  }

  const cancelEditCategory = () => {
    setEditingId(null)
    setEditValue('')
  }

  const saveEditCategory = async (type: 'major' | 'category' | 'subcategory', id: string) => {
    try {
      const token = auth.token || localStorage.getItem('token')
      const response = await fetch('/api/categories/manage', {
        method: 'PATCH',
        headers: createFetchHeaders(token),
        credentials: 'include',
        body: JSON.stringify({
          type,
          id,
          name: editValue,
        }),
      })

      if (!response.ok) throw new Error('Failed to update')

      await loadTaxonomy()
      showNotification('Updated successfully', 'success')
      cancelEditCategory()
    } catch (error) {
      showNotification('Failed to update', 'error')
    }
  }

  const deleteCategory = async (type: 'category' | 'subcategory', id: string, name: string) => {
    showConfirmDialog('Delete Category', `Are you sure you want to delete "${name}"?`, async () => {
      try {
        const token = auth.token || localStorage.getItem('token')
        const response = await fetch('/api/categories/manage', {
          method: 'DELETE',
          headers: createFetchHeaders(token),
          credentials: 'include',
          body: JSON.stringify({ type, id }),
        })

        if (!response.ok) throw new Error('Failed to delete')

        await loadTaxonomy()
        showNotification(`Deleted ${name}`, 'success')
      } catch (error) {
        showNotification('Failed to delete', 'error')
      }
    })
  }

  const addCategoryToMajor = (majorCategoryId: string) => {
    setSelectedMajorIdForNewCategory(majorCategoryId)
    setShowAddCategoryDialog(true)
  }

  // Bank management functions
  const loadBanks = async () => {
    try {
      const token = auth.token || localStorage.getItem('token')
      const response = await fetch('/api/banks', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to load banks')
      const data = await response.json()
      setBanks(data.banks || [])
    } catch (error) {
      console.error('Error loading banks:', error)
      showNotification('Failed to load banks', 'error')
    }
  }

  const createBank = async () => {
    if (!newBankForm.name) return

    try {
      setSavingBank(true)
      const token = auth.token || localStorage.getItem('token')
      const response = await fetch('/api/banks', {
        method: 'POST',
        headers: createFetchHeaders(token),
        credentials: 'include',
        body: JSON.stringify({
          name: newBankForm.name,
          logo: newBankForm.logo || null,
          color: newBankForm.color || null,
        }),
      })

      if (!response.ok) throw new Error('Failed to create bank')

      await loadBanks()
      setShowNewBankForm(false)
      setNewBankForm({ name: '', logo: '', color: '' })
      showNotification(`Bank "${newBankForm.name}" created successfully!`, 'success')
    } catch (error) {
      showNotification('Failed to create bank', 'error')
    } finally {
      setSavingBank(false)
    }
  }

  const startEditingBank = (bank: any) => {
    setEditingBank(bank)
    setNewBankForm({
      name: bank.name,
      logo: bank.logo || '',
      color: bank.color || '',
    })
    setShowNewBankForm(true)
  }

  const updateBank = async () => {
    if (!editingBank || !newBankForm.name) return

    try {
      setSavingBank(true)
      const token = auth.token || localStorage.getItem('token')
      const response = await fetch('/api/banks', {
        method: 'PUT',
        headers: createFetchHeaders(token),
        credentials: 'include',
        body: JSON.stringify({
          id: editingBank.id,
          name: newBankForm.name,
          logo: newBankForm.logo || null,
          color: newBankForm.color || null,
        }),
      })

      if (!response.ok) throw new Error('Failed to update bank')

      await loadBanks()
      setShowNewBankForm(false)
      setEditingBank(null)
      setNewBankForm({ name: '', logo: '', color: '' })
      showNotification(`Bank "${newBankForm.name}" updated successfully!`, 'success')
    } catch (error) {
      showNotification('Failed to update bank', 'error')
    } finally {
      setSavingBank(false)
    }
  }

  const deleteBank = async (id: string, name: string) => {
    showConfirmDialog('Delete Bank', `Are you sure you want to delete "${name}"?`, async () => {
      try {
        const token = auth.token || localStorage.getItem('token')
        const response = await fetch(`/api/banks?id=${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) throw new Error('Failed to delete bank')

        await loadBanks()
        showNotification(`Bank "${name}" deleted successfully!`, 'success')
      } catch (error) {
        showNotification('Failed to delete bank', 'error')
      }
    })
  }

  const confirmAddCategory = async () => {
    if (!newCategoryName.trim() || !selectedMajorIdForNewCategory) return

    try {
      const name = newCategoryName.trim()
      const token = auth.token || localStorage.getItem('token')
      const response = await fetch('/api/categories/manage', {
        method: 'POST',
        headers: createFetchHeaders(token),
        credentials: 'include',
        body: JSON.stringify({
          type: 'category',
          majorCategoryId: selectedMajorIdForNewCategory,
          name,
        }),
      })

      if (!response.ok) throw new Error('Failed to create')

      await loadTaxonomy()
      showNotification(`Added ${name}`, 'success')

      // Close dialog and reset
      setShowAddCategoryDialog(false)
      setNewCategoryName('')
      setSelectedMajorIdForNewCategory(null)
    } catch (error) {
      showNotification('Failed to add category', 'error')
    }
  }

  const cancelAddCategory = () => {
    setShowAddCategoryDialog(false)
    setNewCategoryName('')
    setSelectedMajorIdForNewCategory(null)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !auth.token) return

    // Store the file and show dialog to ask for origin and bank
    setSelectedFile(file)
    setShowImportDialog(true)
    event.target.value = '' // Reset file input
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (!auth.token) return

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      // Check if file type is supported
      const supportedTypes = ['.xlsx', '.xls', '.csv', '.json', '.pdf']
      const supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png']
      const fileName = file.name.toLowerCase()
      const fileType = file.type.toLowerCase()

      const isSupported =
        supportedTypes.some(type => fileName.endsWith(type)) ||
        supportedImageTypes.includes(fileType)

      if (isSupported) {
        setSelectedFile(file)
        setShowImportDialog(true)
      } else {
        showNotification(
          'Unsupported file type. Please use Excel, CSV, JSON, PDF, or image files.',
          'error'
        )
      }
    }
  }

  const confirmImport = async () => {
    if (!selectedFile || !auth.token) return

    setLoading(true)
    setShowImportDialog(false)
    showNotification('Starting import...', 'info')

    try {
      // Use selected origin and bank
      const origin = importOrigin
      const forcedBank = importBank === 'Auto-detect' ? undefined : importBank

      // Check if file needs AI processing (PDF or image)
      const needsAI = selectedFile.type.includes('pdf') || selectedFile.type.includes('image')

      if (needsAI) {
        showNotification('Processing file with AI...', 'info')
        // Use AI endpoint for PDFs and images
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('origin', origin)
        formData.append('useAI', 'true')
        if (forcedBank) {
          formData.append('bank', forcedBank)
        }

        const headers: Record<string, string> = {
          Authorization: `Bearer ${auth.token}`,
        }

        // Add CSRF token for FormData upload (no Content-Type - browser sets it automatically)
        const csrfToken = typeof window !== 'undefined' ? localStorage.getItem('csrf-token') : null
        if (csrfToken) {
          headers['x-csrf-token'] = csrfToken
        }

        const res = await fetch('/api/ai/parse-file', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: formData,
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.details || 'Failed to parse file')
        }

        const parseResult = await res.json()

        showNotification(`Importing ${parseResult.transactions.length} transactions...`, 'info')

        // Upload transactions
        const uploadRes = await fetch('/api/transactions', {
          method: 'POST',
          headers: createFetchHeaders(auth.token),
          credentials: 'include',
          body: JSON.stringify({ transactions: parseResult.transactions }),
        })

        if (uploadRes.ok) {
          await loadData(auth.token!)
          showNotification(
            `AI imported ${parseResult.transactions.length} transactions from ${parseResult.bank}!`,
            'success'
          )
        } else {
          const error = await uploadRes.json()
          showNotification(`Error: ${error.message}`, 'error')
        }
      } else {
        // Use traditional parsing for Excel/CSV
        const parseResult = await parseFile(selectedFile, origin, forcedBank)

        // Upload transactions
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: createFetchHeaders(auth.token),
          credentials: 'include',
          body: JSON.stringify({ transactions: parseResult.transactions }),
        })

        if (res.ok) {
          await loadData(auth.token!)
          showNotification(
            `Imported ${parseResult.transactions.length} transactions from ${parseResult.bank}!`,
            'success'
          )
        } else {
          const error = await res.json()
          showNotification(`Error: ${error.message}`, 'error')
        }
      }
    } catch (error) {
      showNotification(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      )
    }
    setLoading(false)
    setSelectedFile(null)
  }

  const cancelImport = () => {
    setShowImportDialog(false)
    setSelectedFile(null)
    setImportOrigin('Couple')
    setImportBank('Auto-detect')
  }

  const addManualTransaction = async () => {
    if (!auth.token) return

    // Validate required fields
    if (
      !newTransactionForm.rawDate ||
      !newTransactionForm.rawDescription ||
      !newTransactionForm.rawAmount ||
      !newTransactionForm.bank
    ) {
      showNotification(
        'Please fill in all required fields (Date, Description, Amount, Bank)',
        'error'
      )
      return
    }

    try {
      setLoading(true)

      const transaction = {
        date: newTransactionForm.rawDate,
        description: newTransactionForm.rawDescription,
        amount: parseFloat(newTransactionForm.rawAmount),
        balance: newTransactionForm.rawBalance ? parseFloat(newTransactionForm.rawBalance) : null,
        origin: newTransactionForm.origin,
        bank: newTransactionForm.bank,
      }

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: createFetchHeaders(auth.token),
        credentials: 'include',
        body: JSON.stringify({ transactions: [transaction] }),
      })

      if (res.ok) {
        const result = await res.json()
        const newTransactionId = result.transactions?.[0]?.id

        // If categories were selected and we have the transaction ID, update it with categories and approve it
        if (newTransactionId && newTransactionForm.majorCategoryId) {
          await fetch('/api/transactions', {
            method: 'PATCH',
            headers: createFetchHeaders(auth.token),
            credentials: 'include',
            body: JSON.stringify({
              id: newTransactionId,
              majorCategoryId: newTransactionForm.majorCategoryId,
              categoryId: newTransactionForm.categoryId,
              majorCategory: newTransactionForm.majorCategory,
              category: newTransactionForm.category,
              tags: newTransactionForm.tags,
              status: 'categorized',
              reviewStatus: null, // Immediately approve
              flagged: false,
            }),
          })
        } else if (newTransactionId) {
          // No categories, but still approve it (remove from review)
          await fetch('/api/transactions', {
            method: 'PATCH',
            headers: createFetchHeaders(auth.token),
            credentials: 'include',
            body: JSON.stringify({
              id: newTransactionId,
              reviewStatus: null, // Immediately approve
              flagged: false,
            }),
          })
        }

        await loadData(auth.token!)
        showNotification('Transaction added successfully!', 'success')
        setShowAddTransactionDialog(false)
        // Reset form
        setNewTransactionForm({
          rawDate: new Date(),
          rawDescription: '',
          rawAmount: '',
          rawBalance: '',
          origin: 'Couple',
          bank: '',
          majorCategoryId: null,
          categoryId: null,
          majorCategory: null,
          category: null,
          tags: [],
        })
      } else {
        const error = await res.json()
        showNotification(`Error: ${error.message}`, 'error')
      }
    } catch (error) {
      showNotification(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  const cancelAddTransaction = () => {
    setShowAddTransactionDialog(false)
    setNewTransactionForm({
      rawDate: new Date(),
      rawDescription: '',
      rawAmount: '',
      rawBalance: '',
      origin: 'Couple',
      bank: '',
      majorCategoryId: null,
      categoryId: null,
      majorCategory: null,
      category: null,
      tags: [],
    })
  }

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!auth.token) {
      console.error('[updateTransaction] No auth token')
      showNotification('Session expired. Please log in again.', 'error')
      return
    }

    console.log('[updateTransaction] Starting update', { id, updates })
    console.log(
      '[updateTransaction] CSRF token:',
      localStorage.getItem('csrf-token') ? 'present' : 'missing'
    )

    try {
      const res = await fetch(`/api/transactions`, {
        method: 'PATCH',
        headers: createFetchHeaders(auth.token),
        credentials: 'include',
        body: JSON.stringify({ id, ...updates }),
      })

      console.log('[updateTransaction] Response status:', res.status)

      if (res.ok) {
        await loadData(auth.token!)
        console.log('[updateTransaction] Update successful')
      } else {
        // Parse error response
        const errorData = await res.json()
        console.error('[updateTransaction] API error:', errorData)

        // Handle specific error cases
        if (res.status === 403) {
          // CSRF token error or authorization error
          if (errorData.error?.includes('CSRF')) {
            showNotification('Session expired. Please log in again.', 'error')
            console.error('[updateTransaction] CSRF validation failed:', errorData.details)
          } else {
            showNotification('You do not have permission to edit this transaction.', 'error')
          }
        } else if (res.status === 400) {
          // Validation error (Zod)
          if (errorData.issues && Array.isArray(errorData.issues)) {
            const validationErrors = errorData.issues.map((issue: any) => issue.message).join(', ')
            showNotification(`Validation error: ${validationErrors}`, 'error')
            console.error('[updateTransaction] Validation errors:', errorData.issues)
          } else {
            showNotification(
              errorData.error || errorData.message || 'Invalid transaction data',
              'error'
            )
          }
        } else if (res.status === 401) {
          showNotification('Session expired. Please log in again.', 'error')
        } else {
          showNotification(
            errorData.error || errorData.message || 'Failed to update transaction',
            'error'
          )
        }

        throw new Error(errorData.error || errorData.message || 'Update failed')
      }
    } catch (error) {
      console.error('[updateTransaction] Exception:', error)
      // Only show error if it wasn't already shown above
      if (error instanceof TypeError) {
        showNotification('Network error. Please check your connection.', 'error')
      }
      throw error
    }
  }

  const deleteTransaction = async (id: string) => {
    if (!auth.token) return

    showConfirmDialog(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      async () => {
        try {
          const res = await fetch(`/api/transactions`, {
            method: 'DELETE',
            headers: createFetchHeaders(auth.token),
            credentials: 'include',
            body: JSON.stringify({ id }),
          })

          if (res.ok) {
            await loadData(auth.token!)
            showNotification('Transaction deleted successfully', 'success')
          }
        } catch (error) {
          showNotification('Failed to delete transaction', 'error')
        }
      }
    )
  }

  // Bulk selection handlers for transactions
  const toggleTransactionSelection = (id: string, event?: React.MouseEvent) => {
    // Shift+click for range selection
    if (event?.shiftKey && lastSelectedTransactionId && lastSelectedTransactionId !== id) {
      const currentIndex = filteredAndPaginatedTransactions.findIndex(t => t.id === id)
      const lastIndex = filteredAndPaginatedTransactions.findIndex(
        t => t.id === lastSelectedTransactionId
      )

      if (currentIndex !== -1 && lastIndex !== -1) {
        const startIndex = Math.min(currentIndex, lastIndex)
        const endIndex = Math.max(currentIndex, lastIndex)
        const rangeIds = filteredAndPaginatedTransactions
          .slice(startIndex, endIndex + 1)
          .map(t => t.id)

        setSelectedTransactionIds(prev => {
          const newSet = new Set(prev)
          rangeIds.forEach(rangeId => newSet.add(rangeId))
          return Array.from(newSet)
        })
        setLastSelectedTransactionId(id)
        return
      }
    }

    // Normal toggle
    setSelectedTransactionIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
    setLastSelectedTransactionId(id)
  }

  const toggleAllTransactionSelection = () => {
    if (selectedTransactionIds.length === filteredAndPaginatedTransactions.length) {
      setSelectedTransactionIds([])
    } else {
      setSelectedTransactionIds(filteredAndPaginatedTransactions.map(t => t.id))
    }
  }

  const bulkDeleteTransactions = async () => {
    if (!auth.token || selectedTransactionIds.length === 0) return

    showConfirmDialog(
      'Delete Transactions',
      `Are you sure you want to delete ${selectedTransactionIds.length} transaction(s)?`,
      async () => {
        const total = selectedTransactionIds.length
        setLoading(true)

        try {
          // Delete transactions one by one with progress updates
          for (let i = 0; i < selectedTransactionIds.length; i++) {
            const id = selectedTransactionIds[i]
            showNotification(`Deleting ${i + 1} of ${total} transactions...`, 'info')

            await fetch(`/api/transactions`, {
              method: 'DELETE',
              headers: createFetchHeaders(auth.token),
              credentials: 'include',
              body: JSON.stringify({ id }),
            })
          }

          await loadData(auth.token!)
          setSelectedTransactionIds([])
          showNotification(`✓ Successfully deleted ${total} transaction(s)`, 'success')
        } catch (error) {
          showNotification('Failed to delete transactions', 'error')
        }
        setLoading(false)
      }
    )
  }

  const bulkEditTransactions = async () => {
    // Determine which tab we're in and use appropriate selection
    const isReviewTab = activeTab === 'review'
    const selectedIds = isReviewTab ? selectedReviewIds : selectedTransactionIds
    const transactionsArray = isReviewTab ? reviewTransactions : transactions

    if (!auth.token || selectedIds.length === 0) return

    const total = selectedIds.length
    setLoading(true)

    try {
      // Build updates object - only include fields that were set
      const updates: any = {}
      if (bulkEditForm.majorCategoryId !== undefined)
        updates.majorCategoryId = bulkEditForm.majorCategoryId
      if (bulkEditForm.categoryId !== undefined) updates.categoryId = bulkEditForm.categoryId
      if (bulkEditForm.majorCategory !== undefined)
        updates.majorCategory = bulkEditForm.majorCategory
      if (bulkEditForm.category !== undefined) updates.category = bulkEditForm.category
      if (bulkEditForm.tags !== undefined) updates.tags = bulkEditForm.tags
      if (bulkEditForm.status) updates.status = bulkEditForm.status
      if (bulkEditForm.bank) updates.bank = bulkEditForm.bank
      if (bulkEditForm.origin) updates.origin = bulkEditForm.origin

      // Handle date changes (month/year)
      if (bulkEditForm.month !== undefined || bulkEditForm.year !== undefined) {
        // Will update rawDate for each transaction
        updates._dateUpdate = {
          month: bulkEditForm.month,
          year: bulkEditForm.year,
        }
      }

      // Update each transaction with progress updates
      for (let i = 0; i < selectedIds.length; i++) {
        const id = selectedIds[i]
        showNotification(`Updating ${i + 1} of ${total} transactions...`, 'info')

        const transaction = transactionsArray.find(t => t.id === id)
        if (!transaction) continue

        const finalUpdates = { ...updates }

        // If updating month/year, modify the rawDate
        if (updates._dateUpdate) {
          const currentDate = new Date(transaction.rawDate)
          const newDate = new Date(currentDate)
          if (updates._dateUpdate.month !== undefined && updates._dateUpdate.month !== null) {
            newDate.setMonth(updates._dateUpdate.month - 1) // JS months are 0-indexed
          }
          if (updates._dateUpdate.year !== undefined && updates._dateUpdate.year !== null) {
            newDate.setFullYear(updates._dateUpdate.year)
          }
          finalUpdates.rawDate = newDate
          delete finalUpdates._dateUpdate
        }

        await updateTransaction(id, finalUpdates)
      }

      await loadData(auth.token!)
      // Clear the appropriate selected IDs based on which tab we're in
      if (isReviewTab) {
        setSelectedReviewIds([])
      } else {
        setSelectedTransactionIds([])
      }
      setShowBulkEditDialog(false)
      setBulkEditForm({})
      showNotification(`✓ Successfully updated ${total} transaction(s)`, 'success')
    } catch (error) {
      showNotification('Failed to update transactions', 'error')
    }
    setLoading(false)
  }

  const addRule = async () => {
    if (!auth.token || !newRule.keyword || !newRule.majorCategory || !newRule.category) {
      showNotification('Please fill keyword, major category and category', 'error')
      return
    }

    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: createFetchHeaders(auth.token),
        credentials: 'include',
        body: JSON.stringify(newRule),
      })

      if (res.ok) {
        await loadData(auth.token!)
        setNewRule({ keyword: '', majorCategory: '', category: '', subCategory: '' })
      }
    } catch (error) {
      // Error adding rule
    }
  }

  const deleteRule = async (id: string) => {
    if (!auth.token) return

    showConfirmDialog('Delete Rule', 'Are you sure you want to delete this rule?', async () => {
      try {
        const res = await fetch('/api/rules', {
          method: 'DELETE',
          headers: createFetchHeaders(auth.token),
          credentials: 'include',
          body: JSON.stringify({ id }),
        })

        if (res.ok) {
          await loadData(auth.token!)
          showNotification('Rule deleted successfully', 'success')
        }
      } catch (error) {
        showNotification('Failed to delete rule', 'error')
      }
    })
  }

  const applyCategorization = async () => {
    if (!auth.token) return

    setLoading(true)
    try {
      const res = await fetch('/api/transactions/auto-categorize', {
        method: 'POST',
        headers: createFetchHeaders(auth.token),
      })

      if (res.ok) {
        const result = await res.json()
        showNotification(`Applied rules to ${result.updated} transactions`, 'success')
        await loadData(auth.token!)
      }
    } catch (error) {
      showNotification('Error applying rules', 'error')
    }
    setLoading(false)
  }

  const exportData = () => {
    const csv = exportToCSV(transactions)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleReviewAction = async (action: 'approve' | 'reject') => {
    if (!auth.token || selectedReviewIds.length === 0) return

    setLoading(true)
    try {
      const res = await fetch('/api/transactions/review', {
        method: 'POST',
        headers: createFetchHeaders(auth.token),
        credentials: 'include',
        body: JSON.stringify({ action, transactionIds: selectedReviewIds }),
      })

      if (res.ok) {
        const result = await res.json()
        showNotification(result.message, 'success')
        await loadData(auth.token!)
        setSelectedReviewIds([])
      }
    } catch (error) {
      showNotification('Error processing review action', 'error')
    }
    setLoading(false)
  }

  const toggleReviewSelection = (id: string, event?: React.MouseEvent) => {
    // Range selection with Shift key
    if (event?.shiftKey && lastSelectedReviewId && lastSelectedReviewId !== id) {
      const currentIndex = sortedReviewTransactions.findIndex(t => t.id === id)
      const lastIndex = sortedReviewTransactions.findIndex(t => t.id === lastSelectedReviewId)

      if (currentIndex !== -1 && lastIndex !== -1) {
        const startIndex = Math.min(currentIndex, lastIndex)
        const endIndex = Math.max(currentIndex, lastIndex)
        const rangeIds = sortedReviewTransactions.slice(startIndex, endIndex + 1).map(t => t.id)

        setSelectedReviewIds(prev => {
          const newSet = new Set(prev)
          rangeIds.forEach(rangeId => newSet.add(rangeId))
          return Array.from(newSet)
        })
        setLastSelectedReviewId(id)
        return
      }
    }

    // Normal toggle
    setSelectedReviewIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
    setLastSelectedReviewId(id)
  }

  const toggleAllReviewSelection = () => {
    if (selectedReviewIds.length === sortedReviewTransactions.length) {
      setSelectedReviewIds([])
    } else {
      setSelectedReviewIds(sortedReviewTransactions.map(t => t.id))
    }
  }

  const approveTransaction = async (id: string) => {
    if (!auth.token) return

    setLoading(true)
    try {
      const res = await fetch('/api/transactions/review', {
        method: 'POST',
        headers: createFetchHeaders(auth.token),
        credentials: 'include',
        body: JSON.stringify({ action: 'approve', transactionIds: [id] }),
      })

      if (res.ok) {
        const result = await res.json()
        showNotification('Transaction approved', 'success')
        await loadData(auth.token!)
      }
    } catch (error) {
      showNotification('Failed to approve transaction', 'error')
    }
    setLoading(false)
  }

  const rejectTransaction = async (id: string) => {
    if (!auth.token) return

    setLoading(true)
    try {
      const res = await fetch('/api/transactions/review', {
        method: 'POST',
        headers: createFetchHeaders(auth.token),
        credentials: 'include',
        body: JSON.stringify({ action: 'reject', transactionIds: [id] }),
      })

      if (res.ok) {
        const result = await res.json()
        showNotification('Transaction rejected', 'success')
        await loadData(auth.token!)
      }
    } catch (error) {
      showNotification('Failed to reject transaction', 'error')
    }
    setLoading(false)
  }

  const duplicateTransaction = async (transaction: TransactionWithUser) => {
    if (!auth.token) return

    setLoading(true)

    try {
      // Create the transaction via POST (it will be in review status)
      // Add "(copy)" to description to avoid duplicate detection
      const duplicatedTransaction = {
        date: new Date(transaction.rawDate),
        description: `${transaction.rawDescription} (copy)`,
        amount: transaction.rawAmount,
        balance: transaction.rawBalance,
        origin: transaction.origin,
        bank: transaction.bank,
      }

      const createRes = await fetch('/api/transactions', {
        method: 'POST',
        headers: createFetchHeaders(auth.token),
        credentials: 'include',
        body: JSON.stringify({ transactions: [duplicatedTransaction] }),
      })

      if (!createRes.ok) {
        const errorData = await createRes.json()
        showNotification(`Error: ${errorData.message || 'Failed to duplicate'}`, 'error')
        setLoading(false)
        return
      }

      const createResult = await createRes.json()
      const newTransactionIds = createResult.transactions?.map((t: any) => t.id) || []

      // Copy categories to the new transaction
      if (newTransactionIds.length > 0 && transaction.majorCategoryId) {
        await fetch('/api/transactions', {
          method: 'PATCH',
          headers: createFetchHeaders(auth.token),
          credentials: 'include',
          body: JSON.stringify({
            id: newTransactionIds[0],
            majorCategoryId: transaction.majorCategoryId,
            categoryId: transaction.categoryId,
            majorCategory: transaction.majorCategory,
            category: transaction.category,
            tags: transaction.tags || [],
            status: 'categorized',
          }),
        })
      }

      // Immediately approve the duplicated transaction so it appears in the main list
      if (newTransactionIds.length > 0) {
        await fetch('/api/transactions/review', {
          method: 'POST',
          headers: createFetchHeaders(auth.token),
          credentials: 'include',
          body: JSON.stringify({
            action: 'approve',
            transactionIds: newTransactionIds,
          }),
        })
      }

      await loadData(auth.token!)
      showNotification('Transaction duplicated successfully!', 'success')
    } catch (error) {
      showNotification('Error duplicating transaction', 'error')
      console.error('Duplicate error:', error)
    }

    setLoading(false)
  }

  const addAsRule = async (transaction: TransactionWithUser) => {
    if (!auth.token || !transaction.majorCategory || !transaction.category) {
      showNotification('Transaction must have a category to create a rule', 'error')
      return
    }

    const keyword = transaction.rawDescription.split(' ')[0].toLowerCase()

    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: createFetchHeaders(auth.token),
        credentials: 'include',
        body: JSON.stringify({
          keyword: keyword,
          majorCategory: transaction.majorCategory,
          category: transaction.category,
          subCategory: transaction.subCategory || '',
        }),
      })

      if (res.ok) {
        await loadData(auth.token!)
        showNotification('Rule created successfully!', 'success')
      }
    } catch (error) {
      showNotification('Error creating rule', 'error')
    }
  }

  const startEditing = (transaction: TransactionWithUser) => {
    setEditingId(transaction.id)
    setEditForm({
      // Core transaction fields
      rawDate: transaction.rawDate,
      rawDescription: transaction.rawDescription,
      rawAmount: transaction.rawAmount,
      origin: transaction.origin,
      bank: transaction.bank,
      notes: transaction.notes,

      // Text-based categories (backward compatibility)
      majorCategory: transaction.majorCategory,
      category: transaction.category,

      // ID-based categories (primary)
      majorCategoryId: transaction.majorCategoryId,
      categoryId: transaction.categoryId,

      // Tags (replaces subcategory)
      tags: transaction.tags || [],
    })
  }

  const saveEdit = async () => {
    if (!auth.token || !editingId) return

    // Validate first
    const validation = validateEditForm()
    if (!validation.valid) {
      setValidationErrors(validation.errors)
      showNotification(`Cannot save: ${validation.errors.join(', ')}`, 'error')
      return
    }

    setSavingEdit(true)
    setValidationErrors([])

    try {
      await updateTransaction(editingId, editForm)
      setEditingId(null)
      setEditForm({})
      showNotification('Transaction updated successfully!', 'success')
    } catch (error) {
      // Error already shown by updateTransaction, just log it
      console.error('[saveEdit] Update failed:', error)
      // Keep edit mode open so user can try again or fix issues
    } finally {
      setSavingEdit(false)
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const validateEditForm = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (!editForm.rawDate) {
      errors.push('Date is required')
    }

    if (!editForm.rawDescription?.trim()) {
      errors.push('Description cannot be empty')
    }

    if (
      editForm.rawAmount === undefined ||
      editForm.rawAmount === null ||
      isNaN(editForm.rawAmount)
    ) {
      errors.push('Valid amount is required')
    }

    if (!editForm.origin || !editForm.origin.trim()) {
      errors.push('Please select a valid origin')
    }

    if (!editForm.bank?.trim()) {
      errors.push('Bank name is required')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  const toggleFlag = async (id: string, currentFlagged: boolean) => {
    if (!auth.token) return

    await updateTransaction(id, { flagged: !currentFlagged })
  }

  // Get unique origins for filter - include all available origins
  const allOrigins = ['Personal', 'Joint', 'Family', 'Other']
  const uniqueOrigins = Array.from(
    new Set([...allOrigins, ...transactions.map(t => t.origin)])
  ).sort()

  // Get unique banks for filter
  const uniqueBanks = Array.from(new Set(transactions.map(t => t.bank))).sort()

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false

    // Category filters (2-level)
    if (filterMajorCategory !== 'all' && t.majorCategory !== filterMajorCategory) return false
    if (filterCategory !== 'all' && t.category !== filterCategory) return false
    // Tags filter - check if transaction has all selected filter tags
    if (filterTags.length > 0 && !filterTags.every(tag => (t.tags || []).includes(tag)))
      return false

    if (filterFlagged === 'flagged' && !t.flagged) return false
    if (filterFlagged === 'unflagged' && t.flagged) return false
    if (searchTerm && !t.rawDescription.toLowerCase().includes(searchTerm.toLowerCase()))
      return false

    // Date filters
    if (filterDateFrom && new Date(t.rawDate) < filterDateFrom) return false
    if (filterDateTo && new Date(t.rawDate) > filterDateTo) return false

    // Origin filter
    if (filterOrigin !== 'all' && t.origin !== filterOrigin) return false

    // Bank filter
    if (filterBank !== 'all' && t.bank !== filterBank) return false

    return true
  })

  // Sorting
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let comparison = 0

    switch (sortField) {
      case 'date':
        comparison = new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime()
        break
      case 'amount':
        comparison = a.rawAmount - b.rawAmount
        break
      case 'description':
        comparison = a.rawDescription.localeCompare(b.rawDescription)
        break
      case 'origin':
        comparison = a.origin.localeCompare(b.origin)
        break
      case 'bank':
        comparison = a.bank.localeCompare(b.bank)
        break
    }

    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Pagination
  const totalPages = Math.ceil(sortedTransactions.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex)
  const filteredAndPaginatedTransactions = paginatedTransactions // Alias for bulk selection

  // Sorting for Review transactions
  const sortedReviewTransactions = [...reviewTransactions].sort((a, b) => {
    let comparison = 0

    switch (sortField) {
      case 'date':
        comparison = new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime()
        break
      case 'amount':
        comparison = a.rawAmount - b.rawAmount
        break
      case 'description':
        comparison = a.rawDescription.localeCompare(b.rawDescription)
        break
      case 'origin':
        comparison = a.origin.localeCompare(b.origin)
        break
      case 'bank':
        comparison = a.bank.localeCompare(b.bank)
        break
    }

    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [
    filterStatus,
    filterMajorCategory,
    filterCategory,
    filterTags,
    filterFlagged,
    searchTerm,
    filterDateFrom,
    filterDateTo,
    filterOrigin,
    filterBank,
    pageSize,
  ])

  // Load taxonomy and banks when categories tab is active
  useEffect(() => {
    if (activeTab === 'categories' && auth.isAuthenticated) {
      loadTaxonomy()
      loadBanks()
    }
  }, [activeTab, auth.isAuthenticated])

  // Load banks on authentication for import dialog
  useEffect(() => {
    if (auth.isAuthenticated) {
      loadBanks()
    }
  }, [auth.isAuthenticated])

  // Show loading screen while checking auth to prevent flash
  if (!authChecked) {
    return <div className="min-h-screen bg-slate-900" />
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 w-full max-w-md border border-gray-200 dark:border-slate-700">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">🦤 Moneto</h1>
            <p className="text-gray-600 dark:text-slate-300">Smart expense tracking</p>
          </div>

          {/* Show error/success notifications on login screen */}
          {notification && (
            <div
              className={`mb-4 p-3 rounded-lg border-2 flex items-center gap-2 ${
                notification.type === 'success'
                  ? 'bg-emerald-500/90 border-emerald-400 text-white'
                  : notification.type === 'error'
                    ? 'bg-red-500/90 border-red-400 text-white'
                    : 'bg-blue-500/90 border-blue-400 text-white'
              }`}
            >
              <span className="font-semibold">{notification.message}</span>
            </div>
          )}

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Your Name"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              className="w-full px-4 py-2 border-2 border-white/80 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-800 text-indigo-950 dark:text-white"
            />

            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                placeholder="PIN"
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                className="w-full px-4 py-2 border-2 border-white/80 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-800 text-indigo-950 dark:text-white pr-10"
                onKeyPress={e => e.key === 'Enter' && handleAuth()}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-300"
              >
                {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              onClick={handleAuth}
              disabled={loading || !pinInput || !nameInput}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : showLogin ? 'Login' : 'Register'}
            </button>

            <button
              onClick={() => setShowLogin(!showLogin)}
              className="w-full text-blue-600 hover:text-blue-700 py-2"
            >
              {showLogin ? 'Need to register?' : 'Already have an account?'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-slate-900 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 relative overflow-hidden"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border-2 flex items-center gap-3 transition-all duration-300 ${
            notification.type === 'info' ? 'animate-pulse' : 'animate-bounce'
          } ${
            notification.type === 'success'
              ? 'bg-emerald-500/90 border-emerald-400 text-white'
              : notification.type === 'error'
                ? 'bg-red-500/90 border-red-400 text-white'
                : 'bg-blue-500/90 border-blue-400 text-white'
          }`}
        >
          {notification.type === 'success' && <CheckSquare size={20} />}
          {notification.type === 'error' && <Trash2 size={20} />}
          {notification.type === 'info' && (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
          )}
          <span className="font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 border-2 border-indigo-200 dark:border-indigo-700">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 dark:border-indigo-700 border-t-indigo-600 dark:border-t-indigo-400"></div>
            <p className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
              Processing...
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Please wait</p>
          </div>
        </div>
      )}

      {/* Drag and Drop Overlay */}
      {isDragging && (
        <div className="fixed inset-0 bg-indigo-500/20 dark:bg-indigo-500/30 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-12 flex flex-col items-center gap-6 border-4 border-dashed border-indigo-500 dark:border-indigo-400">
            <Upload size={64} className="text-indigo-600 dark:text-indigo-400" />
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-900 dark:text-white mb-2">
                Drop your file here
              </p>
              <p className="text-sm text-indigo-700 dark:text-slate-300">
                Excel, CSV, JSON, PDF, or images supported
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dark Mode Ambient Blobs */}
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-purple-600/20 dark:bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <header className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md shadow-sm border-b border-white/50 dark:border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-indigo-950 dark:text-white">🦤 Moneto</h1>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/cash-flow"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-medium hover:shadow-lg hover:scale-105 transition-all shadow-sm"
                title="Cash Flow View"
              >
                <TrendingUp size={18} />
                <span className="hidden sm:inline">Cash Flow</span>
              </a>
              <button
                onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
                className="px-3 py-2 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl text-indigo-950 dark:text-white hover:shadow-md transition-all shadow-sm flex items-center gap-1.5 text-sm font-medium"
                title={language === 'pt' ? 'Switch to English' : 'Mudar para Português'}
              >
                <Languages size={16} />
                <span className={language === 'pt' ? 'font-bold' : 'opacity-50'}>PT</span>
                <span className="opacity-50">/</span>
                <span className={language === 'en' ? 'font-bold' : 'opacity-50'}>EN</span>
              </button>
              <button
                onClick={toggleDarkMode}
                className="p-2.5 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl text-indigo-950 dark:text-white hover:shadow-md transition-all shadow-sm"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl text-indigo-950 dark:text-white font-medium hover:shadow-md transition-all shadow-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        {/* Navigation Tabs - Modern Glass Pill Design */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex gap-2 p-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 dark:border-white/10">
            {[
              { id: 'transactions', name: 'Transactions', icon: FileText },
              { id: 'review', name: 'Review', icon: CheckSquare, badge: reviewTransactions.length },
              { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
              { id: 'rules', name: 'Rules', icon: Settings },
              { id: 'categories', name: 'Categories', icon: FolderTree },
            ].map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50 scale-105'
                      : 'text-indigo-900/70 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50 hover:scale-105'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'animate-pulse' : ''} />
                  <span>{tab.name}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full ${
                        isActive ? 'bg-white text-indigo-600' : 'bg-red-500 text-white'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            {/* Filters - Enhanced */}
            <div className="bg-gradient-to-br from-white/70 to-white/50 dark:from-slate-800/70 dark:to-slate-800/50 backdrop-blur-md rounded-3xl shadow-lg p-6 border border-white/60 dark:border-white/20 relative z-10">
              {/* Header with Actions */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-bold text-indigo-950 dark:text-white uppercase tracking-wide">
                    Filters
                  </h3>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddTransactionDialog(true)}
                    className="group relative bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-xl hover:shadow-lg flex items-center gap-2 transition-all duration-200 hover:scale-105 text-sm font-semibold"
                    disabled={loading}
                  >
                    <Plus size={16} />
                    <span>Add</span>
                  </button>

                  <label className="group relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:shadow-lg cursor-pointer flex items-center gap-2 transition-all duration-200 hover:scale-105 text-sm font-semibold">
                    <Upload size={16} />
                    <span>Import</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv,.json,.pdf,image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={loading}
                    />
                  </label>

                  <button
                    onClick={exportData}
                    className="group bg-white dark:bg-slate-700 border-2 border-indigo-200 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl hover:shadow-lg flex items-center gap-2 transition-all duration-200 hover:scale-105 text-sm font-semibold"
                  >
                    <Download size={16} />
                    <span>Export</span>
                  </button>

                  <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 px-4 py-2 rounded-xl border border-emerald-500/20 dark:border-emerald-500/30">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                        {transactions.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Bar - Full Width */}
              <div className="mb-6">
                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400 dark:text-indigo-500 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400" />
                  <input
                    type="text"
                    placeholder="Search transactions by description..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-gradient-to-r from-white to-indigo-50/30 dark:from-slate-800 dark:to-slate-800 border-2 border-indigo-100 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md focus:shadow-xl transition-all text-indigo-950 dark:text-white font-medium placeholder:text-indigo-400 dark:placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 text-base"
                  />
                </div>
              </div>

              {/* Essential Filters Card */}
              <div className="bg-gradient-to-br from-white to-indigo-50/20 dark:from-slate-800/50 dark:to-slate-800/30 border-2 border-indigo-100 dark:border-slate-700 rounded-2xl p-5 mb-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">
                      Filters & Search
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Clear All
                      </button>
                    )}
                    <button
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      {showAdvancedFilters ? 'Hide' : 'Show'} Advanced
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                {/* Essential Filters Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Select
                    value={filterStatus}
                    onChange={val => setFilterStatus(val)}
                    options={[
                      { value: 'all', label: '📊 All Status' },
                      { value: 'pending', label: '⏳ Pending' },
                      { value: 'categorized', label: '✅ Categorized' },
                    ]}
                    placeholder="Status"
                  />

                  <div className="md:col-span-2">
                    <DateInput
                      value={filterDateFrom}
                      onChange={setFilterDateFrom}
                      placeholder="From Date (DD/MM/YYYY)"
                      className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 border-2 border-white/80 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md focus:shadow-lg transition-all text-indigo-950 dark:text-white font-medium focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400"
                    />
                  </div>

                  <DateInput
                    value={filterDateTo}
                    onChange={setFilterDateTo}
                    placeholder="To Date (DD/MM/YYYY)"
                    className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 border-2 border-white/80 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md focus:shadow-lg transition-all text-indigo-950 dark:text-white font-medium focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400"
                  />

                  <Select
                    value={sortField}
                    onChange={val => setSortField(val as any)}
                    options={[
                      { value: 'date', label: '📅 Sort by Date' },
                      { value: 'amount', label: '💰 Sort by Amount' },
                      { value: 'description', label: '📝 Sort by Description' },
                      { value: 'origin', label: '👤 Sort by Origin' },
                      { value: 'bank', label: '🏦 Sort by Bank' },
                    ]}
                    placeholder="Sort by"
                  />

                  <Select
                    value={sortDirection}
                    onChange={val => setSortDirection(val as any)}
                    options={[
                      { value: 'desc', label: '⬇️ Descending' },
                      { value: 'asc', label: '⬆️ Ascending' },
                    ]}
                    placeholder="Order"
                  />
                </div>

                {/* Advanced Filters (Collapsible) */}
                {showAdvancedFilters && (
                  <div className="mt-4 pt-4 border-t border-indigo-100 dark:border-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Origin & Bank */}
                      <Select
                        value={filterOrigin}
                        onChange={val => setFilterOrigin(val)}
                        options={[
                          { value: 'all', label: '👥 All Origins' },
                          ...uniqueOrigins.map(o => ({
                            value: o,
                            label: o,
                          })),
                        ]}
                        placeholder="Origin"
                      />

                      <Select
                        value={filterBank}
                        onChange={val => setFilterBank(val)}
                        options={[
                          { value: 'all', label: '🏦 All Banks' },
                          ...uniqueBanks.map(b => ({
                            value: b,
                            label: b,
                          })),
                        ]}
                        placeholder="Bank"
                      />

                      <Select
                        value={filterFlagged}
                        onChange={val => setFilterFlagged(val)}
                        options={[
                          { value: 'all', label: '🎯 All Flags' },
                          { value: 'flagged', label: '🚩 Flagged' },
                          { value: 'unflagged', label: '✓ Not Flagged' },
                        ]}
                        placeholder="Flags"
                      />

                      {/* Category Filters */}
                      <Select
                        value={filterMajorCategory}
                        onChange={val => {
                          setFilterMajorCategory(val)
                          setFilterCategory('all')
                        }}
                        options={[
                          { value: 'all', label: '📁 All Major Categories' },
                          ...taxonomy.map(major => ({
                            value: major.name,
                            label: `${major.emoji || '📁'} ${major.name}`,
                          })),
                        ]}
                        placeholder="Major Category"
                      />

                      <Select
                        value={filterCategory}
                        onChange={val => setFilterCategory(val)}
                        options={[
                          { value: 'all', label: '📂 All Categories' },
                          ...(filterMajorCategory !== 'all'
                            ? (
                                taxonomy.find(mc => mc.name === filterMajorCategory)?.categories ||
                                []
                              ).map(cat => ({
                                value: cat.name,
                                label: cat.name,
                              }))
                            : taxonomy
                                .flatMap(mc => mc.categories)
                                .map(cat => ({
                                  value: cat.name,
                                  label: cat.name,
                                }))),
                        ]}
                        placeholder="Category"
                        disabled={filterMajorCategory === 'all'}
                      />

                      {/* Page Size */}
                      <Select
                        value={pageSize.toString()}
                        onChange={val => setPageSize(parseInt(val))}
                        options={[
                          { value: '10', label: '📄 10 rows per page' },
                          { value: '20', label: '📄 20 rows per page' },
                          { value: '50', label: '📄 50 rows per page' },
                          { value: '100', label: '📄 100 rows per page' },
                        ]}
                        placeholder="Page Size"
                      />

                      {/* Clear Advanced Filters Button */}
                      {(filterOrigin !== 'all' ||
                        filterBank !== 'all' ||
                        filterFlagged !== 'all' ||
                        filterMajorCategory !== 'all' ||
                        filterCategory !== 'all' ||
                        filterTags.length > 0) && (
                        <button
                          onClick={() => {
                            setFilterOrigin('all')
                            setFilterBank('all')
                            setFilterFlagged('all')
                            setFilterMajorCategory('all')
                            setFilterCategory('all')
                            setFilterTags([])
                          }}
                          className="px-4 py-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-2xl hover:bg-red-200 dark:hover:bg-red-900/30 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                        >
                          <span>✕</span> Clear Advanced Filters
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bulk Actions Toolbar */}
            {selectedTransactionIds.length > 0 && (
              <div className="bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700 rounded-2xl p-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                      {selectedTransactionIds.length} transaction
                      {selectedTransactionIds.length > 1 ? 's' : ''} selected
                    </span>
                    <button
                      onClick={() => setSelectedTransactionIds([])}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 underline"
                    >
                      Clear selection
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowBulkEditDialog(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Bulk Edit
                    </button>
                    <button
                      onClick={bulkDeleteTransactions}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Transactions Table */}
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl shadow-sm overflow-visible border border-white/50 dark:border-white/10">
              <div className={editingId ? 'overflow-visible' : 'overflow-x-auto'}>
                <table className="min-w-full divide-y divide-white/50 dark:divide-white/10">
                  <thead className="bg-white/50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3 w-12">
                        <input
                          type="checkbox"
                          checked={
                            selectedTransactionIds.length ===
                              filteredAndPaginatedTransactions.length &&
                            filteredAndPaginatedTransactions.length > 0
                          }
                          onChange={toggleAllTransactionSelection}
                          className="w-4 h-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300 uppercase tracking-wider w-28">
                        Date
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-indigo-900 dark:text-slate-300 uppercase tracking-wider w-20">
                        Origin
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300 uppercase tracking-wider w-16">
                        Bank
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300 uppercase tracking-wider w-20">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300 uppercase tracking-wider w-44">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300 uppercase tracking-wider w-32">
                        Tags
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300 uppercase tracking-wider w-28">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300 uppercase tracking-wider w-32">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/50 dark:bg-transparent divide-y divide-indigo-50 dark:divide-white/5">
                    {paginatedTransactions.map(transaction => {
                      const isIncome = transaction.rawAmount > 0
                      return (
                        <tr
                          key={transaction.id}
                          className={`group transition-all duration-200 ${
                            transaction.flagged
                              ? 'bg-amber-50/50 dark:bg-amber-500/5 border-l-4 border-l-amber-500 hover:bg-amber-100/50 dark:hover:bg-amber-500/10'
                              : isIncome
                                ? 'hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5 border-l-4 border-l-transparent hover:border-l-emerald-500'
                                : 'hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 border-l-4 border-l-transparent hover:border-l-indigo-500'
                          }`}
                        >
                          {editingId === transaction.id ? (
                            <>
                              <td className="px-4 py-3 relative z-50" colSpan={8}>
                                <div className="flex flex-col gap-3 bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-200 dark:border-indigo-700 relative z-50">
                                  {/* Validation Errors */}
                                  {validationErrors.length > 0 && (
                                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg">
                                      <div className="flex items-start gap-2">
                                        <span className="text-red-600 dark:text-red-400 font-bold text-sm">
                                          ⚠️
                                        </span>
                                        <div className="flex-1">
                                          <div className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">
                                            Please fix the following issues:
                                          </div>
                                          <ul className="list-disc list-inside text-xs text-red-600 dark:text-red-300 space-y-0.5">
                                            {validationErrors.map((error, i) => (
                                              <li key={i}>{error}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Row 1: Date, Origin, Bank */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                      <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-1.5">
                                        Date *
                                      </label>
                                      <DateInput
                                        value={editForm.rawDate}
                                        onChange={date =>
                                          setEditForm({ ...editForm, rawDate: date ?? undefined })
                                        }
                                        disabled={savingEdit}
                                        required
                                        placeholder="DD/MM/YYYY"
                                        className="w-full px-3 py-2 text-sm border-2 border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-slate-700 text-indigo-950 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-1.5">
                                        Origin *
                                      </label>
                                      <div className="relative">
                                        <select
                                          value={editForm.origin || ''}
                                          onChange={e =>
                                            setEditForm({ ...editForm, origin: e.target.value })
                                          }
                                          disabled={savingEdit}
                                          className="w-full pl-3 pr-9 py-2.5 text-sm font-medium border-2 border-indigo-200 dark:border-indigo-700 rounded-xl bg-gradient-to-br from-white to-indigo-50/30 dark:from-slate-700 dark:to-slate-700/50 text-indigo-950 dark:text-white shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-400 dark:focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
                                        >
                                          <option value="Personal">Personal</option>
                                          <option value="Joint">Joint</option>
                                          <option value="Couple">Couple</option>
                                          <option value="Other">Other</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 dark:text-indigo-400 pointer-events-none" />
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-1.5">
                                        Bank *
                                      </label>
                                      <BankSelector
                                        value={editForm.bank || ''}
                                        onChange={bankName =>
                                          setEditForm({ ...editForm, bank: bankName })
                                        }
                                        token={auth.token || ''}
                                        disabled={savingEdit}
                                      />
                                    </div>
                                  </div>

                                  {/* Row 2: Category & Tags - Clear visual separation */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Category Section - Structural */}
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                                      <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                                        <span className="text-base">📁</span>
                                        {language === 'en' ? 'Category' : 'Categoria'}
                                      </label>
                                      <CategorySelector
                                        majorCategoryId={
                                          editForm.majorCategoryId || transaction.majorCategoryId
                                        }
                                        categoryId={editForm.categoryId || transaction.categoryId}
                                        onChange={selection => {
                                          setEditForm({
                                            ...editForm,
                                            majorCategoryId: selection.majorCategoryId,
                                            categoryId: selection.categoryId,
                                            majorCategory: selection.majorCategory,
                                            category: selection.category,
                                          })
                                        }}
                                        token={auth.token || ''}
                                        language={language}
                                      />
                                      <p className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                                        {language === 'en'
                                          ? 'Where does this expense belong?'
                                          : 'Onde se encaixa esta despesa?'}
                                      </p>
                                    </div>

                                    {/* Tags Section - Metadata */}
                                    <div className="p-3 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl border-2 border-indigo-200 dark:border-indigo-800">
                                      <TagsLabel language={language} className="mb-2" />
                                      <TagSelector
                                        selectedTags={editForm.tags || transaction.tags || []}
                                        onChange={tags => setEditForm({ ...editForm, tags })}
                                        token={auth.token || ''}
                                        language={language}
                                        disabled={savingEdit}
                                      />
                                      <p className="mt-1.5 text-[10px] text-indigo-500 dark:text-indigo-400">
                                        {language === 'en'
                                          ? 'Add details: vehicle, trip, provider...'
                                          : 'Detalhes: veículo, viagem, fornecedor...'}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Row 3: Description & Notes */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-1.5">
                                        Description *
                                      </label>
                                      <input
                                        type="text"
                                        value={editForm.rawDescription || ''}
                                        onChange={e =>
                                          setEditForm({
                                            ...editForm,
                                            rawDescription: e.target.value,
                                          })
                                        }
                                        disabled={savingEdit}
                                        placeholder="Transaction description"
                                        className="w-full px-3 py-2 text-sm border-2 border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-slate-700 text-indigo-950 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-1.5">
                                        Notes
                                      </label>
                                      <input
                                        type="text"
                                        value={editForm.notes || ''}
                                        onChange={e =>
                                          setEditForm({ ...editForm, notes: e.target.value })
                                        }
                                        disabled={savingEdit}
                                        placeholder="Optional notes"
                                        className="w-full px-3 py-2 text-sm border-2 border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-slate-700 text-indigo-950 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                      />
                                    </div>
                                  </div>

                                  {/* Row 4: Amount */}
                                  <div className="w-full md:w-1/3">
                                    <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-1.5">
                                      Amount (€) *
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={
                                        editForm.rawAmount !== undefined ? editForm.rawAmount : ''
                                      }
                                      onChange={e => {
                                        const value = e.target.value
                                        // Allow empty, minus sign, and valid numbers
                                        if (value === '' || value === '-') {
                                          setEditForm({ ...editForm, rawAmount: value as any })
                                        } else {
                                          const parsed = parseFloat(value)
                                          setEditForm({
                                            ...editForm,
                                            rawAmount: isNaN(parsed) ? 0 : parsed,
                                          })
                                        }
                                      }}
                                      disabled={savingEdit}
                                      placeholder="0.00"
                                      className="w-full px-3 py-2 text-sm border-2 border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-slate-700 text-indigo-950 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-3 border-t border-indigo-200 dark:border-indigo-700">
                                    <button
                                      onClick={saveEdit}
                                      disabled={savingEdit}
                                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                                    >
                                      {savingEdit ? (
                                        <>
                                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                          <span>Saving...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Save size={16} />
                                          <span>Save Changes</span>
                                        </>
                                      )}
                                    </button>

                                    <button
                                      onClick={cancelEdit}
                                      disabled={savingEdit}
                                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-indigo-950 dark:text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={selectedTransactionIds.includes(transaction.id)}
                                  onClick={e => toggleTransactionSelection(transaction.id, e)}
                                  onChange={() => {}}
                                  className="w-4 h-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                                  {formatDate(transaction.rawDate)}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex justify-center items-center">
                                  <OriginAvatar origin={transaction.origin} size="sm" />
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                                  {transaction.bank || 'N/A'}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-base font-semibold ${
                                    transaction.status === 'categorized'
                                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                      : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                  }`}
                                  title={
                                    transaction.status === 'categorized'
                                      ? 'Categorized'
                                      : 'Pending categorization'
                                  }
                                >
                                  <span>{transaction.status === 'categorized' ? '✓' : '⏳'}</span>
                                </span>
                              </td>
                              {/* Category Column */}
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-1.5 min-w-[140px] max-w-[180px]">
                                  {transaction.majorCategory ? (
                                    <>
                                      <CategoryBadgeCompact
                                        majorCategory={transaction.majorCategory}
                                        category={transaction.category}
                                        majorEmoji={transaction.majorCategoryRef?.emoji}
                                        language={language}
                                      />
                                      {transaction.classifierConfidence && (
                                        <ConfidenceBadge
                                          confidence={transaction.classifierConfidence}
                                          reasoning={transaction.classifierReasoning}
                                        />
                                      )}
                                    </>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium text-gray-400 dark:text-slate-500 italic">
                                        {language === 'en' ? 'Not categorized' : 'Sem categoria'}
                                      </span>
                                      {transaction.status === 'pending' && (
                                        <AIClassifier
                                          transactionId={transaction.id}
                                          token={auth.token || ''}
                                          onClassified={() => refreshTransaction(transaction.id)}
                                        />
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                              {/* Tags Column */}
                              <td className="px-4 py-3">
                                <div className="min-w-[80px] max-w-[120px]">
                                  <TagBadges
                                    tags={transaction.tags || []}
                                    language={language}
                                    maxDisplay={3}
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-0.5">
                                  <div className="text-sm font-medium text-indigo-950 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                                    {transaction.rawDescription}
                                  </div>
                                  {transaction.notes && (
                                    <div className="text-xs text-indigo-600 dark:text-indigo-400 italic">
                                      {transaction.notes}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <span
                                  className={`font-semibold text-sm tabular-nums ${
                                    isIncome
                                      ? 'text-emerald-700 dark:text-emerald-400'
                                      : 'text-rose-700 dark:text-rose-400'
                                  }`}
                                >
                                  {formatCurrency(
                                    Math.abs(transaction.rawAmount),
                                    Math.abs(transaction.rawAmount) % 1 === 0 ? 0 : 2
                                  )}
                                </span>
                              </td>
                            </>
                          )}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {editingId === transaction.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={saveEdit}
                                  disabled={savingEdit}
                                  className="p-1 text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={savingEdit ? 'Saving...' : 'Save'}
                                >
                                  {savingEdit ? (
                                    <div className="animate-spin h-3.5 w-3.5 border-2 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full" />
                                  ) : (
                                    <Save size={14} />
                                  )}
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  disabled={savingEdit}
                                  className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Cancel"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() =>
                                    toggleFlag(
                                      transaction.id,
                                      transaction.flagged || !transaction.majorCategory
                                    )
                                  }
                                  className={`p-1 transition-colors ${
                                    transaction.flagged || !transaction.majorCategory
                                      ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'
                                      : 'text-gray-400 hover:text-amber-600 dark:text-slate-500 dark:hover:text-amber-400'
                                  }`}
                                  title={
                                    transaction.flagged || !transaction.majorCategory
                                      ? 'Unflag'
                                      : 'Flag for review'
                                  }
                                >
                                  <Flag
                                    size={14}
                                    fill={
                                      transaction.flagged || !transaction.majorCategory
                                        ? 'currentColor'
                                        : 'none'
                                    }
                                  />
                                </button>
                                <button
                                  onClick={() => startEditing(transaction)}
                                  className="p-1 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                                  title="Edit"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => duplicateTransaction(transaction)}
                                  className="p-1 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                  title="Duplicate"
                                >
                                  <Copy size={14} />
                                </button>
                                <button
                                  onClick={() => addAsRule(transaction)}
                                  className="p-1 text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                                  title="Add as Rule"
                                >
                                  <Plus size={14} />
                                </button>
                                <button
                                  onClick={() => deleteTransaction(transaction.id)}
                                  className="p-1 text-rose-600 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-300 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {filteredTransactions.length === 0 && (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-full mb-6 animate-pulse">
                    <FileText size={40} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-indigo-900 dark:text-white mb-2">
                    No transactions yet
                  </h3>
                  <p className="text-indigo-700/60 dark:text-slate-400 mb-6 max-w-md mx-auto">
                    Get started by importing your first transaction file. We support Excel, CSV,
                    JSON, PDF, and image formats with AI-powered parsing.
                  </p>
                  <div className="flex flex-col items-center gap-3">
                    <select
                      value={importOrigin}
                      onChange={e => setImportOrigin(e.target.value)}
                      className="bg-white dark:bg-slate-700 border-2 border-indigo-200 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Couple">💑 Couple</option>
                      <option value="Personal">Personal</option>
                      <option value="Joint">Joint</option>
                      <option value="Family">Family</option>
                      <option value="Couple">🏠 Couple</option>
                    </select>
                    <label className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold hover:shadow-xl hover:shadow-indigo-500/50 cursor-pointer transition-all duration-300 hover:scale-105">
                      <Upload size={20} />
                      <span>Import Your First File</span>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv,.json,.pdf,image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={loading}
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border-t border-white/50 dark:border-white/10">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-5 py-2.5 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl text-indigo-950 dark:text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md dark:hover:bg-slate-800/80 transition-all shadow-sm"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-indigo-900/70 dark:text-slate-300 font-medium px-4">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-5 py-2.5 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl text-indigo-950 dark:text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md dark:hover:bg-slate-800/80 transition-all shadow-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' &&
          (() => {
            // Filter transactions based on date range
            const getFilteredTransactions = () => {
              const now = new Date()
              const cutoffDate = new Date()

              switch (dashboardDateRange) {
                case '1m':
                  cutoffDate.setMonth(now.getMonth() - 1)
                  break
                case '3m':
                  cutoffDate.setMonth(now.getMonth() - 3)
                  break
                case '6m':
                  cutoffDate.setMonth(now.getMonth() - 6)
                  break
                case '1y':
                  cutoffDate.setFullYear(now.getFullYear() - 1)
                  break
                default:
                  cutoffDate.setFullYear(1970)
              }

              return transactions.filter(t => {
                const transDate = new Date(t.rawDate)
                const matchesDate = transDate >= cutoffDate
                const matchesOrigin =
                  dashboardOriginFilter === 'all' || t.origin === dashboardOriginFilter
                return matchesDate && matchesOrigin
              })
            }

            const filtered = getFilteredTransactions()
            const income = filtered.filter(t => t.rawAmount > 0)
            const expenses = filtered.filter(t => t.rawAmount < 0)
            const totalIncome = income.reduce((sum, t) => sum + t.rawAmount, 0)
            const totalExpenses = Math.abs(expenses.reduce((sum, t) => sum + t.rawAmount, 0))

            // Monthly data for chart
            const monthlyData: Record<string, { month: string; income: number; expenses: number }> =
              {}
            filtered.forEach(t => {
              const date = new Date(t.rawDate)
              const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
              if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { month: monthKey, income: 0, expenses: 0 }
              }
              if (t.rawAmount > 0) {
                monthlyData[monthKey].income += t.rawAmount
              } else {
                monthlyData[monthKey].expenses += Math.abs(t.rawAmount)
              }
            })
            const chartData = Object.values(monthlyData)
              .sort((a, b) => a.month.localeCompare(b.month))
              .slice(-12)

            // Category breakdown
            const byCategory: Record<string, number> = {}
            filtered
              .filter(t => t.rawAmount < 0)
              .forEach(t => {
                const cat = t.majorCategory || 'Uncategorized'
                byCategory[cat] = (byCategory[cat] || 0) + Math.abs(t.rawAmount)
              })
            const categoryData = Object.entries(byCategory)
              .map(([name, value]) => ({ name, value }))
              .sort((a, b) => b.value - a.value)

            // Origin breakdown
            const byOrigin: Record<string, { income: number; expenses: number }> = {}
            filtered.forEach(t => {
              const origin = t.origin || 'Unknown'
              if (!byOrigin[origin]) {
                byOrigin[origin] = { income: 0, expenses: 0 }
              }
              if (t.rawAmount > 0) {
                byOrigin[origin].income += t.rawAmount
              } else {
                byOrigin[origin].expenses += Math.abs(t.rawAmount)
              }
            })

            // Top expenses & income
            const topExpenses = filtered
              .filter(t => t.rawAmount < 0)
              .sort((a, b) => a.rawAmount - b.rawAmount)
              .slice(0, 5)
            const topIncome = filtered
              .filter(t => t.rawAmount > 0)
              .sort((a, b) => b.rawAmount - a.rawAmount)
              .slice(0, 5)

            const COLORS = [
              '#0f172a',
              '#1e293b',
              '#334155',
              '#475569',
              '#64748b',
              '#94a3b8',
              '#cbd5e1',
              '#e2e8f0',
            ]

            // Financial Analytics
            const savingsRate =
              totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
            const avgDailySpend =
              totalExpenses /
              (dashboardDateRange === '1m'
                ? 30
                : dashboardDateRange === '3m'
                  ? 90
                  : dashboardDateRange === '6m'
                    ? 180
                    : dashboardDateRange === '1y'
                      ? 365
                      : 365)

            // Month-over-month comparison
            const lastMonth = chartData[chartData.length - 1]
            const previousMonth = chartData[chartData.length - 2]
            const momExpenseChange = previousMonth
              ? ((lastMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100
              : 0
            const momIncomeChange = previousMonth
              ? ((lastMonth.income - previousMonth.income) / previousMonth.income) * 100
              : 0

            // Spending velocity & projections
            const daysInPeriod =
              dashboardDateRange === '1m'
                ? 30
                : dashboardDateRange === '3m'
                  ? 90
                  : dashboardDateRange === '6m'
                    ? 180
                    : dashboardDateRange === '1y'
                      ? 365
                      : 365
            const daysElapsed =
              filtered.length > 0
                ? Math.ceil(
                    (new Date().getTime() - new Date(filtered[0].rawDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : daysInPeriod
            const projectedMonthlyExpense = (totalExpenses / daysElapsed) * 30

            // Fixed vs Variable analysis (approximation: recurring similar amounts vs varying)
            const expenseAmounts = expenses.map(t => Math.abs(t.rawAmount))
            const avgExpense = expenseAmounts.reduce((a, b) => a + b, 0) / expenseAmounts.length
            const largeExpenses = expenses.filter(t => Math.abs(t.rawAmount) > avgExpense * 2)
            const regularExpenses = expenses.filter(t => Math.abs(t.rawAmount) <= avgExpense * 2)

            return (
              <div className="space-y-6">
                {/* Header & Filters */}
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Financial Overview
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {filtered.length} transactions analyzed
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <select
                        value={dashboardDateRange}
                        onChange={e => setDashboardDateRange(e.target.value as any)}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600"
                      >
                        <option value="1m">Last Month</option>
                        <option value="3m">Last 3 Months</option>
                        <option value="6m">Last 6 Months</option>
                        <option value="1y">Last Year</option>
                        <option value="all">All Time</option>
                      </select>
                      <select
                        value={dashboardOriginFilter}
                        onChange={e => setDashboardOriginFilter(e.target.value)}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600"
                      >
                        <option value="all">All Origins</option>
                        <option value="Personal">Personal</option>
                        <option value="Joint">Joint</option>
                        <option value="Couple">Couple</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Income Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Income
                        </p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2 tracking-tight">
                          {formatCurrency(totalIncome, 0)}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              momIncomeChange >= 0
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {momIncomeChange >= 0 ? '↑' : '↓'}{' '}
                            {Math.abs(momIncomeChange).toFixed(1)}%
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            vs last month
                          </span>
                        </div>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
                        <svg
                          className="w-6 h-6 text-emerald-600 dark:text-emerald-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Expenses Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Expenses
                        </p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2 tracking-tight">
                          {formatCurrency(totalExpenses, 0)}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              momExpenseChange <= 0
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {momExpenseChange <= 0 ? '↓' : '↑'}{' '}
                            {Math.abs(momExpenseChange).toFixed(1)}%
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            vs last month
                          </span>
                        </div>
                      </div>
                      <div className="bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg">
                        <svg
                          className="w-6 h-6 text-rose-600 dark:text-rose-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 12H4"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Savings Rate Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Savings Rate
                        </p>
                        <p
                          className={`text-3xl font-bold mt-2 tracking-tight ${savingsRate >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
                        >
                          {savingsRate.toFixed(1)}%
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                          {savingsRate >= 20
                            ? 'Excellent saving!'
                            : savingsRate >= 10
                              ? 'Good progress'
                              : savingsRate >= 0
                                ? 'Room to improve'
                                : 'Overspending'}
                        </p>
                      </div>
                      <div
                        className={`${savingsRate >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-amber-50 dark:bg-amber-900/20'} p-3 rounded-lg`}
                      >
                        <svg
                          className={`w-6 h-6 ${savingsRate >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Daily Burn Rate Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Daily Burn Rate
                        </p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2 tracking-tight">
                          {formatCurrency(avgDailySpend, 0)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                          Projected: {formatCurrency(projectedMonthlyExpense, 0)}/mês
                        </p>
                      </div>
                      <div className="bg-violet-50 dark:bg-violet-900/20 p-3 rounded-lg">
                        <svg
                          className="w-6 h-6 text-violet-600 dark:text-violet-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cash Flow Trend */}
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Cash Flow Trend
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Monthly income vs expenses
                      </p>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                        <span className="text-slate-600 dark:text-slate-400">Income</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                        <span className="text-slate-600 dark:text-slate-400">Expenses</span>
                      </div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="month"
                        stroke="#94a3b8"
                        style={{ fontSize: '12px' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        style={{ fontSize: '12px' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={value => formatCurrency(value, 0)}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                        formatter={value => [
                          formatCurrency(typeof value === 'number' ? value : 0, 2),
                          '',
                        ]}
                        labelStyle={{ color: '#475569', fontWeight: 600 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="income"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="expenses"
                        stroke="#ef4444"
                        strokeWidth={2.5}
                        dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Spending Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Top Categories */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                      Top Spending Categories
                    </h3>
                    <div className="space-y-3">
                      {categoryData.slice(0, 6).map((cat, idx) => {
                        const percentage = (cat.value / totalExpenses) * 100
                        return (
                          <div key={cat.name}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {cat.name}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {formatNumber(percentage, 1)}%
                                </span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-white min-w-[80px] text-right">
                                  {formatCurrency(cat.value, 0)}
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-slate-600 to-slate-800 dark:from-slate-400 dark:to-slate-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Financial Insights */}
                  <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                      Key Insights
                    </h3>
                    <div className="space-y-4">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <svg
                            className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            />
                          </svg>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                              Spending Pattern
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                              {regularExpenses.length > largeExpenses.length
                                ? `${((regularExpenses.length / expenses.length) * 100).toFixed(0)}% regular purchases`
                                : 'High variance detected'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <svg
                            className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                              Top Category
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                              {categoryData[0]?.name || 'N/A'} dominates at{' '}
                              {(((categoryData[0]?.value || 0) / totalExpenses) * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <svg
                            className="w-5 h-5 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                              Monthly Forecast
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                              Trending towards {formatCurrency(projectedMonthlyExpense, 0)}/mês
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notable Transactions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Largest Expenses */}
                  <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                      Largest Expenses
                    </h3>
                    <div className="space-y-2">
                      {topExpenses.map((t, i) => (
                        <div
                          key={t.id}
                          className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
                        >
                          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {t.rawDescription}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {formatDate(t.rawDate)}
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                            {formatCurrency(Math.abs(t.rawAmount), 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Largest Income */}
                  <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                      Largest Income
                    </h3>
                    <div className="space-y-2">
                      {topIncome.map((t, i) => (
                        <div
                          key={t.id}
                          className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
                        >
                          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {t.rawDescription}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {formatDate(t.rawDate)}
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                            {formatCurrency(t.rawAmount, 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            {/* Add Rule Form */}
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl shadow-lg p-6 border border-white/50 dark:border-white/10">
              <h3 className="text-lg font-semibold text-indigo-950 dark:text-white mb-4">
                Add Categorization Rule
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <input
                  type="text"
                  placeholder="Keyword (e.g., continente)"
                  value={newRule.keyword}
                  onChange={e => setNewRule(prev => ({ ...prev, keyword: e.target.value }))}
                  className="px-3 py-2 border-2 border-white/80 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-800 text-indigo-950 dark:text-white"
                />

                <select
                  value={newRule.majorCategory}
                  onChange={e =>
                    setNewRule(prev => ({
                      ...prev,
                      majorCategory: e.target.value,
                      category: '',
                      subCategory: '',
                    }))
                  }
                  className="px-3 py-2 border-2 border-white/80 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-800 text-indigo-950 dark:text-white"
                >
                  <option value="">Major Category</option>
                  {MAJOR_CATEGORIES.map(cat => (
                    <option key={cat.name} value={cat.name}>
                      {cat.emoji} {cat.name}
                    </option>
                  ))}
                </select>

                <select
                  value={newRule.category}
                  onChange={e =>
                    setNewRule(prev => ({ ...prev, category: e.target.value, subCategory: '' }))
                  }
                  className="px-3 py-2 border-2 border-white/80 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-800 text-indigo-950 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!newRule.majorCategory}
                >
                  <option value="">Category</option>
                  {newRule.majorCategory &&
                    MAJOR_CATEGORIES.find(c => c.name === newRule.majorCategory)?.subcategories.map(
                      sub => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      )
                    )}
                </select>

                <input
                  type="text"
                  placeholder="Sub-category (optional)"
                  value={newRule.subCategory}
                  onChange={e => setNewRule(prev => ({ ...prev, subCategory: e.target.value }))}
                  className="px-3 py-2 border-2 border-white/80 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-800 text-indigo-950 dark:text-white"
                />

                <button
                  onClick={addRule}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus size={18} />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Rules List */}
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl shadow-lg overflow-visible border border-white/50 dark:border-white/10">
              <div className="px-6 py-4 border-b border-white/50 dark:border-white/10">
                <h3 className="text-lg font-semibold text-indigo-950 dark:text-white">
                  Current Rules ({rules.length})
                </h3>
              </div>
              <div className={editingId ? 'overflow-visible' : 'overflow-x-auto'}>
                <table className="min-w-full divide-y divide-white/50 dark:divide-white/10">
                  <thead className="bg-white/50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300 uppercase tracking-wider">
                        Keyword
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300 uppercase tracking-wider">
                        Major Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300 uppercase tracking-wider">
                        Sub-Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/50 dark:bg-transparent divide-y divide-white/50 dark:divide-white/10">
                    {rules.map(rule => (
                      <tr
                        key={rule.id}
                        className="hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-950 dark:text-white">
                          {rule.keyword}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-900 dark:text-indigo-200">
                          {MAJOR_CATEGORIES.find(c => c.name === rule.majorCategory)?.emoji}{' '}
                          {rule.majorCategory}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-900 dark:text-indigo-200">
                          {rule.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-900/70 dark:text-slate-300">
                          {rule.subCategory || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              rule.isDefault
                                ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300'
                                : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300'
                            }`}
                          >
                            {rule.isDefault ? 'Default' : 'Custom'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {!rule.isDefault && (
                            <button
                              onClick={() => deleteRule(rule.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rules.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-indigo-400 dark:text-slate-400 text-lg mb-2">
                    No rules configured
                  </div>
                  <div className="text-indigo-500 dark:text-slate-500 text-sm">
                    Add your first rule above
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Review Tab */}
        {activeTab === 'review' && (
          <div className="space-y-6">
            {/* Review Actions Bar - Matching Transactions UX */}
            <div className="bg-gradient-to-br from-white/70 to-white/50 dark:from-slate-800/70 dark:to-slate-800/50 backdrop-blur-md rounded-3xl shadow-lg p-6 border border-white/60 dark:border-white/20">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <CheckSquare size={18} className="text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-bold text-indigo-950 dark:text-white uppercase tracking-wide">
                    Review Actions
                  </h3>
                </div>

                {/* Transaction Count Badge */}
                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 px-4 py-2 rounded-xl border border-amber-500/20 dark:border-amber-500/30">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                      {reviewTransactions.length} Pending Review
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              {reviewTransactions.length > 0 && (
                <div className="flex flex-wrap gap-3 items-center">
                  <AIBatchClassifier
                    token={auth.token || ''}
                    onClassified={() => {
                      loadData(auth.token || '')
                      showNotification('AI batch classification complete', 'success')
                    }}
                    className="transform transition-all duration-300 hover:scale-105"
                  />

                  <button
                    onClick={() => setShowBulkEditDialog(true)}
                    disabled={selectedReviewIds.length === 0}
                    className="group bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3.5 rounded-2xl hover:shadow-xl hover:shadow-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 transition-all duration-300 hover:scale-105 font-semibold"
                  >
                    <Edit size={18} />
                    <span>Bulk Edit ({selectedReviewIds.length})</span>
                  </button>

                  <button
                    onClick={() => handleReviewAction('approve')}
                    disabled={loading || selectedReviewIds.length === 0}
                    className="group bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3.5 rounded-2xl hover:shadow-xl hover:shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 transition-all duration-300 hover:scale-105 font-semibold"
                  >
                    <CheckSquare size={18} />
                    <span>Approve Selected ({selectedReviewIds.length})</span>
                  </button>

                  <button
                    onClick={() => handleReviewAction('reject')}
                    disabled={loading || selectedReviewIds.length === 0}
                    className="group bg-gradient-to-r from-rose-600 to-red-600 text-white px-6 py-3.5 rounded-2xl hover:shadow-xl hover:shadow-rose-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 transition-all duration-300 hover:scale-105 font-semibold"
                  >
                    <Trash2 size={18} />
                    <span>Reject Selected ({selectedReviewIds.length})</span>
                  </button>
                </div>
              )}

              {/* Sort Controls */}
              {reviewTransactions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/50 dark:border-white/10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select
                      value={sortField}
                      onChange={val => setSortField(val as any)}
                      options={[
                        { value: 'date', label: '📅 Sort by Date' },
                        { value: 'amount', label: '💰 Sort by Amount' },
                        { value: 'description', label: '📝 Sort by Description' },
                        { value: 'origin', label: '👤 Sort by Origin' },
                        { value: 'bank', label: '🏦 Sort by Bank' },
                      ]}
                      placeholder="Sort by"
                    />

                    <Select
                      value={sortDirection}
                      onChange={val => setSortDirection(val as any)}
                      options={[
                        { value: 'desc', label: '⬇️ Descending' },
                        { value: 'asc', label: '⬆️ Ascending' },
                      ]}
                      placeholder="Order"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Review Transactions Table - Matching Transactions UX */}
            <div className="bg-gradient-to-br from-white/70 to-white/50 dark:from-slate-800/70 dark:to-slate-800/50 backdrop-blur-md rounded-3xl shadow-lg overflow-visible border border-white/60 dark:border-white/20">
              {reviewTransactions.length > 0 ? (
                <>
                  <div className="p-6 border-b border-white/50 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-indigo-950 dark:text-white flex items-center gap-2">
                        <CheckSquare size={20} className="text-indigo-600 dark:text-indigo-400" />
                        Transactions Pending Review
                      </h3>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={
                            selectedReviewIds.length === sortedReviewTransactions.length &&
                            sortedReviewTransactions.length > 0
                          }
                          onChange={toggleAllReviewSelection}
                          className="w-4 h-4 rounded border-2 border-white/80 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 focus:ring-2"
                        />
                        <span className="text-sm font-semibold text-indigo-900/70 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          Select All
                        </span>
                      </label>
                    </div>
                  </div>
                  <div
                    className={
                      editingId ? 'overflow-visible' : 'overflow-x-auto overflow-y-visible'
                    }
                  >
                    <table className="min-w-full divide-y divide-white/50 dark:divide-white/10">
                      <thead className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-slate-800/50 dark:to-slate-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-indigo-900 dark:text-slate-300 uppercase tracking-wider w-16">
                            Select
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-indigo-900 dark:text-slate-300 uppercase tracking-wider w-28">
                            Date
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-indigo-900 dark:text-slate-300 uppercase tracking-wider w-20">
                            Origin
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-indigo-900 dark:text-slate-300 uppercase tracking-wider w-16">
                            Bank
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-indigo-900 dark:text-slate-300 uppercase tracking-wider w-20">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-indigo-900 dark:text-slate-300 uppercase tracking-wider w-44">
                            Category
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-indigo-900 dark:text-slate-300 uppercase tracking-wider w-28">
                            Tags
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-indigo-900 dark:text-slate-300 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-indigo-900 dark:text-slate-300 uppercase tracking-wider w-28">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-indigo-900 dark:text-slate-300 uppercase tracking-wider">
                            Issue
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-indigo-900 dark:text-slate-300 uppercase tracking-wider w-24">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/50 dark:bg-transparent divide-y divide-indigo-50 dark:divide-white/5">
                        {sortedReviewTransactions.map(transaction => {
                          const isIncome = transaction.rawAmount > 0
                          const isSelected = selectedReviewIds.includes(transaction.id)
                          return (
                            <tr
                              key={transaction.id}
                              className={`group transition-all duration-200 ${
                                isSelected ? 'bg-indigo-100/50 dark:bg-indigo-500/10' : ''
                              } ${
                                transaction.flagged
                                  ? 'bg-amber-50/50 dark:bg-amber-500/5 border-l-4 border-l-amber-500 hover:bg-amber-100/50 dark:hover:bg-amber-500/10'
                                  : isIncome
                                    ? 'hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5 border-l-4 border-l-transparent hover:border-l-emerald-500'
                                    : 'hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 border-l-4 border-l-transparent hover:border-l-indigo-500'
                              }`}
                            >
                              {editingId === transaction.id ? (
                                <>
                                  <td className="px-4 py-3 relative z-50" colSpan={10}>
                                    <div className="flex flex-col gap-3 bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-200 dark:border-indigo-700 relative z-50">
                                      {/* Validation Errors */}
                                      {validationErrors.length > 0 && (
                                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg">
                                          <div className="flex items-start gap-2">
                                            <span className="text-red-600 dark:text-red-400 font-bold text-sm">
                                              ⚠️
                                            </span>
                                            <div className="flex-1">
                                              <div className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">
                                                Please fix the following issues:
                                              </div>
                                              <ul className="list-disc list-inside text-xs text-red-600 dark:text-red-300 space-y-0.5">
                                                {validationErrors.map((error, i) => (
                                                  <li key={i}>{error}</li>
                                                ))}
                                              </ul>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Row 1: Date, Origin, Bank */}
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                          <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-1.5">
                                            Date *
                                          </label>
                                          <DateInput
                                            value={editForm.rawDate}
                                            onChange={date =>
                                              setEditForm({
                                                ...editForm,
                                                rawDate: date ?? undefined,
                                              })
                                            }
                                            disabled={savingEdit}
                                            required
                                            placeholder="DD/MM/YYYY"
                                            className="w-full px-3 py-2 text-sm border-2 border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-slate-700 text-indigo-950 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                          />
                                        </div>

                                        <div>
                                          <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-1.5">
                                            Origin *
                                          </label>
                                          <div className="relative">
                                            <select
                                              value={editForm.origin || ''}
                                              onChange={e =>
                                                setEditForm({ ...editForm, origin: e.target.value })
                                              }
                                              disabled={savingEdit}
                                              className="w-full pl-3 pr-9 py-2.5 text-sm font-medium border-2 border-indigo-200 dark:border-indigo-700 rounded-xl bg-gradient-to-br from-white to-indigo-50/30 dark:from-slate-700 dark:to-slate-700/50 text-indigo-950 dark:text-white shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-400 dark:focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer [&>option]:bg-white [&>option]:dark:bg-slate-700 [&>option]:text-indigo-950 [&>option]:dark:text-white"
                                            >
                                              <option value="Personal">Personal</option>
                                              <option value="Joint">Joint</option>
                                              <option value="Couple">Couple</option>
                                              <option value="Other">Other</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 dark:text-indigo-400 pointer-events-none" />
                                          </div>
                                        </div>

                                        <div>
                                          <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-1.5">
                                            Bank *
                                          </label>
                                          <BankSelector
                                            value={editForm.bank || ''}
                                            onChange={bankName =>
                                              setEditForm({ ...editForm, bank: bankName })
                                            }
                                            token={auth.token || ''}
                                            disabled={savingEdit}
                                          />
                                        </div>
                                      </div>

                                      {/* Row 2: Category & Tags */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Category Section */}
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                                          <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                                            <span className="text-base">📁</span>
                                            {language === 'en' ? 'Category' : 'Categoria'}
                                          </label>
                                          <CategorySelector
                                            majorCategoryId={
                                              editForm.majorCategoryId ||
                                              transaction.majorCategoryId
                                            }
                                            categoryId={
                                              editForm.categoryId || transaction.categoryId
                                            }
                                            onChange={selection => {
                                              setEditForm({
                                                ...editForm,
                                                majorCategoryId: selection.majorCategoryId,
                                                categoryId: selection.categoryId,
                                                majorCategory: selection.majorCategory,
                                                category: selection.category,
                                              })
                                            }}
                                            token={auth.token || ''}
                                            language={language}
                                          />
                                        </div>

                                        {/* Tags Section */}
                                        <div className="p-3 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl border-2 border-indigo-200 dark:border-indigo-800">
                                          <TagsLabel language={language} className="mb-2" />
                                          <TagSelector
                                            selectedTags={editForm.tags || transaction.tags || []}
                                            onChange={tags => setEditForm({ ...editForm, tags })}
                                            token={auth.token || ''}
                                            language={language}
                                            disabled={savingEdit}
                                          />
                                        </div>
                                      </div>

                                      {/* Row 3: Description & Notes */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                          <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-1.5">
                                            Description *
                                          </label>
                                          <input
                                            type="text"
                                            value={editForm.rawDescription || ''}
                                            onChange={e =>
                                              setEditForm({
                                                ...editForm,
                                                rawDescription: e.target.value,
                                              })
                                            }
                                            disabled={savingEdit}
                                            placeholder="Transaction description"
                                            className="w-full px-3 py-2 text-sm border-2 border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-slate-700 text-indigo-950 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                          />
                                        </div>

                                        <div>
                                          <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-1.5">
                                            Notes
                                          </label>
                                          <input
                                            type="text"
                                            value={editForm.notes || ''}
                                            onChange={e =>
                                              setEditForm({ ...editForm, notes: e.target.value })
                                            }
                                            disabled={savingEdit}
                                            placeholder="Optional notes"
                                            className="w-full px-3 py-2 text-sm border-2 border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-slate-700 text-indigo-950 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                          />
                                        </div>
                                      </div>

                                      {/* Row 4: Amount */}
                                      <div className="w-full md:w-1/3">
                                        <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-1.5">
                                          Amount (€) *
                                        </label>
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={
                                            editForm.rawAmount !== undefined
                                              ? editForm.rawAmount
                                              : ''
                                          }
                                          onChange={e => {
                                            const value = e.target.value
                                            // Allow empty, minus sign, and valid numbers
                                            if (value === '' || value === '-') {
                                              setEditForm({ ...editForm, rawAmount: value as any })
                                            } else {
                                              const parsed = parseFloat(value)
                                              setEditForm({
                                                ...editForm,
                                                rawAmount: isNaN(parsed) ? 0 : parsed,
                                              })
                                            }
                                          }}
                                          disabled={savingEdit}
                                          placeholder="0.00"
                                          className="w-full px-3 py-2 text-sm border-2 border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-slate-700 text-indigo-950 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                      </div>

                                      {/* Action Buttons */}
                                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-3 border-t border-indigo-200 dark:border-indigo-700">
                                        <button
                                          onClick={saveEdit}
                                          disabled={savingEdit}
                                          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                                        >
                                          {savingEdit ? (
                                            <>
                                              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                              <span>Saving...</span>
                                            </>
                                          ) : (
                                            <>
                                              <Save size={16} />
                                              <span>Save Changes</span>
                                            </>
                                          )}
                                        </button>

                                        <button
                                          onClick={cancelEdit}
                                          disabled={savingEdit}
                                          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-indigo-950 dark:text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onClick={e => toggleReviewSelection(transaction.id, e)}
                                      onChange={() => {}}
                                      className="w-4 h-4 rounded border-2 border-white/80 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                      title="Click to select, Shift+Click to select range"
                                    />
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                                      {formatDate(transaction.rawDate)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex justify-center items-center">
                                      <OriginAvatar origin={transaction.origin} size="sm" />
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                                      {transaction.bank || 'N/A'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span
                                      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-base font-semibold ${
                                        transaction.status === 'categorized'
                                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                          : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                      }`}
                                      title={
                                        transaction.status === 'categorized'
                                          ? 'Categorized'
                                          : 'Pending categorization'
                                      }
                                    >
                                      <span>
                                        {transaction.status === 'categorized' ? '✓' : '⏳'}
                                      </span>
                                    </span>
                                  </td>
                                  {/* Category Column */}
                                  <td className="px-4 py-3">
                                    <div className="flex flex-col gap-1.5 min-w-[140px] max-w-[170px]">
                                      {transaction.majorCategory ? (
                                        <>
                                          <CategoryBadgeCompact
                                            majorCategory={transaction.majorCategory}
                                            category={transaction.category}
                                            majorEmoji={transaction.majorCategoryRef?.emoji}
                                            language={language}
                                          />
                                          {transaction.classifierConfidence && (
                                            <ConfidenceBadge
                                              confidence={transaction.classifierConfidence}
                                              reasoning={transaction.classifierReasoning}
                                            />
                                          )}
                                        </>
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-medium text-gray-400 dark:text-slate-500 italic">
                                            {language === 'en'
                                              ? 'Not categorized'
                                              : 'Sem categoria'}
                                          </span>
                                          {transaction.status === 'pending' && (
                                            <AIClassifier
                                              transactionId={transaction.id}
                                              token={auth.token || ''}
                                              onClassified={() =>
                                                refreshTransaction(transaction.id)
                                              }
                                            />
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  {/* Tags Column */}
                                  <td className="px-4 py-3">
                                    <div className="min-w-[70px] max-w-[100px]">
                                      <TagBadges
                                        tags={transaction.tags || []}
                                        language={language}
                                        maxDisplay={3}
                                      />
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-col gap-0.5">
                                      <div className="text-sm font-medium text-indigo-950 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                                        {transaction.rawDescription}
                                      </div>
                                      {transaction.notes && (
                                        <div className="text-xs text-indigo-600 dark:text-indigo-400 italic">
                                          {transaction.notes}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-center">
                                    <span
                                      className={`font-semibold text-sm tabular-nums ${
                                        isIncome
                                          ? 'text-emerald-700 dark:text-emerald-400'
                                          : 'text-rose-700 dark:text-rose-400'
                                      }`}
                                    >
                                      €
                                      {Math.abs(transaction.rawAmount) % 1 === 0
                                        ? Math.abs(transaction.rawAmount).toFixed(0)
                                        : Math.abs(transaction.rawAmount).toFixed(2)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    {transaction.potentialDuplicateId ? (
                                      <div className="text-sm">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300">
                                          ⚠️ Potential Duplicate
                                        </span>
                                        {transaction.duplicateOf && (
                                          <div className="mt-1 text-xs text-indigo-600 dark:text-indigo-300">
                                            Similar to: {transaction.duplicateOf.rawDescription} (
                                            {formatDate(transaction.duplicateOf.rawDate)})
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-sm text-indigo-400 dark:text-slate-500 italic">
                                        Unknown issue
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => approveTransaction(transaction.id)}
                                        disabled={loading}
                                        className="p-1.5 text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                                        title="Approve"
                                      >
                                        <Check size={16} />
                                      </button>
                                      <button
                                        onClick={() => rejectTransaction(transaction.id)}
                                        disabled={loading}
                                        className="p-1.5 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded hover:bg-red-50 dark:hover:bg-red-500/10"
                                        title="Reject"
                                      >
                                        ✕
                                      </button>
                                      <button
                                        onClick={() => startEditing(transaction)}
                                        disabled={loading}
                                        className="p-1.5 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                                        title="Edit"
                                      >
                                        <Edit2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </>
                              )}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/20 dark:to-teal-500/20 rounded-full mb-6 animate-pulse">
                    <CheckSquare size={40} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-indigo-900 dark:text-white mb-2">
                    All caught up!
                  </h3>
                  <p className="text-indigo-700/60 dark:text-slate-400 max-w-md mx-auto">
                    There are no transactions pending review at the moment.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              {/* Major Categories */}
              <div className="bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800/70 dark:to-slate-800/50 backdrop-blur-md rounded-3xl shadow-lg p-6 border-2 border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-xl">
                    <FolderTree size={20} className="text-slate-600 dark:text-slate-300" />
                  </div>
                  <div className="text-3xl font-bold text-slate-800 dark:text-white">
                    {taxonomy.length}
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  {language === 'en' ? 'Major Categories' : 'Categorias Principais'}
                </div>
              </div>

              {/* Categories */}
              <div className="bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/30 dark:to-indigo-900/20 backdrop-blur-md rounded-3xl shadow-lg p-6 border-2 border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-200 dark:bg-indigo-800 rounded-xl">
                    <FolderTree size={20} className="text-indigo-600 dark:text-indigo-300" />
                  </div>
                  <div className="text-3xl font-bold text-indigo-800 dark:text-white">
                    {taxonomy.reduce((sum, m) => sum + m.categories.length, 0)}
                  </div>
                </div>
                <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  {language === 'en' ? 'Categories' : 'Categorias'}
                </div>
              </div>

              {/* Tags */}
              <div className="bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/30 dark:to-violet-900/20 backdrop-blur-md rounded-3xl shadow-lg p-6 border-2 border-violet-200 dark:border-violet-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-violet-200 dark:bg-violet-800 rounded-xl">
                    <span className="text-lg">#</span>
                  </div>
                  <div className="text-3xl font-bold text-violet-800 dark:text-white">
                    {tagDefinitions.length}
                  </div>
                </div>
                <div className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                  {language === 'en' ? 'Tags' : 'Tags'}
                </div>
              </div>
            </div>

            {/* Visual Guide */}
            <div className="bg-gradient-to-r from-slate-100 via-indigo-100 to-violet-100 dark:from-slate-800/50 dark:via-indigo-900/30 dark:to-violet-900/30 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex flex-wrap items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <CategoryBadge majorCategory="Example" category="Category" size="sm" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    = {language === 'en' ? 'WHERE money goes' : 'ONDE vai o dinheiro'}
                  </span>
                </div>
                <div className="text-slate-300 dark:text-slate-600">|</div>
                <div className="flex items-center gap-2">
                  <TagBadges
                    tags={['vehicle:carro', 'trip:algarve-25']}
                    language={language}
                    maxDisplay={3}
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    = {language === 'en' ? 'HOW/WHO/WHAT details' : 'Detalhes COMO/QUEM/O QUÊ'}
                  </span>
                </div>
              </div>
            </div>

            {/* Two-column layout: Categories & Tags */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Category Taxonomy */}
              <div className="space-y-4">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white">
                  <span className="text-2xl">📁</span>
                  {language === 'en' ? 'Category Taxonomy' : 'Taxonomia de Categorias'}
                </h2>

                {taxonomy.map(major => (
                  <div
                    key={major.id}
                    className="bg-gradient-to-br from-white/70 to-white/50 dark:from-slate-800/70 dark:to-slate-800/50 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700"
                  >
                    {/* Major Category Header */}
                    <button
                      onClick={() => toggleMajor(major.id)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/50 dark:hover:bg-slate-700/50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        {expandedMajor.has(major.id) ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="text-2xl">{major.emoji}</span>
                        <div className="text-left">
                          <div className="font-bold text-slate-800 dark:text-white">
                            {major.name}
                          </div>
                          {major.budgetCategory && (
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {major.budgetCategory === 'needs'
                                ? '50% Needs'
                                : major.budgetCategory === 'wants'
                                  ? '30% Wants'
                                  : '20% Savings'}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {major.categories.length}
                      </span>
                    </button>

                    {/* Categories */}
                    {expandedMajor.has(major.id) && (
                      <div className="px-5 pb-4 space-y-1">
                        {major.categories.map(category => (
                          <div
                            key={category.id}
                            className="ml-8 flex items-center justify-between px-3 py-2 bg-white/60 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-600/30 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all group"
                          >
                            {editingId === category.id ? (
                              <input
                                type="text"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                className="flex-1 px-2 py-1 border-2 border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                autoFocus
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                {category.icon && (
                                  <span className="text-base">{category.icon}</span>
                                )}
                                <span className="font-medium text-slate-700 dark:text-slate-200">
                                  {category.name}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {editingId === category.id ? (
                                <>
                                  <button
                                    onClick={() => saveEditCategory('category', category.id)}
                                    className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded transition-all"
                                    title="Save"
                                  >
                                    <Check size={12} />
                                  </button>
                                  <button
                                    onClick={cancelEditCategory}
                                    className="p-1 bg-slate-400 hover:bg-slate-500 text-white rounded transition-all"
                                    title="Cancel"
                                  >
                                    <Edit2 size={12} className="rotate-45" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEditCategory(category.id, category.name)}
                                    className="p-1 bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-800 text-indigo-600 dark:text-indigo-300 rounded transition-all"
                                    title="Edit"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      deleteCategory('category', category.id, category.name)
                                    }
                                    className="p-1 bg-rose-100 dark:bg-rose-900/50 hover:bg-rose-200 dark:hover:bg-rose-800 text-rose-600 dark:text-rose-300 rounded transition-all"
                                    title="Delete"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Add category button */}
                        <button
                          onClick={() => addCategoryToMajor(major.id)}
                          className="ml-8 w-full px-3 py-2 text-sm text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-700 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus size={14} />
                          {language === 'en' ? 'Add Category' : 'Adicionar Categoria'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Right: Tags Reference */}
              <div className="space-y-4">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white">
                  <span className="text-2xl">#</span>
                  {language === 'en' ? 'Tags Reference' : 'Referência de Tags'}
                </h2>

                {/* Group tags by namespace */}
                {(() => {
                  const namespaces = Array.from(
                    new Set(tagDefinitions.map(t => t.namespace))
                  ).sort()
                  return namespaces.map(namespace => {
                    const namespaceTags = tagDefinitions.filter(t => t.namespace === namespace)
                    const isExpanded = expandedNamespace.has(namespace)

                    const namespaceLabels: Record<
                      string,
                      { pt: string; en: string; emoji: string }
                    > = {
                      type: { pt: 'Tipo', en: 'Type', emoji: '🏷️' },
                      vehicle: { pt: 'Veículo', en: 'Vehicle', emoji: '🚗' },
                      trip: { pt: 'Viagem', en: 'Trip', emoji: '✈️' },
                      provider: { pt: 'Fornecedor', en: 'Provider', emoji: '🏢' },
                      platform: { pt: 'Plataforma', en: 'Platform', emoji: '📱' },
                      occasion: { pt: 'Ocasião', en: 'Occasion', emoji: '🎉' },
                      recipient: { pt: 'Destinatário', en: 'Recipient', emoji: '👤' },
                      sport: { pt: 'Desporto', en: 'Sport', emoji: '⚽' },
                      utility: { pt: 'Utilidade', en: 'Utility', emoji: '💡' },
                      service: { pt: 'Serviço', en: 'Service', emoji: '🔧' },
                      project: { pt: 'Projeto', en: 'Project', emoji: '📋' },
                      reimbursable: { pt: 'Reembolsável', en: 'Reimbursable', emoji: '💰' },
                      bank: { pt: 'Banco', en: 'Bank', emoji: '🏦' },
                      location: { pt: 'Local', en: 'Location', emoji: '📍' },
                      asset: { pt: 'Ativo', en: 'Asset', emoji: '🏠' },
                    }

                    const nsLabel = namespaceLabels[namespace] || {
                      pt: namespace,
                      en: namespace,
                      emoji: '#',
                    }

                    return (
                      <div
                        key={namespace}
                        className="bg-gradient-to-br from-violet-50 to-white dark:from-violet-900/20 dark:to-slate-800/50 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden border border-violet-200 dark:border-violet-800/50"
                      >
                        <button
                          onClick={() => toggleNamespace(namespace)}
                          className="w-full px-5 py-4 flex items-center justify-between hover:bg-violet-100/50 dark:hover:bg-violet-900/30 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-violet-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-violet-400" />
                            )}
                            <span className="text-xl">{nsLabel.emoji}</span>
                            <div className="text-left">
                              <div className="font-bold text-violet-800 dark:text-violet-200">
                                {language === 'en' ? nsLabel.en : nsLabel.pt}
                              </div>
                              <div className="text-xs text-violet-500 dark:text-violet-400">
                                {namespace}:*
                              </div>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-violet-500 dark:text-violet-400">
                            {namespaceTags.length}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="px-5 pb-4">
                            <div className="flex flex-wrap gap-1.5 ml-8">
                              {namespaceTags.map(tag => (
                                <span
                                  key={tag.id}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700"
                                  title={`${tag.namespace}:${tag.value}`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                                  {language === 'en' && tag.labelEn ? tag.labelEn : tag.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                })()}
              </div>
            </div>

            {/* Banks Management Section */}
            <div className="bg-gradient-to-br from-white/70 to-white/50 dark:from-slate-800/70 dark:to-slate-800/50 backdrop-blur-md rounded-3xl shadow-lg p-6 border border-white/60 dark:border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🏦</div>
                  <div>
                    <h3 className="text-xl font-bold text-indigo-950 dark:text-white">Banks</h3>
                    <p className="text-sm text-indigo-700/60 dark:text-slate-400">
                      Manage bank accounts
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setNewBankForm({ name: '', logo: '', color: '' })
                    setShowNewBankForm(true)
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <Plus size={16} />
                  <span>Add Bank</span>
                </button>
              </div>

              {/* New Bank Form */}
              {showNewBankForm && (
                <div className="mb-6 p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl border-2 border-indigo-200 dark:border-indigo-700">
                  <h4 className="text-sm font-bold text-indigo-900 dark:text-white mb-3">
                    Add New Bank
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Bank Name *"
                      value={newBankForm.name}
                      onChange={e => setNewBankForm({ ...newBankForm, name: e.target.value })}
                      className="px-3 py-2 text-sm border-2 border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-slate-700 text-indigo-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Logo Path (optional)"
                      value={newBankForm.logo}
                      onChange={e => setNewBankForm({ ...newBankForm, logo: e.target.value })}
                      className="px-3 py-2 text-sm border-2 border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-slate-700 text-indigo-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Color (optional)"
                      value={newBankForm.color}
                      onChange={e => setNewBankForm({ ...newBankForm, color: e.target.value })}
                      className="px-3 py-2 text-sm border-2 border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-slate-700 text-indigo-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={editingBank ? updateBank : createBank}
                      disabled={!newBankForm.name || savingBank}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {savingBank
                        ? editingBank
                          ? 'Updating...'
                          : 'Creating...'
                        : editingBank
                          ? 'Update Bank'
                          : 'Create Bank'}
                    </button>
                    <button
                      onClick={() => {
                        setShowNewBankForm(false)
                        setNewBankForm({ name: '', logo: '', color: '' })
                        setEditingBank(null)
                      }}
                      disabled={savingBank}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-indigo-950 dark:text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Banks List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {banks.map(bank => (
                  <div
                    key={bank.id}
                    className="flex items-center justify-between p-3 bg-white/60 dark:bg-slate-700/30 backdrop-blur-sm rounded-xl border border-indigo-200 dark:border-indigo-600/30 group hover:border-indigo-300 dark:hover:border-indigo-500 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {bank.logo ? (
                        <img
                          src={bank.logo}
                          alt={bank.name}
                          className="h-8 w-8 object-contain rounded"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-lg">
                          🏦
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-sm text-indigo-950 dark:text-white">
                          {bank.name}
                        </div>
                        {bank.userId && (
                          <div className="text-xs text-indigo-600 dark:text-indigo-400">Custom</div>
                        )}
                      </div>
                    </div>
                    {bank.userId && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditingBank(bank)}
                          className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-800 text-indigo-600 dark:text-indigo-300 rounded transition-all"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteBank(bank.id, bank.name)}
                          className="p-1.5 bg-rose-100 dark:bg-rose-900/50 hover:bg-rose-200 dark:hover:bg-rose-800 text-rose-600 dark:text-rose-300 rounded transition-all"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {banks.length === 0 && (
                <div className="text-center py-8 text-indigo-600 dark:text-indigo-400">
                  No banks found. Add your first bank to get started.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-indigo-900 dark:text-white mb-4">
              Import Transactions
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                  File: {selectedFile?.name}
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                  Origin
                </label>
                <select
                  value={importOrigin}
                  onChange={e => setImportOrigin(e.target.value)}
                  className="w-full bg-white dark:bg-slate-700 border-2 border-indigo-200 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 [&>option]:bg-white [&>option]:dark:bg-slate-700 [&>option]:text-indigo-950 [&>option]:dark:text-white"
                >
                  <option value="Couple">💑 Couple</option>
                  <option value="Personal">Personal</option>
                  <option value="Joint">Joint</option>
                  <option value="Family">Family</option>
                  <option value="Couple">🏠 Couple</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                  Bank
                </label>
                <select
                  value={importBank}
                  onChange={e => setImportBank(e.target.value)}
                  className="w-full bg-white dark:bg-slate-700 border-2 border-indigo-200 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Auto-detect">Auto-detect</option>
                  {banks.map(bank => (
                    <option key={bank.id} value={bank.name}>
                      {bank.name}
                    </option>
                  ))}
                  <option value="Generic">Generic</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={cancelImport}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-600 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmImport}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 font-semibold transition-all"
                >
                  {loading ? 'Importing...' : 'Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Transaction Dialog */}
      {showAddTransactionDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-indigo-900 dark:text-white mb-4">
              Add Transaction Manually
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                    Date *
                  </label>
                  <DateInput
                    value={newTransactionForm.rawDate}
                    onChange={date =>
                      setNewTransactionForm({ ...newTransactionForm, rawDate: date })
                    }
                    required
                    placeholder="DD/MM/YYYY"
                    className="w-full bg-white dark:bg-slate-700 border-2 border-indigo-200 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                    Origin *
                  </label>
                  <select
                    value={newTransactionForm.origin}
                    onChange={e =>
                      setNewTransactionForm({ ...newTransactionForm, origin: e.target.value })
                    }
                    className="w-full bg-white dark:bg-slate-700 border-2 border-indigo-200 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Couple">Couple</option>
                    <option value="Personal">Personal</option>
                    <option value="Joint">Joint</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                  Bank *
                </label>
                <select
                  value={newTransactionForm.bank}
                  onChange={e =>
                    setNewTransactionForm({ ...newTransactionForm, bank: e.target.value })
                  }
                  className="w-full bg-white dark:bg-slate-700 border-2 border-indigo-200 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Bank...</option>
                  {banks.map(bank => (
                    <option key={bank.id} value={bank.name}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  value={newTransactionForm.rawDescription}
                  onChange={e =>
                    setNewTransactionForm({ ...newTransactionForm, rawDescription: e.target.value })
                  }
                  placeholder="Transaction description..."
                  className="w-full bg-white dark:bg-slate-700 border-2 border-indigo-200 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                    Amount * (use - for expenses)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTransactionForm.rawAmount}
                    onChange={e =>
                      setNewTransactionForm({ ...newTransactionForm, rawAmount: e.target.value })
                    }
                    placeholder="-50.00"
                    className="w-full bg-white dark:bg-slate-700 border-2 border-indigo-200 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                    Balance (optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTransactionForm.rawBalance}
                    onChange={e =>
                      setNewTransactionForm({ ...newTransactionForm, rawBalance: e.target.value })
                    }
                    placeholder="1234.56"
                    className="w-full bg-white dark:bg-slate-700 border-2 border-indigo-200 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                  Category (optional)
                </label>
                <CategorySelector
                  majorCategoryId={newTransactionForm.majorCategoryId}
                  categoryId={newTransactionForm.categoryId}
                  onChange={selection =>
                    setNewTransactionForm({
                      ...newTransactionForm,
                      majorCategoryId: selection.majorCategoryId,
                      categoryId: selection.categoryId,
                      majorCategory: selection.majorCategory,
                      category: selection.category,
                    })
                  }
                  token={auth.token!}
                  language={language}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                  Tags (optional)
                </label>
                <TagSelector
                  selectedTags={newTransactionForm.tags}
                  onChange={tags => setNewTransactionForm({ ...newTransactionForm, tags })}
                  token={auth.token!}
                  language={language}
                />
                <p className="mt-1.5 text-xs text-indigo-500 dark:text-indigo-400">
                  {language === 'en'
                    ? 'Add details: vehicle, trip, provider...'
                    : 'Detalhes: veículo, viagem, fornecedor...'}
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={cancelAddTransaction}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-600 font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addManualTransaction}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 font-semibold transition-all"
                >
                  {loading ? 'Adding...' : 'Add Transaction'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Subcategory Dialog */}
      {showAddCategoryDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-indigo-900 dark:text-white mb-4">
              {language === 'en' ? 'Add Category' : 'Adicionar Categoria'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                  {language === 'en' ? 'Category Name' : 'Nome da Categoria'}
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && confirmAddCategory()}
                  placeholder={
                    language === 'en'
                      ? 'Enter category name...'
                      : 'Introduza o nome da categoria...'
                  }
                  autoFocus
                  className="w-full bg-white dark:bg-slate-700 border-2 border-indigo-200 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={cancelAddCategory}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-600 font-semibold transition-colors"
                >
                  {language === 'en' ? 'Cancel' : 'Cancelar'}
                </button>
                <button
                  onClick={confirmAddCategory}
                  disabled={!newCategoryName.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 font-semibold transition-all"
                >
                  {language === 'en' ? 'Add' : 'Adicionar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Dialog */}
      {showBulkEditDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-indigo-900 dark:text-white mb-4">
              Bulk Edit {selectedTransactionIds.length} Transaction
              {selectedTransactionIds.length > 1 ? 's' : ''}
            </h3>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Only fill in the fields you want to update. Empty fields will not be changed.
            </p>

            <div className="space-y-4">
              {/* Category Selector */}
              <div>
                <label className="block text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                  Category
                </label>
                <CategorySelector
                  majorCategoryId={bulkEditForm.majorCategoryId || null}
                  categoryId={bulkEditForm.categoryId || null}
                  onChange={selection => {
                    setBulkEditForm({
                      ...bulkEditForm,
                      majorCategoryId: selection.majorCategoryId,
                      categoryId: selection.categoryId,
                      majorCategory: selection.majorCategory,
                      category: selection.category,
                    })
                  }}
                  token={auth.token || ''}
                  className="w-full"
                  language={language}
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                  Status
                </label>
                <select
                  value={bulkEditForm.status || ''}
                  onChange={e =>
                    setBulkEditForm({ ...bulkEditForm, status: e.target.value || undefined })
                  }
                  className="w-full bg-white dark:bg-slate-700 border-2 border-indigo-200 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Don't change --</option>
                  <option value="pending">Pending</option>
                  <option value="categorized">Categorized</option>
                </select>
              </div>

              {/* Origin */}
              <div>
                <label className="block text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                  Origin
                </label>
                <select
                  value={bulkEditForm.origin || ''}
                  onChange={e =>
                    setBulkEditForm({ ...bulkEditForm, origin: e.target.value || undefined })
                  }
                  className="w-full bg-white dark:bg-slate-700 border-2 border-indigo-200 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Don't change --</option>
                  <option value="Couple">💑 Couple</option>
                  <option value="Personal">Personal</option>
                  <option value="Joint">Joint</option>
                  <option value="Family">Family</option>
                </select>
              </div>

              {/* Bank */}
              <div>
                <label className="block text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                  Bank
                </label>
                <select
                  value={bulkEditForm.bank || ''}
                  onChange={e =>
                    setBulkEditForm({ ...bulkEditForm, bank: e.target.value || undefined })
                  }
                  className="w-full bg-white dark:bg-slate-700 border-2 border-indigo-200 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Don't change --</option>
                  {banks.map(bank => (
                    <option key={bank.id} value={bank.name}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month and Year */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                    Month
                  </label>
                  <select
                    value={bulkEditForm.month?.toString() || ''}
                    onChange={e =>
                      setBulkEditForm({
                        ...bulkEditForm,
                        month: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-full bg-white dark:bg-slate-700 border-2 border-indigo-200 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Don't change --</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={month}>
                        {new Date(2000, month - 1).toLocaleDateString('pt-PT', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                    Year
                  </label>
                  <select
                    value={bulkEditForm.year?.toString() || ''}
                    onChange={e =>
                      setBulkEditForm({
                        ...bulkEditForm,
                        year: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-full bg-white dark:bg-slate-700 border-2 border-indigo-200 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Don't change --</option>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(
                      year => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowBulkEditDialog(false)
                  setBulkEditForm({})
                }}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-600 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={bulkEditTransactions}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 font-semibold transition-all"
              >
                {loading ? 'Updating...' : 'Update All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/60 dark:border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">⚠️</div>
              <h3 className="text-xl font-bold text-indigo-950 dark:text-white">
                {confirmDialog.title}
              </h3>
            </div>
            <p className="text-indigo-700 dark:text-slate-300 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-white/80 dark:bg-slate-700 text-indigo-950 dark:text-white rounded-xl hover:shadow-lg font-semibold transition-all border border-indigo-200 dark:border-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg font-semibold transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
