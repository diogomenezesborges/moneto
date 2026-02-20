/**
 * useRules Hook
 *
 * Manages rules state and operations (CRUD)
 */

import { useState, useEffect, useCallback } from 'react'
import { Rule } from '@prisma/client'

interface UseRulesOptions {
  token: string | null
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

interface NewRuleForm {
  keyword: string
  majorCategory: string
  category: string
  subCategory: string
}

export function useRules({ token, onSuccess, onError }: UseRulesOptions) {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(false)
  const [newRule, setNewRule] = useState<NewRuleForm>({
    keyword: '',
    majorCategory: '',
    category: '',
    subCategory: '',
  })

  // Load rules from API
  const loadRules = useCallback(async () => {
    if (!token) return

    try {
      setLoading(true)
      const response = await fetch('/api/rules', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setRules(data)
      } else {
        onError?.('Failed to load rules')
      }
    } catch (error) {
      console.error('Error loading rules:', error)
      onError?.('Error loading rules')
    } finally {
      setLoading(false)
    }
  }, [token, onError])

  // Load rules on mount and when token changes
  useEffect(() => {
    loadRules()
  }, [loadRules])

  // Add new rule
  const addRule = async () => {
    if (!token) {
      onError?.('Authentication required')
      return
    }

    if (!newRule.keyword || !newRule.majorCategory || !newRule.category) {
      onError?.('Please fill keyword, major category and category')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newRule),
      })

      if (response.ok) {
        await loadRules()
        setNewRule({ keyword: '', majorCategory: '', category: '', subCategory: '' })
        onSuccess?.('Rule added successfully')
      } else {
        const error = await response.json()
        onError?.(error.error || 'Failed to add rule')
      }
    } catch (error) {
      console.error('Error adding rule:', error)
      onError?.('Error adding rule')
    } finally {
      setLoading(false)
    }
  }

  // Delete rule
  const deleteRule = async (id: string) => {
    if (!token) {
      onError?.('Authentication required')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/rules', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      })

      if (response.ok) {
        await loadRules()
        onSuccess?.('Rule deleted successfully')
      } else {
        const error = await response.json()
        onError?.(error.error || 'Failed to delete rule')
      }
    } catch (error) {
      console.error('Error deleting rule:', error)
      onError?.('Error deleting rule')
    } finally {
      setLoading(false)
    }
  }

  // Apply rules to pending transactions
  const applyRulesToPending = async () => {
    if (!token) {
      onError?.('Authentication required')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/transactions/auto-categorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      })

      if (response.ok) {
        const data = await response.json()
        onSuccess?.(`Successfully categorized ${data.categorized} transaction(s)`)
      } else {
        const error = await response.json()
        onError?.(error.error || 'Failed to apply rules')
      }
    } catch (error) {
      console.error('Error applying rules:', error)
      onError?.('Error applying rules')
    } finally {
      setLoading(false)
    }
  }

  return {
    rules,
    loading,
    newRule,
    setNewRule,
    addRule,
    deleteRule,
    applyRulesToPending,
    refreshRules: loadRules,
  }
}
