'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { X, Plus, ChevronDown, Search } from 'lucide-react'

/**
 * Safely get CSRF token from localStorage
 * Returns null if token is missing or empty (security hardening)
 */
function getValidCsrfToken(): string | null {
  if (typeof window === 'undefined') return null

  const token = localStorage.getItem('csrf-token')
  // Reject null, undefined, or empty strings
  if (!token || token.trim() === '') {
    return null
  }
  return token
}

interface TagDefinition {
  namespace: string
  value: string
  label: string
  labelEn?: string | null
  color?: string | null
}

interface TagSelectorProps {
  selectedTags: string[]
  onChange: (tags: string[]) => void
  token: string
  language?: 'pt' | 'en'
  placeholder?: string
  className?: string
  disabled?: boolean
}

// Default tag colors by namespace
const NAMESPACE_COLORS: Record<string, string> = {
  vehicle: '#3B82F6',
  trip: '#10B981',
  provider: '#8B5CF6',
  platform: '#F59E0B',
  occasion: '#EF4444',
  recipient: '#EC4899',
  sport: '#06B6D4',
  type: '#6B7280',
  utility: '#0EA5E9',
  service: '#6366F1',
  project: '#A855F7',
  reimbursable: '#14B8A6',
  bank: '#1E3A8A',
  location: '#78716C',
  asset: '#84CC16',
}

