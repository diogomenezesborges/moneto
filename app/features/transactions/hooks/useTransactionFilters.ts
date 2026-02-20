/**
 * useTransactionFilters Hook
 *
 * Manages transaction filtering, sorting, and pagination state.
 */

import { useState, useMemo, useCallback } from 'react'
import type { TransactionWithUser, FilterState } from '../../shared/types'
import { normalizeBankName, getUniqueBanks } from '@/lib/bank-normalizer'

interface UseTransactionFiltersProps {
  transactions: TransactionWithUser[]
}

export function useTransactionFilters({ transactions }: UseTransactionFiltersProps) {
  // Filter state
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterMajorCategory, setFilterMajorCategory] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterOrigin, setFilterOrigin] = useState('all')
  const [filterBank, setFilterBank] = useState('all')
  const [filterFlagged, setFilterFlagged] = useState('all')
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState<Date | null>(null)
  const [filterDateTo, setFilterDateTo] = useState<Date | null>(null)

  // Sort state
  const [sortField, setSortField] = useState<'date' | 'amount' | 'description' | 'origin' | 'bank'>(
    'date'
  )
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // UI state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filterStatus !== 'all' ||
      filterMajorCategory !== 'all' ||
      filterCategory !== 'all' ||
      filterOrigin !== 'all' ||
      filterBank !== 'all' ||
      filterFlagged !== 'all' ||
      filterTags.length > 0 ||
      searchTerm !== '' ||
      filterDateFrom !== null ||
      filterDateTo !== null
    )
  }, [
    filterStatus,
    filterMajorCategory,
    filterCategory,
    filterOrigin,
    filterBank,
    filterFlagged,
    filterTags,
    searchTerm,
    filterDateFrom,
    filterDateTo,
  ])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilterStatus('all')
    setFilterMajorCategory('all')
    setFilterCategory('all')
    setFilterOrigin('all')
    setFilterBank('all')
    setFilterFlagged('all')
    setFilterTags([])
    setSearchTerm('')
    setFilterDateFrom(null)
    setFilterDateTo(null)
    setCurrentPage(1)
  }, [])

  // Apply filters to transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Status filter
      if (filterStatus !== 'all' && t.status !== filterStatus) return false

      // Major category filter
      if (filterMajorCategory !== 'all') {
        const majorCategoryName = t.majorCategoryRef?.name || t.majorCategory
        if (majorCategoryName !== filterMajorCategory) return false
      }

      // Category filter
      if (filterCategory !== 'all') {
        const categoryName = t.categoryRef?.name || t.category
        if (categoryName !== filterCategory) return false
      }

      // Origin filter
      if (filterOrigin !== 'all' && t.origin !== filterOrigin) return false

      // Bank filter (normalize for comparison to handle case variations)
      if (filterBank !== 'all' && normalizeBankName(t.bank) !== filterBank) return false

      // Flagged filter
      if (filterFlagged === 'flagged' && !t.flagged) return false
      if (filterFlagged === 'unflagged' && t.flagged) return false

      // Tags filter
      if (filterTags.length > 0) {
        const hasAllTags = filterTags.every(tag => t.tags?.includes(tag))
        if (!hasAllTags) return false
      }

      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesDescription = t.rawDescription.toLowerCase().includes(searchLower)
        const matchesNotes = t.notes?.toLowerCase().includes(searchLower)
        const matchesAmount = t.rawAmount.toString().includes(searchTerm)
        if (!matchesDescription && !matchesNotes && !matchesAmount) return false
      }

      // Date range filter
      if (filterDateFrom) {
        const fromDate = new Date(filterDateFrom)
        fromDate.setHours(0, 0, 0, 0) // Start of day
        if (new Date(t.rawDate) < fromDate) return false
      }

      if (filterDateTo) {
        const toDate = new Date(filterDateTo)
        toDate.setHours(23, 59, 59, 999) // End of day
        if (new Date(t.rawDate) > toDate) return false
      }

      return true
    })
  }, [
    transactions,
    filterStatus,
    filterMajorCategory,
    filterCategory,
    filterOrigin,
    filterBank,
    filterFlagged,
    filterTags,
    searchTerm,
    filterDateFrom,
    filterDateTo,
  ])

  // Apply sorting
  const sortedTransactions = useMemo(() => {
    const sorted = [...filteredTransactions]

    sorted.sort((a, b) => {
      let aVal: any
      let bVal: any

      switch (sortField) {
        case 'date':
          aVal = new Date(a.rawDate).getTime()
          bVal = new Date(b.rawDate).getTime()
          break
        case 'amount':
          aVal = Math.abs(a.rawAmount)
          bVal = Math.abs(b.rawAmount)
          break
        case 'description':
          aVal = a.rawDescription.toLowerCase()
          bVal = b.rawDescription.toLowerCase()
          break
        case 'origin':
          aVal = a.origin
          bVal = b.origin
          break
        case 'bank':
          aVal = a.bank
          bVal = b.bank
          break
        default:
          return 0
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [filteredTransactions, sortField, sortDirection])

  // Apply pagination
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return sortedTransactions.slice(startIndex, endIndex)
  }, [sortedTransactions, currentPage, itemsPerPage])

  // Pagination info
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage)
  const hasNextPage = currentPage < totalPages
  const hasPreviousPage = currentPage > 1

  // Get unique values for filter dropdowns
  const uniqueOrigins = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.origin))).sort()
  }, [transactions])

  const uniqueBanks = useMemo(() => {
    return getUniqueBanks(transactions.map(t => t.bank))
  }, [transactions])

  const uniqueMajorCategories = useMemo(() => {
    const categories = transactions
      .map(t => t.majorCategoryRef?.name || t.majorCategory)
      .filter((c): c is string => !!c)
    return Array.from(new Set(categories)).sort()
  }, [transactions])

  return {
    // Filter state
    filterStatus,
    setFilterStatus,
    filterMajorCategory,
    setFilterMajorCategory,
    filterCategory,
    setFilterCategory,
    filterOrigin,
    setFilterOrigin,
    filterBank,
    setFilterBank,
    filterFlagged,
    setFilterFlagged,
    filterTags,
    setFilterTags,
    searchTerm,
    setSearchTerm,
    filterDateFrom,
    setFilterDateFrom,
    filterDateTo,
    setFilterDateTo,

    // Sort state
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,

    // Pagination state
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,

    // UI state
    showAdvancedFilters,
    setShowAdvancedFilters,

    // Computed values
    hasActiveFilters,
    filteredTransactions,
    sortedTransactions,
    paginatedTransactions,
    uniqueOrigins,
    uniqueBanks,
    uniqueMajorCategories,

    // Actions
    clearAllFilters,
  }
}
