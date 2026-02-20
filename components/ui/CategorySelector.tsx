'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

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
  slug: string
  emoji?: string | null
  categories: Category[]
}

// Flat search result with full path info
interface SearchResult {
  major: MajorCategory
  category: Category
  fullPath: string
  matchScore: number // Higher = better match
}

interface CategorySelectorProps {
  majorCategoryId?: string | null
  categoryId?: string | null
  onChange: (selection: {
    majorCategoryId: string | null
    categoryId: string | null
    majorCategory: string | null
    category: string | null
  }) => void
  token: string
  className?: string
  disabled?: boolean
  language?: 'pt' | 'en'
  placeholder?: string
}

function getDisplayName(
  item: { name: string; nameEn?: string | null } | null | undefined,
  language: 'pt' | 'en' = 'pt'
): string {
  if (!item) return ''
  if (language === 'en' && item.nameEn) {
    return item.nameEn
  }
  return item.name
}

/**
 * Calculate match score for search ranking
 * Higher score = better match
 */
function calculateMatchScore(searchLower: string, categoryName: string, majorName: string): number {
  const catLower = categoryName.toLowerCase()
  const majLower = majorName.toLowerCase()

  // Exact match on category name = highest score
  if (catLower === searchLower) return 100

  // Category starts with search = very high
  if (catLower.startsWith(searchLower)) return 80

  // Category contains search = high
  if (catLower.includes(searchLower)) return 60

  // Major category starts with search = medium
  if (majLower.startsWith(searchLower)) return 40

  // Major category contains search = low
  if (majLower.includes(searchLower)) return 20

  return 0
}

