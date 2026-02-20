'use client'

import {
  Filter,
  Search,
  Trash2,
  ChevronDown,
  Plus,
  Upload,
  Download,
  SlidersHorizontal,
} from 'lucide-react'
import { Select } from '@/components/ui/Select'
import { DateInput } from '@/components/ui/DateInput'
import { TagSelector } from '@/components/ui/TagSelector'

interface TransactionFiltersProps {
  // Filter state
  searchTerm: string
  filterStatus: string
  filterFlagged: string
  filterMajorCategory: string
  filterCategory: string
  filterTags: string[]
  filterDateFrom: Date | null
  filterDateTo: Date | null
  filterOrigin: string
  filterBank: string
  sortField: 'date' | 'amount' | 'description' | 'origin' | 'bank'
  sortDirection: 'asc' | 'desc'
  showAdvancedFilters: boolean
  hasActiveFilters: boolean

  // Computed values
  transactionCount: number
  uniqueOrigins: string[]
  uniqueBanks: string[]
  majorCategories: Array<{ id: string; name: string; emoji?: string | null }>
  categories: Array<{ id: string; name: string }>

  // Filter setters
  setSearchTerm: (value: string) => void
  setFilterStatus: (value: string) => void
  setFilterFlagged: (value: string) => void
  setFilterMajorCategory: (value: string) => void
  setFilterCategory: (value: string) => void
  setFilterTags: (value: string[]) => void
  setFilterDateFrom: (value: Date | null) => void
  setFilterDateTo: (value: Date | null) => void
  setFilterOrigin: (value: string) => void
  setFilterBank: (value: string) => void
  setSortField: (value: 'date' | 'amount' | 'description' | 'origin' | 'bank') => void
  setSortDirection: (value: 'asc' | 'desc') => void
  setShowAdvancedFilters: (value: boolean) => void

  // Actions
  clearAllFilters: () => void
  onAddTransaction: () => void
  onImport: () => void
  onExport: () => void

  // State
  language: 'pt' | 'en'
  token: string
  loading: boolean
  pageSize: number
  setPageSize: (value: number) => void
}

