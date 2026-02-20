'use client'

import { useState, useEffect } from 'react'
import { Info } from 'lucide-react'
import { Select } from './Select'

interface Bank {
  id: string
  name: string
  slug: string
  logo?: string | null
  color?: string | null
  userId?: string | null
}

interface BankSelectorProps {
  value?: string | null
  onChange: (bankName: string) => void
  token: string
  className?: string
  disabled?: boolean
}

export function BankSelector({
  value,
  onChange,
  token,
  className = '',
  disabled = false,
}: BankSelectorProps) {
  const [banks, setBanks] = useState<Bank[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBanks()
  }, [token])

  const loadBanks = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/banks', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        throw new Error('Failed to load banks')
      }

      const data = await res.json()
      setBanks(data.banks || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load banks')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-11 w-full rounded-xl"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 text-red-500 dark:text-red-400 ${className}`}>
        <Info size={16} />
        <span className="text-xs">{error}</span>
      </div>
    )
  }

  return (
    <Select
      value={value || ''}
      onChange={onChange}
      options={banks.map(bank => ({ value: bank.name, label: bank.name }))}
      placeholder="Select Bank..."
      className={className}
      disabled={disabled}
    />
  )
}
