'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'

type CashFlowNodeData = {
  label: string
  amount: number
  percentage: number
  type: 'income' | 'expense' | 'total'
  color: string
}

const CashFlowNode = memo(({ data }: any) => {
  const { label, amount, percentage, type, color } = data

  const getBorderColor = () => {
    if (type === 'income') return 'border-green-400'
    if (type === 'expense') return 'border-red-400'
    return 'border-blue-400'
  }

  const getBackgroundColor = () => {
    if (type === 'income') return 'bg-success/10 dark:bg-success/20'
    if (type === 'expense') return 'bg-danger/10 dark:bg-danger/20'
    return 'bg-primary/10 dark:bg-primary/20'
  }

  const getTextColor = () => {
    if (type === 'income') return 'text-green-700'
    if (type === 'expense') return 'text-red-700'
    return 'text-blue-700'
  }

  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 shadow-md
        ${getBackgroundColor()} ${getBorderColor()}
        hover:shadow-lg transition-all duration-200 hover:scale-105
        min-w-[200px] max-w-[300px]
      `}
      style={{
        borderLeftWidth: '6px',
        borderLeftColor: color,
      }}
    >
      {/* Source handle (left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />

      {/* Content */}
      <div className="flex flex-col gap-1">
        <div className={`text-sm font-semibold ${getTextColor()} truncate`}>{label}</div>
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-lg font-bold text-gray-900">
            €
            {amount.toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs font-medium text-gray-600">{percentage.toFixed(1)}%</div>
        </div>
      </div>

      {/* Target handle (right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
    </div>
  )
})

CashFlowNode.displayName = 'CashFlowNode'

export default CashFlowNode
