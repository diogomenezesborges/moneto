'use client'

/**
 * Investments Feature - Main Component
 *
 * Top-level component for investment tracking feature.
 * Issue #108: Investment Tracking - Feature Structure
 */

import { useState } from 'react'
import { Plus, TrendingUp, DollarSign, BookOpen, BarChart3 } from 'lucide-react'
import { useHoldings } from '@/lib/queries/investments'
import { HoldingsList } from './HoldingsList'
import { HoldingDialog } from './HoldingDialog'
import { PortfolioSummary } from './PortfolioSummary'
import { CohortPerformanceView } from './CohortPerformanceView'
import { CostTransparencyDashboard } from './CostTransparencyDashboard'
import { InvestmentJournal } from './InvestmentJournal'
import type { HoldingWithStats } from '../types'

type TabId = 'portfolio' | 'cohorts' | 'costs' | 'journal'

interface Tab {
  id: TabId
  label: string
  icon: typeof BarChart3
}

interface InvestmentsFeatureProps {
  token: string
}

const TABS: Tab[] = [
  { id: 'portfolio', label: 'Portfólio', icon: BarChart3 },
  { id: 'cohorts', label: 'Desempenho por Compra', icon: TrendingUp },
  { id: 'costs', label: 'Custos', icon: DollarSign },
  { id: 'journal', label: 'Diário', icon: BookOpen },
]

export function InvestmentsFeature({ token }: InvestmentsFeatureProps) {
  const { data: holdings, isLoading, error } = useHoldings()
  const [activeTab, setActiveTab] = useState<TabId>('portfolio')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingHolding, setEditingHolding] = useState<HoldingWithStats | null>(null)

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-2">Erro ao carregar investimentos</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {error instanceof Error ? error.message : 'Erro desconhecido'}
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">A carregar investimentos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Investimentos</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Acompanhe o desempenho dos seus ativos
          </p>
        </div>
        {activeTab === 'portfolio' && (
          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>Adicionar Ativo</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-8 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3 px-1 min-h-[44px] border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span className="font-medium whitespace-nowrap">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'portfolio' && (
        <>
          {/* Portfolio Summary */}
          {holdings && holdings.length > 0 && <PortfolioSummary holdings={holdings} />}

          {/* Holdings List */}
          {holdings && holdings.length > 0 ? (
            <HoldingsList holdings={holdings} onEdit={setEditingHolding} />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Ainda não tem investimentos registados
              </p>
              <button
                onClick={() => setIsAddDialogOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                <span>Adicionar Primeiro Ativo</span>
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === 'cohorts' && <CohortPerformanceView />}

      {activeTab === 'costs' && <CostTransparencyDashboard />}

      {activeTab === 'journal' && <InvestmentJournal />}

      {/* Add/Edit Holding Dialog */}
      {(isAddDialogOpen || editingHolding) && (
        <HoldingDialog
          holding={editingHolding}
          onClose={() => {
            setIsAddDialogOpen(false)
            setEditingHolding(null)
          }}
        />
      )}
    </div>
  )
}
