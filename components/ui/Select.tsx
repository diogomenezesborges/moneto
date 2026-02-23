'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
  icon?: string | React.ReactNode
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[] | string[]
  placeholder?: string
  label?: string
  className?: string
  disabled?: boolean
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  label,
  className = '',
  disabled = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

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

  const normalizedOptions: SelectOption[] = options.map(opt =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  )

  const selectedOption = normalizedOptions.find(opt => opt.value === value)
  const selectedLabel = selectedOption?.label || ''
  const selectedIcon = selectedOption?.icon

  // Reset highlighted index when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const selectedIndex = normalizedOptions.findIndex(opt => opt.value === value)
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0)
    }
  }, [isOpen, value, normalizedOptions])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else if (highlightedIndex >= 0 && highlightedIndex < normalizedOptions.length) {
          onChange(normalizedOptions[highlightedIndex].value)
          setIsOpen(false)
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        buttonRef.current?.focus()
        break
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setHighlightedIndex(prev => (prev < normalizedOptions.length - 1 ? prev + 1 : 0))
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setHighlightedIndex(prev => (prev > 0 ? prev - 1 : normalizedOptions.length - 1))
        }
        break
      case 'Home':
        e.preventDefault()
        if (isOpen) {
          setHighlightedIndex(0)
        }
        break
      case 'End':
        e.preventDefault()
        if (isOpen) {
          setHighlightedIndex(normalizedOptions.length - 1)
        }
        break
    }
  }

  // Auto-scroll highlighted item into view
  useEffect(() => {
    if (!isOpen || highlightedIndex < 0) return
    const highlighted = listRef.current?.querySelector('[data-highlighted="true"]')
    if (highlighted) {
      highlighted.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [highlightedIndex, isOpen])

  return (
    <div
      className={`relative ${className}`}
      ref={containerRef}
      style={{ zIndex: isOpen ? 9999 : 1 }}
      onKeyDown={handleKeyDown}
    >
      {label && (
        <label
          id={`${label}-label`}
          className="block text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-2"
        >
          {label}
        </label>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={label ? `${label}-label` : undefined}
        className={`
          w-full bg-white dark:bg-slate-800 backdrop-blur-md border-2 border-white/80 dark:border-slate-700 rounded-2xl px-5 py-3.5
          flex items-center justify-between shadow-sm transition-all group
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg focus-within:shadow-lg hover:border-indigo-500 dark:hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50'}
          ${isOpen ? 'shadow-lg border-indigo-500 dark:border-indigo-400' : ''}
        `}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedIcon && <span className="flex-shrink-0">{selectedIcon}</span>}
          <span
            className={`font-medium truncate ${value ? 'text-indigo-950 dark:text-white' : 'text-indigo-900/60 dark:text-white/50'}`}
          >
            {value ? selectedLabel : placeholder}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`
            text-indigo-400 dark:text-white/50 transition-transform duration-200
            ${isOpen ? 'transform rotate-180' : ''}
          `}
        />
      </button>

      {isOpen && (
        <div
          ref={listRef}
          role="listbox"
          aria-labelledby={label ? `${label}-label` : undefined}
          className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-800 backdrop-blur-xl border-2 border-white/80 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-1 animation-slide-down"
          style={{ zIndex: 9999 }}
        >
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {normalizedOptions.map((opt, index) => (
              <div
                key={opt.value}
                role="option"
                aria-selected={value === opt.value}
                data-highlighted={index === highlightedIndex}
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                  buttonRef.current?.focus()
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`
                  px-4 py-2.5 rounded-xl text-sm flex items-center justify-between cursor-pointer transition-colors
                  ${
                    value === opt.value
                      ? 'bg-primary/10 dark:bg-primary/20 text-indigo-700 dark:text-white font-semibold'
                      : index === highlightedIndex
                        ? 'bg-indigo-50 dark:bg-slate-700'
                        : 'text-indigo-900/80 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700'
                  }
                `}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
                  <span className="truncate">{opt.label}</span>
                </div>
                {value === opt.value && (
                  <Check
                    size={14}
                    className="text-indigo-600 dark:text-purple-400 flex-shrink-0 ml-2"
                  />
                )}
              </div>
            ))}
            {normalizedOptions.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center italic">
                No options
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
