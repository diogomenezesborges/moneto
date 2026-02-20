'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, Check } from 'lucide-react'
import { iconMap, iconCategories, type LucideIcon } from '@/lib/icons'

interface IconPickerProps {
  value: string
  onChange: (iconName: string) => void
  label?: string
  className?: string
  disabled?: boolean
}

export function IconPicker({
  value,
  onChange,
  label,
  className = '',
  disabled = false,
}: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Get the selected icon component
  const SelectedIcon = iconMap[value]

  // Filter icons based on search and category
  const getFilteredIcons = (): string[] => {
    let icons: string[] = []

    if (activeCategory === 'all') {
      icons = Object.keys(iconMap)
    } else {
      icons = iconCategories[activeCategory as keyof typeof iconCategories] || []
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      icons = icons.filter(name => name.toLowerCase().includes(search))
    }

    return icons
  }

  const filteredIcons = getFilteredIcons()

  return (
    <div
      className={`relative ${className}`}
      ref={containerRef}
      style={{ zIndex: isOpen ? 9999 : 1 }}
    >
      {label && (
        <label className="block text-[11px] font-bold text-primary uppercase tracking-wider mb-2">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full bg-white dark:bg-slate-800 backdrop-blur-md border-2 border-white/80 dark:border-slate-700 rounded-2xl px-4 py-3
          flex items-center justify-between shadow-sm transition-all cursor-pointer group
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg focus-within:shadow-lg hover:border-primary'}
          ${isOpen ? 'shadow-lg border-primary' : ''}
        `}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
            {SelectedIcon ? (
              <SelectedIcon size={18} className="text-primary" />
            ) : (
              <div className="w-4 h-4 rounded bg-gray-300 dark:bg-gray-600" />
            )}
          </div>
          <span className={`font-medium ${value ? 'text-foreground' : 'text-muted-foreground'}`}>
            {value || 'Select icon...'}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`text-muted-foreground transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-800 backdrop-blur-xl border-2 border-white/80 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
          style={{ zIndex: 9999, minWidth: '320px' }}
        >
          {/* Search */}
          <div className="p-3 border-b border-gray-100 dark:border-slate-700">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search icons..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-700 overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeCategory === 'all'
                    ? 'bg-gray-100 dark:bg-gray-800 text-primary border border-gray-200 dark:border-gray-700'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                All
              </button>
              {Object.keys(iconCategories).map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    activeCategory === category
                      ? 'bg-gray-100 dark:bg-gray-800 text-primary border border-gray-200 dark:border-gray-700'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Grid */}
          <div className="p-3 max-h-64 overflow-y-auto custom-scrollbar">
            {filteredIcons.length > 0 ? (
              <div className="grid grid-cols-6 gap-2">
                {filteredIcons.map(iconName => {
                  const IconComponent = iconMap[iconName]
                  const isSelected = value === iconName
                  return (
                    <button
                      key={iconName}
                      onClick={() => {
                        onChange(iconName)
                        setIsOpen(false)
                        setSearchTerm('')
                      }}
                      title={iconName}
                      className={`
                        relative w-10 h-10 rounded-xl flex items-center justify-center transition-all
                        ${
                          isSelected
                            ? 'bg-primary text-white shadow-lg scale-110'
                            : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary hover:scale-105'
                        }
                      `}
                    >
                      {IconComponent && <IconComponent size={18} />}
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <Check size={10} className="text-white" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Search size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No icons found</p>
              </div>
            )}
          </div>

          {/* Selected Icon Name */}
          {value && (
            <div className="px-3 py-2 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Selected: <span className="font-semibold text-primary">{value}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Simple icon display component
interface CategoryIconProps {
  iconName: string
  size?: number
  className?: string
}

export function CategoryIcon({ iconName, size = 18, className = '' }: CategoryIconProps) {
  const IconComponent = iconMap[iconName]

  if (!IconComponent) {
    return (
      <div
        className={`w-${size / 4} h-${size / 4} rounded bg-gray-300 dark:bg-gray-600 ${className}`}
      />
    )
  }

  return <IconComponent size={size} className={className} />
}
