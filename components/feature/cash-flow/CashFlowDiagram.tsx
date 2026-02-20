'use client'

import React, { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import CashFlowNode from './CashFlowNode'

type MoneyFlow = {
  label: string
  amount: number
  icon?: string
  color?: string
}

type FlowConnection = {
  srcIdx: number
  tgtIdx: number
  amount: number
}

type FinancialData = {
  period: string
  incomeSources: MoneyFlow[]
  incomeTypes: MoneyFlow[]
  totalIncome: number
  spendingCategories: MoneyFlow[]
  incomeFlows: FlowConnection[]
  spendingFlows: FlowConnection[]
}

interface CashFlowDiagramProps {
  financialData: FinancialData
}

const nodeTypes = {
  cashFlowNode: CashFlowNode as any,
}

// Layout configuration
const COLUMN_WIDTH = 350
const NODE_HEIGHT = 100
const NODE_SPACING = 30

export default function CashFlowDiagram({ financialData }: CashFlowDiagramProps) {
  const {
    incomeSources,
    incomeTypes,
    totalIncome,
    spendingCategories,
    incomeFlows,
    spendingFlows,
  } = financialData

  // Generate nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = []
    const edges: Edge[] = []

    // Calculate max amount for scaling edge widths
    const allAmounts = [
      ...incomeSources.map(s => s.amount),
      ...spendingCategories.map(c => c.amount),
    ]
    const maxAmount = Math.max(...allAmounts, 1)

    // Column 1: Income Sources
    incomeSources.forEach((source, idx) => {
      nodes.push({
        id: `src-${idx}`,
        type: 'cashFlowNode',
        position: { x: 0, y: idx * (NODE_HEIGHT + NODE_SPACING) },
        data: {
          label: source.label,
          amount: source.amount,
          percentage: (source.amount / totalIncome) * 100,
          type: 'income',
          color: source.color || '#10b981',
        },
      })
    })

    // Column 2: Income Types
    incomeTypes.forEach((type, idx) => {
      const yOffset = (incomeSources.length * (NODE_HEIGHT + NODE_SPACING)) / 2 - NODE_HEIGHT / 2
      nodes.push({
        id: `type-${idx}`,
        type: 'cashFlowNode',
        position: { x: COLUMN_WIDTH, y: yOffset + idx * (NODE_HEIGHT + NODE_SPACING) },
        data: {
          label: type.label,
          amount: type.amount,
          percentage: 100,
          type: 'income',
          color: type.color || '#10b981',
        },
      })
    })

    // Column 3: Total Income (Central node)
    nodes.push({
      id: 'total-income',
      type: 'cashFlowNode',
      position: {
        x: COLUMN_WIDTH * 2,
        y:
          (Math.max(incomeSources.length, spendingCategories.length) *
            (NODE_HEIGHT + NODE_SPACING)) /
            2 -
          NODE_HEIGHT / 2,
      },
      data: {
        label: 'Rendimento Total',
        amount: totalIncome,
        percentage: 100,
        type: 'total',
        color: '#3b82f6',
      },
    })

    // Column 4: Spending Categories
    spendingCategories.forEach((category, idx) => {
      nodes.push({
        id: `cat-${idx}`,
        type: 'cashFlowNode',
        position: { x: COLUMN_WIDTH * 3, y: idx * (NODE_HEIGHT + NODE_SPACING) },
        data: {
          label: category.label,
          amount: category.amount,
          percentage: (category.amount / totalIncome) * 100,
          type: 'expense',
          color: category.color || '#ef4444',
        },
      })
    })

    // Create edges for income flows (sources → types)
    incomeFlows.forEach((flow, idx) => {
      const strokeWidth = Math.max(2, (flow.amount / maxAmount) * 12)
      edges.push({
        id: `income-flow-${idx}`,
        source: `src-${flow.srcIdx}`,
        target: `type-${flow.tgtIdx}`,
        type: 'smoothstep',
        animated: true,
        style: {
          strokeWidth,
          stroke: '#a3e635',
          opacity: 0.6,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#a3e635',
        },
        label: `€${flow.amount.toFixed(0)}`,
        labelStyle: { fill: '#4b5563', fontSize: 12, fontWeight: 600 },
        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.8 },
      })
    })

    // Connect income types to total income
    incomeTypes.forEach((type, idx) => {
      const strokeWidth = Math.max(2, (type.amount / maxAmount) * 12)
      edges.push({
        id: `type-to-total-${idx}`,
        source: `type-${idx}`,
        target: 'total-income',
        type: 'smoothstep',
        animated: true,
        style: {
          strokeWidth,
          stroke: '#22c55e',
          opacity: 0.6,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#22c55e',
        },
      })
    })

    // Create edges for spending flows (total → categories)
    spendingFlows.forEach((flow, idx) => {
      const strokeWidth = Math.max(2, (flow.amount / maxAmount) * 12)
      edges.push({
        id: `spending-flow-${idx}`,
        source: 'total-income',
        target: `cat-${flow.tgtIdx}`,
        type: 'smoothstep',
        animated: true,
        style: {
          strokeWidth,
          stroke: '#fb923c',
          opacity: 0.6,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#fb923c',
        },
        label: `€${flow.amount.toFixed(0)}`,
        labelStyle: { fill: '#4b5563', fontSize: 12, fontWeight: 600 },
        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.8 },
      })
    })

    return { initialNodes: nodes, initialEdges: edges }
  }, [financialData])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  return (
    <div
      style={{ width: '100%', height: '700px' }}
      className="bg-gray-50 rounded-lg border border-gray-200"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background color="#e5e7eb" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={node => {
            if (node.data.type === 'income') return '#10b981'
            if (node.data.type === 'expense') return '#ef4444'
            return '#3b82f6'
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  )
}