export function TagSelector({
  selectedTags,
  onChange,
  token,
  language = 'en',
  placeholder,
  className = '',
  disabled = false,
}: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [tagDefinitions, setTagDefinitions] = useState<TagDefinition[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load tag definitions on mount
  useEffect(() => {
    loadTagDefinitions()
  }, [token])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadTagDefinitions = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/tags', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setTagDefinitions(data.tags || [])
      }
    } catch (error) {
      console.error('Failed to load tag definitions:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTag = async (namespace: string, value: string): Promise<TagDefinition | null> => {
    try {
      setCreating(true)

      const csrfToken = getValidCsrfToken()
      if (!csrfToken) {
        console.error('CSRF token missing - cannot create tag')
        return null
      }

      const label = value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ')

      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          namespace,
          value,
          label,
          labelEn: label,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        // Add to local definitions
        setTagDefinitions(prev => [...prev, data.tag])
        return data.tag
      } else {
        console.error('Failed to create tag:', await res.text())
        return null
      }
    } catch (error) {
      console.error('Error creating tag:', error)
      return null
    } finally {
      setCreating(false)
    }
  }

  // Filter and group tags by namespace
  const filteredTags = useMemo(() => {
    const searchLower = search.toLowerCase()

    return tagDefinitions.filter(tag => {
      // Exclude already selected
      const tagKey = `${tag.namespace}:${tag.value}`
      if (selectedTags.includes(tagKey)) return false

      // Search filter
      if (search) {
        const label = language === 'en' && tag.labelEn ? tag.labelEn : tag.label
        return (
          label.toLowerCase().includes(searchLower) ||
          tag.value.toLowerCase().includes(searchLower) ||
          tag.namespace.toLowerCase().includes(searchLower)
        )
      }

      return true
    })
  }, [tagDefinitions, selectedTags, search, language])

  // Check if we should show "Create tag" option
  const showCreateOption = useMemo(() => {
    if (!search.trim() || creating) return false

    // Parse search input
    const parts = search.includes(':') ? search.split(':') : ['type', search]
    const namespace = parts[0].toLowerCase().trim()
    const value = parts[1]?.toLowerCase().trim() || parts[0].toLowerCase().trim()

    // Check if exact match exists
    const exactMatch = tagDefinitions.find(t => t.namespace === namespace && t.value === value)

    return !exactMatch && value.length >= 2 // Minimum 2 chars to create
  }, [search, tagDefinitions, creating])

  const parseSearchInput = (input: string): { namespace: string; value: string } => {
    if (input.includes(':')) {
      const [namespace, value] = input.split(':').map(s => s.toLowerCase().trim())
      return { namespace: namespace || 'type', value: value || namespace }
    }
    return { namespace: 'type', value: input.toLowerCase().trim() }
  }

  // Group by namespace for display
  const groupedTags = useMemo(() => {
    const groups: Record<string, TagDefinition[]> = {}

    for (const tag of filteredTags) {
      if (!groups[tag.namespace]) {
        groups[tag.namespace] = []
      }
      groups[tag.namespace].push(tag)
    }

    return groups
  }, [filteredTags])

  const handleAddTag = (tag: TagDefinition) => {
    const tagKey = `${tag.namespace}:${tag.value}`
    if (!selectedTags.includes(tagKey)) {
      onChange([...selectedTags, tagKey])
    }
    setSearch('')
    inputRef.current?.focus()
  }

  const handleRemoveTag = (tagKey: string) => {
    onChange(selectedTags.filter(t => t !== tagKey))
  }

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && search === '' && selectedTags.length > 0) {
      // Remove last tag on backspace if search is empty
      onChange(selectedTags.slice(0, -1))
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredTags.length > 0) {
        // Select first filtered tag
        handleAddTag(filteredTags[0])
      } else if (showCreateOption) {
        // Create new tag
        await handleCreateAndAdd()
      }
    }
  }

  const handleCreateAndAdd = async () => {
    const { namespace, value } = parseSearchInput(search)
    const newTag = await createTag(namespace, value)

    if (newTag) {
      const tagKey = `${newTag.namespace}:${newTag.value}`
      onChange([...selectedTags, tagKey])
      setSearch('')
      inputRef.current?.focus()
    }
  }

  const getTagLabel = (tagKey: string): string => {
    const [namespace, value] = tagKey.split(':')
    const def = tagDefinitions.find(t => t.namespace === namespace && t.value === value)
    if (def) {
      return language === 'en' && def.labelEn ? def.labelEn : def.label
    }
    // Fallback
    return value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ')
  }

  const getTagColor = (tagKey: string): string => {
    const [namespace] = tagKey.split(':')
    return NAMESPACE_COLORS[namespace] || '#6B7280'
  }

  const defaultPlaceholder = language === 'en' ? 'Add tags...' : 'Adicionar tags...'

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Selected tags and input */}
      <div
        className={`flex flex-wrap gap-1.5 p-2 border-2 rounded-xl cursor-text min-h-[42px]
          ${disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60' : 'bg-white dark:bg-slate-800'}
          ${isOpen ? 'border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-200 dark:border-gray-700'}
          transition-all duration-200`}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true)
            inputRef.current?.focus()
          }
        }}
      >
        {/* Selected tag badges */}
        {selectedTags.map(tagKey => (
          <span
            key={tagKey}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full"
            style={{
              backgroundColor: `${getTagColor(tagKey)}20`,
              color: getTagColor(tagKey),
              border: `1px solid ${getTagColor(tagKey)}40`,
            }}
          >
            {getTagLabel(tagKey)}
            {!disabled && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  handleRemoveTag(tagKey)
                }}
                className="hover:opacity-70 transition-opacity"
              >
                <X size={12} />
              </button>
            )}
          </span>
        ))}

        {/* Search input */}
        {!disabled && (
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selectedTags.length === 0 ? placeholder || defaultPlaceholder : ''}
            className="flex-1 min-w-[80px] text-sm bg-transparent text-gray-900 dark:text-white outline-none placeholder-gray-400 dark:placeholder-gray-500"
          />
        )}

        {!disabled && (
          <ChevronDown
            size={16}
            className={`shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-64 overflow-auto">
          {loading || creating ? (
            <div className="p-3 text-center text-sm text-gray-500">
              {creating
                ? language === 'en'
                  ? 'Creating tag...'
                  : 'A criar tag...'
                : language === 'en'
                  ? 'Loading...'
                  : 'A carregar...'}
            </div>
          ) : (
            <>
              {/* Create new tag option */}
              {showCreateOption && (
                <button
                  type="button"
                  onClick={handleCreateAndAdd}
                  className="w-full px-3 py-2 text-left text-sm bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 flex items-center gap-2 transition-colors border-b border-indigo-200 dark:border-indigo-800"
                >
                  <Plus size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="text-indigo-700 dark:text-indigo-300 font-medium">
                    {language === 'en' ? 'Create tag: ' : 'Criar tag: '}
                    <span className="font-semibold">
                      {(() => {
                        const { namespace, value } = parseSearchInput(search)
                        return `${namespace}:${value}`
                      })()}
                    </span>
                  </span>
                </button>
              )}

              {/* Existing tags */}
              {Object.keys(groupedTags).length === 0 && !showCreateOption ? (
                <div className="p-3 text-center text-sm text-gray-500">
                  {search
                    ? language === 'en'
                      ? 'No tags found'
                      : 'Nenhuma tag encontrada'
                    : language === 'en'
                      ? 'No more tags available'
                      : 'Sem mais tags disponíveis'}
                </div>
              ) : (
                Object.entries(groupedTags).map(([namespace, tags]) => (
                  <div key={namespace}>
                    {/* Namespace header */}
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 uppercase tracking-wider">
                      {namespace}
                    </div>

                    {/* Tags in namespace */}
                    {tags.map(tag => {
                      const tagKey = `${tag.namespace}:${tag.value}`
                      const label = language === 'en' && tag.labelEn ? tag.labelEn : tag.label
                      const color = tag.color || NAMESPACE_COLORS[tag.namespace] || '#6B7280'

                      return (
                        <button
                          key={tagKey}
                          type="button"
                          onClick={() => handleAddTag(tag)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-gray-900 dark:text-white">{label}</span>
                          <span className="text-gray-400 text-xs ml-auto">{tag.value}</span>
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// Simple inline tag adder for quick adding
export function QuickTagAdd({
  onAdd,
  language = 'en',
  className = '',
}: {
  onAdd: (tag: string) => void
  language?: 'pt' | 'en'
  className?: string
}) {
  const [value, setValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) {
      // Auto-format: if no colon, add "type:" prefix
      const tag = value.includes(':') ? value.trim() : `type:${value.trim()}`
      onAdd(tag.toLowerCase())
      setValue('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={language === 'en' ? 'namespace:value' : 'namespace:valor'}
        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
      >
        <Plus size={14} />
        {language === 'en' ? 'Add' : 'Adicionar'}
      </button>
    </form>
  )
}