export function CategorySelector({
  majorCategoryId,
  categoryId,
  onChange,
  token,
  className = '',
  disabled = false,
  language = 'en',
  placeholder,
}: CategorySelectorProps) {
  const [taxonomy, setTaxonomy] = useState<MajorCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Load taxonomy on mount
  useEffect(() => {
    loadTaxonomy()
  }, [token])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadTaxonomy = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/categories', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error('Failed to load categories')

      const data = await res.json()
      setTaxonomy(data.taxonomyWithIds || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  // Find selected category info
  const selectedInfo = useMemo(() => {
    if (!majorCategoryId || !categoryId) return null

    const major = taxonomy.find(m => m.id === majorCategoryId)
    if (!major) return null

    const category = major.categories.find(c => c.id === categoryId)
    if (!category) return null

    return { major, category }
  }, [taxonomy, majorCategoryId, categoryId])

  // Create flat search results when searching
  const searchResults = useMemo((): SearchResult[] => {
    if (!search.trim()) return []

    const searchLower = search.toLowerCase()
    const results: SearchResult[] = []

    for (const major of taxonomy) {
      const majorName = getDisplayName(major, language)
      for (const category of major.categories) {
        const categoryName = getDisplayName(category, language)
        const score = calculateMatchScore(searchLower, categoryName, majorName)

        if (score > 0) {
          results.push({
            major,
            category,
            fullPath: `${majorName} › ${categoryName}`,
            matchScore: score,
          })
        }
      }
    }

    // Sort by match score (highest first), then alphabetically
    return results.sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore
      return a.fullPath.localeCompare(b.fullPath)
    })
  }, [taxonomy, search, language])

  // Filter taxonomy for hierarchical view (when not searching)
  const filteredTaxonomy = useMemo(() => {
    if (search.trim()) return [] // Use searchResults instead when searching
    return taxonomy
  }, [taxonomy, search])

  // Reset highlighted index when search changes
  useEffect(() => {
    setHighlightedIndex(search.trim() ? 0 : -1)
  }, [search])

  // Auto-scroll highlighted item into view
  useEffect(() => {
    if (!isOpen || highlightedIndex < 0) return

    // Wait for React to render the highlighted item
    const timeoutId = setTimeout(() => {
      const highlighted = listRef.current?.querySelector('[data-highlighted="true"]')
      if (highlighted) {
        highlighted.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        })
      }
    }, 50)

    return () => clearTimeout(timeoutId)
  }, [highlightedIndex, isOpen])

  const handleSelect = useCallback(
    (major: MajorCategory, category: Category) => {
      onChange({
        majorCategoryId: major.id,
        categoryId: category.id,
        majorCategory: major.name,
        category: category.name,
      })
      setIsOpen(false)
      setSearch('')
      setHighlightedIndex(-1)
    },
    [onChange]
  )

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange({
      majorCategoryId: null,
      categoryId: null,
      majorCategory: null,
      category: null,
    })
  }

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault()
          setIsOpen(true)
          setTimeout(() => inputRef.current?.focus(), 50)
        }
        return
      }

      const isSearching = search.trim().length > 0
      const maxIndex = isSearching ? searchResults.length - 1 : -1

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          if (isSearching && maxIndex >= 0) {
            setHighlightedIndex(prev => (prev < maxIndex ? prev + 1 : 0))
          }
          break

        case 'ArrowUp':
          e.preventDefault()
          if (isSearching && maxIndex >= 0) {
            setHighlightedIndex(prev => (prev > 0 ? prev - 1 : maxIndex))
          }
          break

        case 'Enter':
          e.preventDefault()
          if (isSearching && highlightedIndex >= 0 && highlightedIndex < searchResults.length) {
            const result = searchResults[highlightedIndex]
            handleSelect(result.major, result.category)
          }
          break

        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          setSearch('')
          setHighlightedIndex(-1)
          break

        case 'Tab':
          setIsOpen(false)
          setSearch('')
          setHighlightedIndex(-1)
          break
      }
    },
    [isOpen, search, searchResults, highlightedIndex, handleSelect]
  )

  const defaultPlaceholder = language === 'en' ? 'Select category...' : 'Selecionar categoria...'

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 h-11 rounded-xl ${className}`} />
    )
  }

  if (error) {
    return <div className={`text-red-500 text-sm p-2 ${className}`}>{error}</div>
  }

  return (
    <div ref={containerRef} className={`relative ${className}`} onKeyDown={handleKeyDown}>
      {/* Selected value / trigger button */}
      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen)
            setTimeout(() => inputRef.current?.focus(), 50)
          }
        }}
        disabled={disabled}
        className={`
          w-full flex items-center gap-2 px-3 py-2.5 text-left
          border-2 rounded-xl transition-all duration-200
          ${
            disabled
              ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60 border-gray-200 dark:border-gray-700'
              : 'bg-white dark:bg-slate-800 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600'
          }
          ${
            isOpen
              ? 'border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-500/20'
              : 'border-gray-200 dark:border-gray-700'
          }
        `}
      >
        {selectedInfo ? (
          <>
            <span className="text-lg">{selectedInfo.major.emoji || '📁'}</span>
            <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white truncate">
              {getDisplayName(selectedInfo.major, language)} ›{' '}
              {getDisplayName(selectedInfo.category, language)}
            </span>
            {!disabled && (
              <div
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleClear(e as any)
                  }
                }}
                className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors cursor-pointer"
              >
                <X size={14} className="text-gray-400" />
              </div>
            )}
          </>
        ) : (
          <>
            <Search size={16} className="text-gray-400" />
            <span className="flex-1 text-sm text-gray-400">
              {placeholder || defaultPlaceholder}
            </span>
          </>
        )}
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={language === 'en' ? 'Search...' : 'Pesquisar...'}
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Category list */}
          <div ref={listRef} className="max-h-64 overflow-y-auto">
            {/* Flat search results when searching */}
            {search.trim() ? (
              searchResults.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  {language === 'en' ? 'No categories found' : 'Nenhuma categoria encontrada'}
                </div>
              ) : (
                <div className="py-1">
                  {searchResults.map((result, index) => {
                    const isSelected = categoryId === result.category.id
                    const isHighlighted = index === highlightedIndex
                    return (
                      <button
                        key={`${result.major.id}-${result.category.id}`}
                        type="button"
                        data-highlighted={isHighlighted}
                        onClick={() => handleSelect(result.major, result.category)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`
                          w-full px-3 py-2.5 text-left text-sm flex items-center gap-2
                          transition-colors
                          ${
                            isHighlighted
                              ? 'bg-indigo-50 dark:bg-indigo-900/30'
                              : isSelected
                                ? 'bg-indigo-50/50 dark:bg-indigo-900/20'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                          }
                          ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-200'}
                        `}
                      >
                        <span className="text-base">{result.major.emoji || '📁'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {getDisplayName(result.category, language)}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                            {getDisplayName(result.major, language)}
                          </div>
                        </div>
                        {isSelected && <span className="text-indigo-500 text-xs">✓</span>}
                      </button>
                    )
                  })}
                </div>
              )
            ) : /* Hierarchical view when not searching */
            filteredTaxonomy.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                {language === 'en' ? 'No categories found' : 'Nenhuma categoria encontrada'}
              </div>
            ) : (
              filteredTaxonomy.map(major => (
                <div key={major.id}>
                  {/* Major category header */}
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 uppercase tracking-wider flex items-center gap-2">
                    <span>{major.emoji || '📁'}</span>
                    <span>{getDisplayName(major, language)}</span>
                  </div>

                  {/* Categories under this major */}
                  {major.categories.map(category => {
                    const isSelected = categoryId === category.id
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleSelect(major, category)}
                        className={`
                            w-full px-3 py-2.5 text-left text-sm flex items-center gap-2
                            transition-colors
                            ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                            }
                          `}
                      >
                        <span className="w-5 text-center opacity-50">{isSelected ? '✓' : ''}</span>
                        <span className="font-medium">{getDisplayName(category, language)}</span>
                        {category.nameEn && language === 'pt' && (
                          <span className="text-xs text-gray-400 ml-auto">{category.nameEn}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
