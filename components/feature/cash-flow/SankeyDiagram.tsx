'use client'

import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps,
  getBezierPath,
  EdgeProps,
  BaseEdge,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Plus, Minus } from 'lucide-react'

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

interface SankeyDiagramProps {
  financialData: CashFlowData
}

// Custom CashFlow Center Node Component
function CashFlowNodeComponent({ id, data, selected }: NodeProps) {
  const { totalIncome, totalExpenses, onNodeInteract } = data as any
  const balance = totalIncome - totalExpenses

  const handleMouseDown = () => {
    if (onNodeInteract) onNodeInteract(id, true)
  }

  const handleMouseUp = () => {
    if (onNodeInteract) onNodeInteract(id, false)
  }

  const handleMouseLeave = () => {
    if (onNodeInteract) onNodeInteract(id, false)
  }

  return (
    <div
      className={`
        px-4 py-3 rounded-xl border-2 shadow-lg cursor-grab active:cursor-grabbing
        bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600
        hover:shadow-xl transition-all duration-200
        min-w-[180px]
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : ''}
      `}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-green-500 !border-white dark:!border-slate-800 !border-2"
      />

      <div className="text-center mb-2">
        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Cash Flow</div>
      </div>

      <div className="space-y-2">
        {/* Income */}
        <div className="flex items-center justify-between gap-3 bg-green-50 dark:bg-green-900/30 rounded-lg px-2 py-1.5 border border-green-200 dark:border-green-700">
          <span className="text-xs font-medium text-green-700 dark:text-green-400">Entrada</span>
          <span className="text-sm font-bold text-green-600 dark:text-green-300">
            €
            {totalIncome.toLocaleString('pt-PT', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </span>
        </div>

        {/* Expenses */}
        <div className="flex items-center justify-between gap-3 bg-red-50 dark:bg-red-900/30 rounded-lg px-2 py-1.5 border border-red-200 dark:border-red-700">
          <span className="text-xs font-medium text-red-700 dark:text-red-400">Saída</span>
          <span className="text-sm font-bold text-red-600 dark:text-red-300">
            €
            {totalExpenses.toLocaleString('pt-PT', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </span>
        </div>

        {/* Balance */}
        <div
          className={`flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 border ${
            balance >= 0
              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700'
              : 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700'
          }`}
        >
          <span
            className={`text-xs font-medium ${balance >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'}`}
          >
            Saldo
          </span>
          <span
            className={`text-sm font-bold ${balance >= 0 ? 'text-blue-600 dark:text-blue-300' : 'text-orange-600 dark:text-orange-300'}`}
          >
            {balance >= 0 ? '+' : ''}€
            {balance.toLocaleString('pt-PT', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-red-500 !border-white dark:!border-slate-800 !border-2"
      />
    </div>
  )
}

// Custom Sankey Node Component with expand/collapse
function SankeyNodeComponent({ id, data, selected }: NodeProps) {
  const {
    label,
    amount,
    percentage,
    nodeType,
    color,
    hasChildren,
    isExpanded,
    childCount,
    onToggleExpand,
    showExpandButton,
    onNodeInteract,
  } = data as any

  const getBgColor = () => {
    if (nodeType === 'income') return 'bg-success/10 dark:bg-success/20'
    if (nodeType === 'budget') return 'bg-primary/10 dark:bg-primary/20'
    return 'bg-danger/10 dark:bg-danger/20'
  }

  const getBorderColor = () => {
    if (nodeType === 'income') return 'border-green-300 dark:border-green-600'
    if (nodeType === 'budget') return 'border-blue-300 dark:border-blue-600'
    return 'border-red-300 dark:border-red-600'
  }

  const getTextColor = () => {
    if (nodeType === 'income') return 'text-green-700 dark:text-green-300'
    if (nodeType === 'budget') return 'text-blue-700 dark:text-blue-300'
    return 'text-red-700 dark:text-red-300'
  }

  const getAmountColor = () => {
    if (nodeType === 'income') return 'text-green-600 dark:text-green-400'
    if (nodeType === 'budget') return 'text-blue-600 dark:text-blue-400'
    return 'text-red-600 dark:text-red-400'
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onToggleExpand) {
      onToggleExpand()
    }
  }

  const handleMouseDown = () => {
    if (onNodeInteract) onNodeInteract(id, true)
  }

  const handleMouseUp = () => {
    if (onNodeInteract) onNodeInteract(id, false)
  }

  const handleMouseLeave = () => {
    if (onNodeInteract) onNodeInteract(id, false)
  }

  // Show expand button on nodes that have children (both income and expense, but not budget)
  const canExpand = showExpandButton && hasChildren && nodeType !== 'budget'

  return (
    <div className="flex items-center">
      <div
        className={`
          px-3 py-2.5 rounded-lg border-2 shadow-md cursor-grab active:cursor-grabbing
          ${getBgColor()} ${getBorderColor()}
          hover:shadow-lg transition-all duration-200
          min-w-[160px] max-w-[220px]
          ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        `}
        style={{
          borderLeftWidth: '5px',
          borderLeftColor: color || '#94a3b8',
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="w-2 h-2 !bg-gray-400 dark:!bg-gray-500 !border-white dark:!border-slate-800 !border-2"
        />

        <div className="flex flex-col gap-1">
          <div className={`text-sm font-semibold ${getTextColor()} truncate`} title={label}>
            {label}
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <div className={`text-base font-bold ${getAmountColor()}`}>
              €
              {amount.toLocaleString('pt-PT', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </div>
            <div className="flex items-center gap-1.5">
              {hasChildren && !isExpanded && nodeType !== 'budget' && (
                <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                  +{childCount}
                </span>
              )}
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <Handle
          type="source"
          position={Position.Right}
          className="w-2 h-2 !bg-gray-400 dark:!bg-gray-500 !border-white dark:!border-slate-800 !border-2"
        />
      </div>

      {/* Expand/Collapse button - only for nodes with children */}
      {canExpand && (
        <button
          onClick={handleToggle}
          className={`
            ml-2 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
            border-2 transition-all duration-200 cursor-pointer
            ${
              isExpanded
                ? 'bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/70'
                : 'bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-600 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/70'
            }
          `}
          title={isExpanded ? 'Recolher subcategorias' : `Expandir ${childCount} subcategorias`}
        >
          {isExpanded ? (
            <Minus className="w-3.5 h-3.5" strokeWidth={3} />
          ) : (
            <Plus className="w-3.5 h-3.5" strokeWidth={3} />
          )}
        </button>
      )}
    </div>
  )
}

// Custom Flow Edge with variable width and energy flow animation
function FlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  source,
  target,
  data,
  style,
}: EdgeProps) {
  const {
    value,
    maxValue,
    totalIncome,
    totalExpenses,
    isExpenseEdge,
    sourceColor,
    targetColor,
    isHighlighted,
    highlightedNodeId,
  } = data as any

  // Check if this edge is connected to the highlighted node
  const isConnected =
    highlightedNodeId && (source === highlightedNodeId || target === highlightedNodeId)

  // Calculate stroke width based on percentage of the appropriate total
  // Income edges use totalIncome, expense edges use totalExpenses
  const referenceTotal = isExpenseEdge ? totalExpenses : totalIncome
  // Using sqrt scaling to make smaller values more visible while still showing difference
  const percentage = referenceTotal > 0 ? (value / referenceTotal) * 100 : 0
  const minWidth = 3
  const maxWidth = 35
  // Square root scaling for better visual distribution
  const scaledPercentage = Math.sqrt(percentage / 100)
  const baseStrokeWidth = minWidth + scaledPercentage * (maxWidth - minWidth)
  const strokeWidth = isConnected ? baseStrokeWidth + 4 : baseStrokeWidth

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.4,
  })

  // Create gradient ID unique to this edge
  const gradientId = `gradient-${id}`
  const flowGradientId = `flow-gradient-${id}`

  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop
            offset="0%"
            stopColor={sourceColor || '#22c55e'}
            stopOpacity={isConnected ? 0.9 : 0.5}
          />
          <stop
            offset="100%"
            stopColor={targetColor || '#ef4444'}
            stopOpacity={isConnected ? 0.9 : 0.5}
          />
        </linearGradient>
        {isConnected && (
          <linearGradient id={flowGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0">
              <animate attributeName="offset" values="-0.5;1" dur="1.5s" repeatCount="indefinite" />
            </stop>
            <stop offset="25%" stopColor="white" stopOpacity="0.8">
              <animate
                attributeName="offset"
                values="-0.25;1.25"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%" stopColor="white" stopOpacity="0">
              <animate attributeName="offset" values="0;1.5" dur="1.5s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
        )}
      </defs>
      {/* Base edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          strokeWidth,
          stroke: `url(#${gradientId})`,
          strokeLinecap: 'round',
          filter: isConnected ? 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))' : undefined,
          transition: 'stroke-width 0.3s ease, filter 0.3s ease',
        }}
      />
      {/* Animated energy flow overlay */}
      {isConnected && (
        <path
          d={edgePath}
          fill="none"
          stroke={`url(#${flowGradientId})`}
          strokeWidth={strokeWidth * 0.6}
          strokeLinecap="round"
          style={{
            pointerEvents: 'none',
          }}
        />
      )}
    </>
  )
}

const nodeTypes = {
  sankeyNode: SankeyNodeComponent,
  cashFlowNode: CashFlowNodeComponent,
}

const edgeTypes = {
  flowEdge: FlowEdge,
}

// Layout constants
const COLUMN_SPACING = 350
const NODE_HEIGHT = 70
const NODE_MIN_SPACING = 20

// Wrapper component that provides ReactFlowProvider
export default function SankeyDiagram({ financialData }: SankeyDiagramProps) {
  return (
    <ReactFlowProvider>
      <SankeyDiagramInner financialData={financialData} />
    </ReactFlowProvider>
  )
}

function SankeyDiagramInner({ financialData }: SankeyDiagramProps) {
  const reactFlowInstance = useReactFlow()
  // Track which node is being interacted with (for edge highlighting)
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)

  // Handle node interaction (mouse down/up)
  const handleNodeInteract = useCallback((nodeId: string, isActive: boolean) => {
    setActiveNodeId(isActive ? nodeId : null)
  }, [])

  // Build parent-child relationships and graph structure from links
  const { childrenMap, parentMap, rootNodes, outgoingLinks, incomingLinks } = useMemo(() => {
    if (!financialData || !financialData.nodes || !financialData.links) {
      return {
        childrenMap: new Map<string, Set<string>>(),
        parentMap: new Map<string, string>(),
        rootNodes: new Set<string>(),
        outgoingLinks: new Map<string, SankeyLink[]>(),
        incomingLinks: new Map<string, SankeyLink[]>(),
      }
    }

    const childrenMap = new Map<string, Set<string>>()
    const parentMap = new Map<string, string>()
    const outgoingLinks = new Map<string, SankeyLink[]>()
    const incomingLinks = new Map<string, SankeyLink[]>()

    // Initialize for all nodes
    financialData.nodes.forEach(node => {
      childrenMap.set(node.id, new Set())
      outgoingLinks.set(node.id, [])
      incomingLinks.set(node.id, [])
    })

    // Build relationships from links
    financialData.links.forEach(link => {
      const children = childrenMap.get(link.source)
      if (children) {
        children.add(link.target)
      }
      parentMap.set(link.target, link.source)

      const outLinks = outgoingLinks.get(link.source)
      if (outLinks) {
        outLinks.push(link)
      }

      const inLinks = incomingLinks.get(link.target)
      if (inLinks) {
        inLinks.push(link)
      }
    })

    // Find root nodes (nodes that are never targets)
    const rootNodes = new Set<string>()
    financialData.nodes.forEach(node => {
      if (!parentMap.has(node.id)) {
        rootNodes.add(node.id)
      }
    })

    return { childrenMap, parentMap, rootNodes, outgoingLinks, incomingLinks }
  }, [financialData])

  // Find budget node level
  const budgetLevel = useMemo(() => {
    const budgetNode = financialData?.nodes.find(n => n.id === 'budget')
    return budgetNode?.level ?? 1
  }, [financialData])

  // Track which nodes are expanded
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => new Set<string>())
  const [isInitialized, setIsInitialized] = useState(false)
  const [edgeKey, setEdgeKey] = useState(0) // Force edge re-render

  // Initialize
  useEffect(() => {
    if (rootNodes.size > 0 && !isInitialized) {
      setExpandedNodes(new Set())
      setIsInitialized(true)
    }
  }, [rootNodes, isInitialized])

  // Toggle expand/collapse for a node
  const toggleExpand = useCallback(
    (nodeId: string) => {
      setExpandedNodes(prev => {
        const next = new Set(prev)
        if (next.has(nodeId)) {
          // Collapse: remove this node and all descendants from expanded set
          next.delete(nodeId)
          const collapseDescendants = (id: string) => {
            const children = childrenMap.get(id)
            if (children) {
              children.forEach(childId => {
                next.delete(childId)
                collapseDescendants(childId)
              })
            }
          }
          collapseDescendants(nodeId)
        } else {
          // Expand: add this node to expanded set
          next.add(nodeId)
        }
        return next
      })
      // Force edge re-render
      setEdgeKey(k => k + 1)
    },
    [childrenMap]
  )

  // Calculate visible nodes and create aggregated edges
  const { visibleNodes, visibleEdges } = useMemo(() => {
    if (!financialData || !financialData.nodes || !financialData.links) {
      return { visibleNodes: [], visibleEdges: [] }
    }

    // Determine which nodes should be visible:
    // 1. Root nodes (income majors - no parent)
    // 2. Budget node
    // 3. First level after budget (expense majors)
    // 4. Any node whose parent is expanded
    const visibleNodeIds = new Set<string>()

    financialData.nodes.forEach(node => {
      const parent = parentMap.get(node.id)
      const isRoot = !parent
      const isBudget = node.id === 'budget'
      const parentIsBudget = parent === 'budget'
      const parentIsExpanded = parent && expandedNodes.has(parent)

      if (isRoot || isBudget || parentIsBudget || parentIsExpanded) {
        visibleNodeIds.add(node.id)
      }
    })

    // Build edges between visible nodes
    // Use direct links when both source and target are visible
    // Use aggregated links when intermediate nodes are hidden
    const aggregatedEdges: SankeyLink[] = []
    const edgeMap = new Map<string, number>() // key: "source->target", value: total flow

    // For each visible node, trace paths to find visible targets
    visibleNodeIds.forEach(sourceId => {
      const sourceOutgoing = outgoingLinks.get(sourceId) || []

      sourceOutgoing.forEach(link => {
        // BFS to find visible targets
        const queue: { nodeId: string; flowValue: number }[] = [
          { nodeId: link.target, flowValue: link.value },
        ]
        const visited = new Set<string>()

        while (queue.length > 0) {
          const { nodeId, flowValue } = queue.shift()!

          if (visited.has(nodeId)) continue
          visited.add(nodeId)

          if (visibleNodeIds.has(nodeId)) {
            // Target is visible - add to edge map
            const key = `${sourceId}->${nodeId}`
            edgeMap.set(key, (edgeMap.get(key) || 0) + flowValue)
          } else {
            // Target is hidden - continue through its outgoing links
            const childOutgoing = outgoingLinks.get(nodeId) || []
            childOutgoing.forEach(childLink => {
              if (!visited.has(childLink.target)) {
                queue.push({ nodeId: childLink.target, flowValue: childLink.value })
              }
            })
          }
        }
      })
    })

    // Convert edge map to array
    edgeMap.forEach((value, key) => {
      const [source, target] = key.split('->')
      if (value > 0) {
        aggregatedEdges.push({ source, target, value })
      }
    })

    // Get nodes that are used in edges (either as source or target)
    const usedNodeIds = new Set<string>()
    aggregatedEdges.forEach(link => {
      usedNodeIds.add(link.source)
      usedNodeIds.add(link.target)
    })

    // Final visible nodes = visible AND (used in edges OR is budget)
    const finalVisibleNodeIds = new Set(
      Array.from(visibleNodeIds).filter(id => usedNodeIds.has(id) || id === 'budget')
    )

    const visibleNodesData = financialData.nodes.filter(node => finalVisibleNodeIds.has(node.id))

    return { visibleNodes: visibleNodesData, visibleEdges: aggregatedEdges }
  }, [financialData, expandedNodes, parentMap, outgoingLinks])

  // Build React Flow nodes and edges
  const { flowNodes, flowEdges } = useMemo(() => {
    if (visibleNodes.length === 0) {
      return { flowNodes: [], flowEdges: [] }
    }

    // Organize nodes by their display column
    const incomeNodes: SankeyNode[] = []
    const budgetNodes: SankeyNode[] = []
    const expenseNodes: SankeyNode[] = []

    visibleNodes.forEach(node => {
      if (node.id === 'budget') {
        budgetNodes.push(node)
      } else if (node.level < budgetLevel) {
        incomeNodes.push(node)
      } else {
        expenseNodes.push(node)
      }
    })

    // Sort by amount descending
    incomeNodes.sort((a, b) => b.amount - a.amount)
    expenseNodes.sort((a, b) => b.amount - a.amount)

    // Group by level for column placement
    const incomeByLevel = new Map<number, SankeyNode[]>()
    incomeNodes.forEach(node => {
      if (!incomeByLevel.has(node.level)) {
        incomeByLevel.set(node.level, [])
      }
      incomeByLevel.get(node.level)!.push(node)
    })

    const expenseByLevel = new Map<number, SankeyNode[]>()
    expenseNodes.forEach(node => {
      if (!expenseByLevel.has(node.level)) {
        expenseByLevel.set(node.level, [])
      }
      expenseByLevel.get(node.level)!.push(node)
    })

    // Calculate positions
    const incomeLevels = Array.from(incomeByLevel.keys()).sort((a, b) => a - b)
    const expenseLevels = Array.from(expenseByLevel.keys()).sort((a, b) => a - b)

    const totalIncomeCols = incomeLevels.length
    const budgetCol = totalIncomeCols
    const expenseStartCol = budgetCol + 1

    // Calculate max nodes for height
    const allLevelCounts = [
      ...Array.from(incomeByLevel.values()).map(n => n.length),
      1,
      ...Array.from(expenseByLevel.values()).map(n => n.length),
    ]
    const maxNodesInLevel = Math.max(...allLevelCounts, 1)
    const totalHeight = maxNodesInLevel * (NODE_HEIGHT + NODE_MIN_SPACING)

    const maxLinkValue = Math.max(...visibleEdges.map(l => l.value), 1)
    const nodeColorMap = new Map(financialData.nodes.map(n => [n.id, n.color]))

    const nodes: Node[] = []

    // Position income nodes
    incomeLevels.forEach((level, colOffset) => {
      const levelNodes = incomeByLevel.get(level)!
      levelNodes.sort((a, b) => b.amount - a.amount)
      const levelHeight = levelNodes.length * (NODE_HEIGHT + NODE_MIN_SPACING)
      const startY = (totalHeight - levelHeight) / 2

      levelNodes.forEach((node, rowIndex) => {
        const percentage =
          financialData.totalIncome > 0 ? (node.amount / financialData.totalIncome) * 100 : 0
        const children = childrenMap.get(node.id)
        const hasChildren = children && children.size > 0
        const isExpanded = expandedNodes.has(node.id)

        nodes.push({
          id: node.id,
          type: 'sankeyNode',
          position: {
            x: colOffset * COLUMN_SPACING,
            y: startY + rowIndex * (NODE_HEIGHT + NODE_MIN_SPACING),
          },
          data: {
            label: node.label,
            amount: node.amount,
            percentage,
            nodeType: 'income',
            color: node.color || '#10b981',
            hasChildren,
            isExpanded,
            childCount: children?.size || 0,
            onToggleExpand: () => toggleExpand(node.id),
            showExpandButton: true,
            onNodeInteract: handleNodeInteract,
          },
          draggable: true,
        })
      })
    })

    // Position CashFlow center node (replaces budget node)
    budgetNodes.forEach(node => {
      nodes.push({
        id: node.id,
        type: 'cashFlowNode',
        position: {
          x: budgetCol * COLUMN_SPACING,
          y: totalHeight / 2 - 60, // Slightly taller node
        },
        data: {
          totalIncome: financialData.totalIncome,
          totalExpenses: financialData.totalExpenses,
          onNodeInteract: handleNodeInteract,
        },
        draggable: true,
      })
    })

    // Position expense nodes
    expenseLevels.forEach((level, colOffset) => {
      const levelNodes = expenseByLevel.get(level)!
      levelNodes.sort((a, b) => b.amount - a.amount)
      const levelHeight = levelNodes.length * (NODE_HEIGHT + NODE_MIN_SPACING)
      const startY = (totalHeight - levelHeight) / 2

      levelNodes.forEach((node, rowIndex) => {
        // Expense percentage relative to total expenses (not income)
        const percentage =
          financialData.totalExpenses > 0 ? (node.amount / financialData.totalExpenses) * 100 : 0
        const children = childrenMap.get(node.id)
        const hasChildren = children && children.size > 0
        const isExpanded = expandedNodes.has(node.id)

        nodes.push({
          id: node.id,
          type: 'sankeyNode',
          position: {
            x: (expenseStartCol + colOffset) * COLUMN_SPACING,
            y: startY + rowIndex * (NODE_HEIGHT + NODE_MIN_SPACING),
          },
          data: {
            label: node.label,
            amount: node.amount,
            percentage,
            nodeType: 'expense',
            color: node.color || '#ef4444',
            hasChildren,
            isExpanded,
            childCount: children?.size || 0,
            onToggleExpand: () => toggleExpand(node.id),
            showExpandButton: true,
            onNodeInteract: handleNodeInteract,
          },
          draggable: true,
        })
      })
    })

    // Create edges with highlight info
    // Determine expense node IDs (nodes with level > budgetLevel)
    const expenseNodeIds = new Set(
      financialData.nodes.filter(n => n.level > budgetLevel).map(n => n.id)
    )

    const edges: Edge[] = visibleEdges.map(link => {
      const sourceColor = nodeColorMap.get(link.source) || '#22c55e'
      const targetColor = nodeColorMap.get(link.target) || '#ef4444'
      // Edge is an expense edge if the source is 'budget' or both source and target are expense nodes
      const isExpenseEdge =
        link.source === 'budget' ||
        (expenseNodeIds.has(link.source) && expenseNodeIds.has(link.target))

      return {
        id: `edge-${link.source}-${link.target}`,
        source: link.source,
        target: link.target,
        type: 'flowEdge',
        data: {
          value: link.value,
          maxValue: maxLinkValue,
          totalIncome: financialData.totalIncome,
          totalExpenses: financialData.totalExpenses,
          isExpenseEdge,
          sourceColor,
          targetColor,
          highlightedNodeId: activeNodeId,
        },
        animated: false,
      }
    })

    return { flowNodes: nodes, flowEdges: edges }
  }, [
    visibleNodes,
    visibleEdges,
    financialData,
    childrenMap,
    expandedNodes,
    toggleExpand,
    budgetLevel,
    handleNodeInteract,
    activeNodeId,
    edgeKey,
  ])

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges)

  // Update nodes and edges when they change
  // Use React Flow instance to properly update and trigger edge recalculation
  useEffect(() => {
    // Update nodes first
    reactFlowInstance.setNodes(flowNodes)
    // Then update edges after a small delay to ensure nodes are positioned
    const timeoutId = setTimeout(() => {
      reactFlowInstance.setEdges(flowEdges)
    }, 50)
    return () => clearTimeout(timeoutId)
  }, [flowNodes, flowEdges, reactFlowInstance])

  // Expand all nodes
  const expandAll = useCallback(() => {
    const allNodeIds = new Set(financialData?.nodes.map(n => n.id) || [])
    setExpandedNodes(allNodeIds)
    setEdgeKey(k => k + 1)
  }, [financialData])

  // Collapse all nodes
  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set())
    setEdgeKey(k => k + 1)
  }, [])

  if (!financialData || !financialData.nodes || !financialData.links) {
    return (
      <div
        className="w-full bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-4 flex items-center justify-center"
        style={{ height: '700px' }}
      >
        <p className="text-gray-500 dark:text-gray-400">A carregar dados...</p>
      </div>
    )
  }

  if (flowNodes.length === 0) {
    return (
      <div
        className="w-full bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-4 flex items-center justify-center"
        style={{ height: '700px' }}
      >
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-2">Sem dados para visualizar</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Não há transações suficientes neste período para gerar o diagrama de fluxo de caixa.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="w-full bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 relative"
      style={{ height: '700px' }}
    >
      {/* Expand/Collapse all controls */}
      <div className="absolute top-3 left-3 z-10 flex gap-2">
        <button
          onClick={expandAll}
          className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 shadow-sm transition-colors flex items-center gap-1.5"
          title="Expandir todas as categorias"
        >
          <Plus className="w-3.5 h-3.5" />
          Expandir Tudo
        </button>
        <button
          onClick={collapseAll}
          className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 shadow-sm transition-colors flex items-center gap-1.5"
          title="Recolher todas as categorias"
        >
          <Minus className="w-3.5 h-3.5" />
          Recolher Tudo
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.3}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        panOnDrag={[1, 2]}
        selectionOnDrag={false}
        className="dark:bg-slate-900"
      >
        <Background color="#e5e7eb" className="dark:!bg-slate-900" gap={20} />
        <Controls
          showInteractive={false}
          position="bottom-right"
          className="!bg-white dark:!bg-slate-800 !border-gray-200 dark:!border-slate-600 !shadow-sm [&>button]:!bg-white dark:[&>button]:!bg-slate-800 [&>button]:!border-gray-200 dark:[&>button]:!border-slate-600 [&>button]:!text-gray-600 dark:[&>button]:!text-gray-300 [&>button:hover]:!bg-gray-50 dark:[&>button:hover]:!bg-slate-700"
        />
      </ReactFlow>
      <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-600 shadow-sm">
        <span className="font-medium">Dica:</span> Clique e segure um nó para ver o fluxo de energia
        nas conexões
      </div>
    </div>
  )
}