export function TransactionFilters({
  // Filter state
  searchTerm,
  filterStatus,
  filterFlagged,
  filterMajorCategory,
  filterCategory,
  filterTags,
  filterDateFrom,
  filterDateTo,
  filterOrigin,
  filterBank,
  sortField,
  sortDirection,
  showAdvancedFilters,
  hasActiveFilters,

  // Computed values
  transactionCount,
  uniqueOrigins,
  uniqueBanks,
  majorCategories,
  categories,

  // Filter setters
  setSearchTerm,
  setFilterStatus,
  setFilterFlagged,
  setFilterMajorCategory,
  setFilterCategory,
  setFilterTags,
  setFilterDateFrom,
  setFilterDateTo,
  setFilterOrigin,
  setFilterBank,
  setSortField,
  setSortDirection,
  setShowAdvancedFilters,

  // Actions
  clearAllFilters,
  onAddTransaction,
  onImport,
  onExport,

  // State
  language,
  token,
  loading,
  pageSize,
  setPageSize,
}: TransactionFiltersProps) {
  const filteredCategories = categories

  // Count active filters for badge
  const activeFilterCount = [
    filterStatus !== 'all',
    filterFlagged !== 'all',
    filterMajorCategory !== 'all',
    filterCategory !== 'all',
    filterTags.length > 0,
    filterDateFrom !== null,
    filterDateTo !== null,
    filterOrigin !== 'all',
    filterBank !== 'all',
  ].filter(Boolean).length

  return (
    <div className="space-y-3">
      {/* Compact Toolbar: Search + Filter Toggle + Actions */}
      <div className="flex items-center gap-2">
        {/* Search Bar */}
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 transition-colors group-focus-within:text-indigo-500" />
          <input
            type="text"
            placeholder={language === 'en' ? 'Search transactions...' : 'Procurar transações...'}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
            showAdvancedFilters || activeFilterCount > 0
              ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <SlidersHorizontal size={15} />
          <span className="hidden lg:inline">{language === 'en' ? 'Filters' : 'Filtros'}</span>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-indigo-600 text-white rounded-full">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            size={14}
            className={`transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />

        {/* Action Buttons — Primary (Add) + Ghost (Import, Export) */}
        <button
          onClick={onAddTransaction}
          className="flex items-center gap-1.5 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
          disabled={loading}
          title={language === 'en' ? 'Add transaction' : 'Adicionar transação'}
        >
          <Plus size={15} />
          <span className="hidden xl:inline">{language === 'en' ? 'Add' : 'Adicionar'}</span>
        </button>

        <button
          onClick={onImport}
          className="flex items-center gap-1.5 px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl text-sm font-medium transition-colors"
          disabled={loading}
          title={language === 'en' ? 'Import transactions' : 'Importar transações'}
        >
          <Upload size={15} />
          <span className="hidden xl:inline">{language === 'en' ? 'Import' : 'Importar'}</span>
        </button>

        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl text-sm font-medium transition-colors"
          title={language === 'en' ? 'Export transactions' : 'Exportar transações'}
        >
          <Download size={15} />
          <span className="hidden xl:inline">{language === 'en' ? 'Export' : 'Exportar'}</span>
        </button>

        {/* Transaction Count Badge */}
        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 tabular-nums">
            {transactionCount}
          </span>
        </div>
      </div>

      {/* Collapsible Filters Panel */}
      {showAdvancedFilters && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 animate-slide-down">
          {/* Primary Filters Row */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <Select
              value={filterStatus}
              onChange={val => setFilterStatus(val)}
              options={[
                { value: 'all', label: language === 'en' ? 'All Status' : 'Todos Estados' },
                { value: 'pending', label: language === 'en' ? 'Pending' : 'Pendente' },
                { value: 'categorized', label: language === 'en' ? 'Categorized' : 'Categorizado' },
              ]}
              placeholder={language === 'en' ? 'Status' : 'Estado'}
            />

            <DateInput
              value={filterDateFrom}
              onChange={setFilterDateFrom}
              placeholder={language === 'en' ? 'From' : 'Início'}
              className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />

            <DateInput
              value={filterDateTo}
              onChange={setFilterDateTo}
              placeholder={language === 'en' ? 'To' : 'Fim'}
              className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />

            <Select
              value={sortField}
              onChange={val => setSortField(val as any)}
              options={[
                { value: 'date', label: language === 'en' ? 'Sort: Date' : 'Ordenar: Data' },
                {
                  value: 'amount',
                  label: language === 'en' ? 'Sort: Amount' : 'Ordenar: Montante',
                },
                {
                  value: 'description',
                  label: language === 'en' ? 'Sort: Description' : 'Ordenar: Descrição',
                },
                { value: 'origin', label: language === 'en' ? 'Sort: Origin' : 'Ordenar: Origem' },
                { value: 'bank', label: language === 'en' ? 'Sort: Bank' : 'Ordenar: Banco' },
              ]}
              placeholder={language === 'en' ? 'Sort by' : 'Ordenar por'}
            />

            <Select
              value={sortDirection}
              onChange={val => setSortDirection(val as any)}
              options={[
                { value: 'desc', label: language === 'en' ? 'Descending' : 'Descendente' },
                { value: 'asc', label: language === 'en' ? 'Ascending' : 'Ascendente' },
              ]}
              placeholder={language === 'en' ? 'Order' : 'Ordem'}
            />

            <Select
              value={pageSize.toString()}
              onChange={val => setPageSize(parseInt(val))}
              options={[
                { value: '20', label: language === 'en' ? '20 rows' : '20 linhas' },
                { value: '50', label: language === 'en' ? '50 rows' : '50 linhas' },
                { value: '100', label: language === 'en' ? '100 rows' : '100 linhas' },
              ]}
              placeholder={language === 'en' ? 'Page Size' : 'Linhas'}
            />
          </div>

          {/* Secondary Filters Row */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mt-3">
            <Select
              value={filterOrigin}
              onChange={val => setFilterOrigin(val)}
              options={[
                { value: 'all', label: language === 'en' ? 'All Origins' : 'Todas Origens' },
                ...uniqueOrigins
                  .sort((a, b) => a.localeCompare(b))
                  .map(o => ({ value: o, label: o })),
              ]}
              placeholder={language === 'en' ? 'Origin' : 'Origem'}
            />

            <Select
              value={filterBank}
              onChange={val => setFilterBank(val)}
              options={[
                { value: 'all', label: language === 'en' ? 'All Banks' : 'Todos Bancos' },
                ...uniqueBanks
                  .sort((a, b) => a.localeCompare(b))
                  .map(b => ({ value: b, label: b })),
              ]}
              placeholder={language === 'en' ? 'Bank' : 'Banco'}
            />

            <Select
              value={filterFlagged}
              onChange={val => setFilterFlagged(val)}
              options={[
                { value: 'all', label: language === 'en' ? 'All Flags' : 'Todas Bandeiras' },
                { value: 'flagged', label: language === 'en' ? 'Flagged' : 'Com Bandeira' },
                { value: 'unflagged', label: language === 'en' ? 'Not Flagged' : 'Sem Bandeira' },
              ]}
              placeholder={language === 'en' ? 'Flags' : 'Bandeiras'}
            />

            <Select
              value={filterMajorCategory}
              onChange={val => {
                setFilterMajorCategory(val)
                setFilterCategory('all')
              }}
              options={[
                {
                  value: 'all',
                  label: language === 'en' ? 'All Major Categories' : 'Todas Categorias Principais',
                },
                ...majorCategories
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(major => ({ value: major.name, label: major.name })),
              ]}
              placeholder={language === 'en' ? 'Major Category' : 'Categoria Principal'}
            />

            <Select
              value={filterCategory}
              onChange={val => setFilterCategory(val)}
              options={[
                { value: 'all', label: language === 'en' ? 'All Categories' : 'Todas Categorias' },
                ...filteredCategories
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(cat => ({ value: cat.name, label: cat.name })),
              ]}
              placeholder={language === 'en' ? 'Category' : 'Categoria'}
            />
          </div>

          {/* Tags + Clear */}
          <div className="mt-3 flex items-start gap-3">
            <div className="flex-1">
              <TagSelector
                selectedTags={filterTags}
                onChange={setFilterTags}
                token={token}
                language={language}
                disabled={loading}
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors whitespace-nowrap"
              >
                <Trash2 size={14} />
                {language === 'en' ? 'Clear all' : 'Limpar tudo'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
