/**
 * UI Store (Zustand)
 *
 * Client-side state for UI preferences and navigation.
 * Does NOT include server data - use TanStack Query for that.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TabId = 'transactions' | 'stats' | 'cashflow' | 'rules' | 'review' | 'settings'
export type Language = 'pt' | 'en'

export interface FilterState {
  period: string | null
  dateFrom: string | null
  dateTo: string | null
  origin: string
  bank: string
  majorCategory: string
  category: string
  search: string
}

interface UIState {
  // Navigation
  activeTab: TabId
  setActiveTab: (tab: TabId) => void

  // Mobile menu
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void

  // Language (persisted)
  language: Language
  setLanguage: (lang: Language) => void
  toggleLanguage: () => void

  // Transaction filters
  filters: FilterState
  setFilters: (filters: Partial<FilterState>) => void
  resetFilters: () => void

  // Selection state for bulk operations
  selectedIds: string[]
  setSelectedIds: (ids: string[]) => void
  toggleSelection: (id: string) => void
  clearSelection: () => void
  selectAll: (ids: string[]) => void
}

const DEFAULT_FILTERS: FilterState = {
  period: null,
  dateFrom: null,
  dateTo: null,
  origin: 'all',
  bank: 'all',
  majorCategory: 'all',
  category: 'all',
  search: '',
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Navigation
      activeTab: 'transactions',
      setActiveTab: tab => set({ activeTab: tab }),

      // Mobile menu
      mobileMenuOpen: false,
      setMobileMenuOpen: open => set({ mobileMenuOpen: open }),

      // Language
      language: 'pt',
      setLanguage: lang => set({ language: lang }),
      toggleLanguage: () => set(state => ({ language: state.language === 'pt' ? 'en' : 'pt' })),

      // Filters
      filters: DEFAULT_FILTERS,
      setFilters: filters => set(state => ({ filters: { ...state.filters, ...filters } })),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),

      // Selection
      selectedIds: [],
      setSelectedIds: ids => set({ selectedIds: ids }),
      toggleSelection: id =>
        set(state => ({
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds.filter(i => i !== id)
            : [...state.selectedIds, id],
        })),
      clearSelection: () => set({ selectedIds: [] }),
      selectAll: ids => set({ selectedIds: ids }),
    }),
    {
      name: 'moneto-ui-store',
      // Only persist language preference
      partialize: state => ({ language: state.language }),
    }
  )
)
