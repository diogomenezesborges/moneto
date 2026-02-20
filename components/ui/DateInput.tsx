'use client'

import { useState, useEffect, useRef } from 'react'

interface DateInputProps {
  value: Date | string | null | undefined
  onChange: (date: Date | null) => void
  className?: string
  disabled?: boolean
  placeholder?: string
  required?: boolean
}

/**
 * Formats a Date to DD/MM/YYYY string
 */
function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Custom date input that always uses DD/MM/YYYY format
 * regardless of browser locale settings.
 *
 * Allows free-form text editing - only validates and syncs on blur.
 */
export function DateInput({
  value,
  onChange,
  className = '',
  disabled = false,
  placeholder = 'DD/MM/YYYY',
  required = false,
}: DateInputProps) {
  const [displayValue, setDisplayValue] = useState('')
  const [error, setError] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const lastPropValue = useRef<number | null>(null)

  // Convert Date to DD/MM/YYYY string - only when not editing
  useEffect(() => {
    // Don't overwrite while user is editing
    if (isFocused) return

    if (!value) {
      if (lastPropValue.current !== null) {
        setDisplayValue('')
        lastPropValue.current = null
      }
      return
    }

    const date = value instanceof Date ? value : new Date(value)
    if (isNaN(date.getTime())) {
      if (lastPropValue.current !== null) {
        setDisplayValue('')
        lastPropValue.current = null
      }
      return
    }

    // Only update if prop actually changed (avoid re-renders resetting input)
    const timestamp = date.getTime()
    if (timestamp !== lastPropValue.current) {
      lastPropValue.current = timestamp
      setDisplayValue(formatDate(date))
    }
  }, [value, isFocused])

  /**
   * Parses DD/MM/YYYY string and returns Date or null with error message
   */
  const parseDate = (input: string): { date: Date | null; error: string } => {
    if (!input.trim()) {
      return { date: null, error: '' }
    }

    // Parse DD/MM/YYYY format
    const match = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (!match) {
      return { date: null, error: 'Use DD/MM/YYYY format' }
    }

    const day = parseInt(match[1], 10)
    const month = parseInt(match[2], 10)
    const year = parseInt(match[3], 10)

    // Validate ranges
    if (month < 1 || month > 12) {
      return { date: null, error: 'Invalid month (1-12)' }
    }

    if (day < 1 || day > 31) {
      return { date: null, error: 'Invalid day (1-31)' }
    }

    // Create date (month is 0-indexed in JavaScript Date)
    const date = new Date(year, month - 1, day)

    // Verify the date is valid (handles month/day combinations like Feb 30)
    if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
      return { date: null, error: 'Invalid date' }
    }

    return { date, error: '' }
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setDisplayValue(input)

    // Show validation feedback while typing, but don't call onChange
    // This lets users see errors without interrupting their typing
    const { error: parseError } = parseDate(input)
    setError(parseError)
  }

  const commitValue = () => {
    const trimmed = displayValue.trim()

    // If empty, clear the date
    if (!trimmed) {
      setError('')
      onChange(null)
      return
    }

    // Parse and validate
    const { date, error: parseError } = parseDate(trimmed)

    if (parseError) {
      setError(parseError)
      return
    }

    if (date) {
      // Format nicely and update
      const formatted = formatDate(date)
      setDisplayValue(formatted)
      setError('')
      lastPropValue.current = date.getTime()
      onChange(date)
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
    commitValue()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitValue()
      // Blur the input to indicate completion
      ;(e.target as HTMLInputElement).blur()
    }
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={className}
        disabled={disabled}
        placeholder={placeholder}
        required={required}
        maxLength={10}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
