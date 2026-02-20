/**
 * MobileFilterSheet Component
 *
 * Bottom sheet drawer for transaction filters on mobile devices.
 * Provides a mobile-optimized UX for filtering with large touch targets.
 *
 * Features:
 * - Slides up from bottom (iOS/Android style)
 * - Backdrop overlay
 * - Drag handle for closing
 * - Large, touch-friendly controls
 * - Sticky header with actions
 */

'use client'

import { useEffect } from 'react'
import { X, Filter, Trash2 } from 'lucide-react'
import { Select } from '@/components/ui/Select'
import { DateInput } from '@/components/ui/DateInput'

interface MobileFilterSheetProps {
  isOpen: boolean
  onClose: () => void

  // Filter values
  filterStatus: string
  setFilterStatus: (value: string) => void
  filterOrigin: string
  setFilterOrigin: (value: string) => void
  filterBank: string
  setFilterBank: (value: string) => void
  filterDateFrom: Date | null
  setFilterDateFrom: (value: Date | null) => void
  filterDateTo: Date | null
  setFilterDateTo: (value: Date | null) => void
  sortField: 'date' | 'amount' | 'description' | 'origin' | 'bank'
  setSortField: (value: 'date' | 'amount' | 'description' | 'origin' | 'bank') => void

  // Additional data
  uniqueOrigins: string[]
  uniqueBanks: string[]
  hasActiveFilters: boolean
  clearAllFilters: () => void

  language?: 'en' | 'pt'
}

export function MobileFilterSheet({
  isOpen,
  onClose,
  filterStatus,
  setFilterStatus,
  filterOrigin,
  setFilterOrigin,
  filterBank,
  setFilterBank,
  filterDateFrom,
  setFilterDateFrom,
  filterDateTo,
  setFilterDateTo,
  sortField,
  setSortField,
  uniqueOrigins,
  uniqueBanks,
  hasActiveFilters,
  clearAllFilters,
  language = 'en',
}: MobileFilterSheetProps) {
  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleClearAndClose = () => {
    clearAllFilters()
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        className={`
          fixed inset-x-0 bottom-0 z-50
          bg-white dark:bg-gray-800
          rounded-t-3xl shadow-2xl
          max-h-[85vh] overflow-hidden
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-sheet-title"
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Filter size={20} className="text-indigo-600 dark:text-indigo-400" />
              <h2
                id="filter-sheet-title"
                className="text-lg font-bold text-gray-900 dark:text-white"
              >
                {language === 'pt' ? 'Filtros' : 'Filters'}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={language === 'pt' ? 'Fechar' : 'Close'}
            >
              <X size={24} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          className="overflow-y-auto px-6 py-6 space-y-6"
          style={{ maxHeight: 'calc(85vh - 140px)' }}
        >
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {language === 'pt' ? 'Estado' : 'Status'}
            </label>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'all', label: language === 'pt' ? 'Todos' : 'All Status' },
                { value: 'pending', label: language === 'pt' ? 'Pendente' : 'Pending' },
                { value: 'categorized', label: language === 'pt' ? 'Categorizado' : 'Categorized' },
              ]}
              placeholder={language === 'pt' ? 'Selecionar estado' : 'Select status'}
              className="min-h-[48px]"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {language === 'pt' ? 'Data Início' : 'From Date'}
              </label>
              <DateInput
                value={filterDateFrom}
                onChange={setFilterDateFrom}
                placeholder={language === 'pt' ? 'Início' : 'From'}
                className="px-4 py-3 min-h-[48px] bg-white dark:bg-gray-700 border-2 rounded-xl w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {language === 'pt' ? 'Data Fim' : 'To Date'}
              </label>
              <DateInput
                value={filterDateTo}
                onChange={setFilterDateTo}
                placeholder={language === 'pt' ? 'Fim' : 'To'}
                className="px-4 py-3 min-h-[48px] bg-white dark:bg-gray-700 border-2 rounded-xl w-full"
              />
            </div>
          </div>

          {/* Origin Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {language === 'pt' ? 'Origem' : 'Origin'}
            </label>
            <Select
              value={filterOrigin}
              onChange={setFilterOrigin}
              options={[
                { value: 'all', label: language === 'pt' ? 'Todas' : 'All Origins' },
                ...uniqueOrigins.map(o => ({ value: o, label: o })),
              ]}
              placeholder={language === 'pt' ? 'Selecionar origem' : 'Select origin'}
              className="min-h-[48px]"
            />
          </div>

          {/* Bank Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {language === 'pt' ? 'Banco' : 'Bank'}
            </label>
            <Select
              value={filterBank}
              onChange={setFilterBank}
              options={[
                { value: 'all', label: language === 'pt' ? 'Todos' : 'All Banks' },
                ...uniqueBanks.map(b => ({ value: b, label: b })),
              ]}
              placeholder={language === 'pt' ? 'Selecionar banco' : 'Select bank'}
              className="min-h-[48px]"
            />
          </div>

          {/* Sort Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {language === 'pt' ? 'Ordenar por' : 'Sort by'}
            </label>
            <Select
              value={sortField}
              onChange={val => setSortField(val as any)}
              options={[
                { value: 'date', label: language === 'pt' ? 'Data' : 'Date' },
                { value: 'amount', label: language === 'pt' ? 'Valor' : 'Amount' },
                { value: 'description', label: language === 'pt' ? 'Descrição' : 'Description' },
              ]}
              placeholder={language === 'pt' ? 'Selecionar ordem' : 'Select sort'}
              className="min-h-[48px]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex gap-3">
            {hasActiveFilters && (
              <button
                onClick={handleClearAndClose}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors min-h-[52px] border-2 border-red-200 dark:border-red-800"
              >
                <Trash2 size={18} />
                <span>{language === 'pt' ? 'Limpar Tudo' : 'Clear All'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors min-h-[52px]"
            >
              {language === 'pt' ? 'Aplicar Filtros' : 'Apply Filters'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
