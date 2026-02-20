/**
 * RulesFeature Component
 *
 * Auto-categorization rules management with CRUD operations.
 * Migrated to TanStack Query (Issue #36).
 */

'use client'

import { useState, useMemo } from 'react'
import { Plus, Trash2, Zap, AlertCircle } from 'lucide-react'
import { useRules, useCreateRule, useDeleteRule, useApplyRulesToPending } from '@/lib/queries'
import { MAJOR_CATEGORIES } from '@/lib/categories'
import { useUndoAction } from '@/app/features/shared/hooks'
import { UndoToast } from '@/app/features/shared/components/UndoToast'

interface RulesFeatureProps {
  token?: string // Not used - auth comes from Zustand store
  isAuthenticated?: boolean // Not used - auth comes from Zustand store
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

interface NewRuleForm {
  keyword: string
  majorCategory: string
  category: string
  subCategory: string
}

export function RulesFeature({ onSuccess, onError }: RulesFeatureProps) {
  // Query hooks
  const { data: rules = [], isLoading: rulesLoading } = useRules()
  const createRuleMutation = useCreateRule()
  const deleteRuleMutation = useDeleteRule()
  const applyRulesMutation = useApplyRulesToPending()

  // Undo action for delete operations
  const undoAction = useUndoAction()
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())

  // Local state for new rule form
  const [newRule, setNewRule] = useState<NewRuleForm>({
    keyword: '',
    majorCategory: '',
    category: '',
    subCategory: '',
  })

  // Filter out hidden (pending delete) rules for optimistic UI
  const visibleRules = useMemo(() => rules.filter(r => !hiddenIds.has(r.id)), [rules, hiddenIds])

  // Compute combined loading state
  const loading =
    rulesLoading ||
    createRuleMutation.isPending ||
    deleteRuleMutation.isPending ||
    applyRulesMutation.isPending

  // Get categories for selected major category
  const availableCategories = newRule.majorCategory
    ? MAJOR_CATEGORIES.find(c => c.name === newRule.majorCategory)?.subcategories || []
    : []

  // Get emoji for major category
  const getMajorCategoryEmoji = (categoryName: string) => {
    return MAJOR_CATEGORIES.find(c => c.name === categoryName)?.emoji || ''
  }

  // Handle add rule
  const handleAddRule = () => {
    if (!newRule.keyword || !newRule.majorCategory || !newRule.category) {
      onError?.('Please fill keyword, major category and category')
      return
    }

    createRuleMutation.mutate(
      {
        keyword: newRule.keyword,
        majorCategory: newRule.majorCategory,
        category: newRule.category,
        tags: newRule.subCategory ? [newRule.subCategory] : [],
      },
      {
        onSuccess: () => {
          setNewRule({ keyword: '', majorCategory: '', category: '', subCategory: '' })
          onSuccess?.('Rule added successfully')
        },
        onError: error => {
          onError?.(error.message || 'Failed to add rule')
        },
      }
    )
  }

  // Handle delete with undo toast
  const handleDelete = (id: string, keyword: string) => {
    // Optimistic UI: hide the rule immediately
    setHiddenIds(prev => new Set(prev).add(id))

    undoAction.trigger({
      message: `Rule "${keyword}" deleted`,
      onExecute: async () => {
        try {
          await deleteRuleMutation.mutateAsync(id)
          onSuccess?.('Rule deleted successfully')
        } catch (err) {
          setHiddenIds(prev => {
            const next = new Set(prev)
            next.delete(id)
            return next
          })
          onError?.(err instanceof Error ? err.message : 'Failed to delete rule')
        }
      },
      onUndo: () => {
        setHiddenIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      },
      onError: err => {
        setHiddenIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        onError?.(err.message)
      },
    })
  }

  // Handle apply rules
  const handleApplyRules = () => {
    const confirmed = window.confirm(
      'Apply all rules to pending transactions? This will auto-categorize uncategorized transactions based on your rules.'
    )
    if (confirmed) {
      applyRulesMutation.mutate(undefined, {
        onSuccess: data => {
          onSuccess?.(`Successfully categorized ${data.categorized || 0} transaction(s)`)
        },
        onError: error => {
          onError?.(error.message || 'Failed to apply rules')
        },
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Apply Rules Button */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-3xl shadow-lg p-6 border border-white/60 dark:border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-indigo-950 dark:text-white flex items-center gap-2">
              <Zap className="text-indigo-600 dark:text-indigo-400" size={28} />
              Auto-Categorization Rules
            </h2>
            <p className="text-indigo-700 dark:text-indigo-300 mt-1">
              Create keyword-based rules to automatically categorize transactions
            </p>
          </div>
          <button
            onClick={handleApplyRules}
            disabled={loading || visibleRules.length === 0}
            className="bg-success text-white px-6 py-3 rounded-2xl hover:bg-success/90 hover:shadow-xl hover:shadow-success/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-300 hover:scale-105 font-semibold"
          >
            <Zap size={18} />
            Apply Rules to Pending
          </button>
        </div>
      </div>

      {/* Add Rule Form */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl shadow-lg p-6 border border-white/50 dark:border-white/10">
        <h3 className="text-lg font-semibold text-indigo-950 dark:text-white mb-4 flex items-center gap-2">
          <Plus size={20} className="text-indigo-600 dark:text-indigo-400" />
          Add Categorization Rule
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Keyword Input */}
          <input
            type="text"
            placeholder="Keyword (e.g., continente)"
            value={newRule.keyword}
            onChange={e => setNewRule(prev => ({ ...prev, keyword: e.target.value }))}
            onKeyPress={e => {
              if (
                e.key === 'Enter' &&
                newRule.keyword &&
                newRule.majorCategory &&
                newRule.category
              ) {
                handleAddRule()
              }
            }}
            className="px-3 py-2 border-2 border-white/80 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-800 text-indigo-950 dark:text-white placeholder:text-indigo-400 dark:placeholder:text-slate-500"
          />

          {/* Major Category Select */}
          <select
            value={newRule.majorCategory}
            onChange={e =>
              setNewRule(prev => ({
                ...prev,
                majorCategory: e.target.value,
                category: '',
                subCategory: '',
              }))
            }
            className="px-3 py-2 border-2 border-white/80 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-800 text-indigo-950 dark:text-white"
          >
            <option value="">Major Category</option>
            {MAJOR_CATEGORIES.map(cat => (
              <option key={cat.name} value={cat.name}>
                {cat.emoji} {cat.name}
              </option>
            ))}
          </select>

          {/* Category Select */}
          <select
            value={newRule.category}
            onChange={e =>
              setNewRule(prev => ({
                ...prev,
                category: e.target.value,
                subCategory: '',
              }))
            }
            className="px-3 py-2 border-2 border-white/80 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-800 text-indigo-950 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!newRule.majorCategory}
          >
            <option value="">Category</option>
            {availableCategories.map(sub => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          {/* Sub-Category Input (Optional) */}
          <input
            type="text"
            placeholder="Sub-category (optional)"
            value={newRule.subCategory}
            onChange={e => setNewRule(prev => ({ ...prev, subCategory: e.target.value }))}
            onKeyPress={e => {
              if (
                e.key === 'Enter' &&
                newRule.keyword &&
                newRule.majorCategory &&
                newRule.category
              ) {
                handleAddRule()
              }
            }}
            className="px-3 py-2 border-2 border-white/80 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-800 text-indigo-950 dark:text-white placeholder:text-indigo-400 dark:placeholder:text-slate-500"
          />

          {/* Add Button */}
          <button
            onClick={handleAddRule}
            disabled={loading || !newRule.keyword || !newRule.majorCategory || !newRule.category}
            className="bg-primary text-white px-4 py-2 min-h-[44px] rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus size={18} />
            <span>Add</span>
          </button>
        </div>

        {/* Helper Text */}
        <div className="mt-3 flex items-start gap-2 text-sm text-indigo-600 dark:text-indigo-400">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <p>
            Rules match keywords in transaction descriptions (case-insensitive). For example,
            "continente" will match "CONTINENTE", "Continente Faro", etc.
          </p>
        </div>
      </div>

      {/* Rules List */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl shadow-lg overflow-visible border border-white/50 dark:border-white/10">
        <div className="px-6 py-4 border-b border-white/50 dark:border-white/10">
          <h3 className="text-lg font-semibold text-indigo-950 dark:text-white flex items-center gap-2">
            Current Rules
            <span className="text-sm font-normal bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 px-3 py-1 rounded-full">
              {visibleRules.length}
            </span>
          </h3>
        </div>

        {visibleRules.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/50 dark:divide-white/10">
              <thead className="bg-white/50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300">
                    Keyword
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300">
                    Major Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300">
                    Sub-Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 dark:bg-transparent divide-y divide-white/50 dark:divide-white/10">
                {visibleRules.map(rule => (
                  <tr
                    key={rule.id}
                    className="hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-950 dark:text-white">
                      {rule.keyword}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-900 dark:text-indigo-200">
                      {getMajorCategoryEmoji(rule.majorCategory)} {rule.majorCategory}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-900 dark:text-indigo-200">
                      {rule.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-900/70 dark:text-slate-300">
                      {rule.tags && rule.tags.length > 0 ? rule.tags.join(', ') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          rule.isDefault
                            ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300'
                            : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300'
                        }`}
                      >
                        {rule.isDefault ? 'Default' : 'Custom'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!rule.isDefault && (
                        <button
                          onClick={() => handleDelete(rule.id, rule.keyword)}
                          disabled={loading}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50"
                          title="Delete rule"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      {rule.isDefault && (
                        <span className="text-gray-400 dark:text-gray-600 text-xs">System</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Zap className="w-16 h-16 text-indigo-300 dark:text-slate-600 mx-auto mb-4" />
            <div className="text-indigo-400 dark:text-slate-400 text-lg mb-2">
              No rules configured yet
            </div>
            <div className="text-indigo-500 dark:text-slate-500 text-sm">
              Add your first rule above to start auto-categorizing transactions
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl p-4 border border-blue-200/50 dark:border-blue-800/30">
        <div className="flex gap-3">
          <AlertCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0" size={20} />
          <div className="text-sm text-blue-900 dark:text-blue-300">
            <p className="font-semibold mb-1">How Rules Work:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Rules are applied automatically when importing new transactions</li>
              <li>Keywords are matched case-insensitively in transaction descriptions</li>
              <li>System (default) rules cannot be deleted, only custom rules</li>
              <li>
                Click "Apply Rules to Pending" to categorize existing uncategorized transactions
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Undo Toast for delete operations */}
      {undoAction.state.isPending && undoAction.state.message && (
        <UndoToast
          message={undoAction.state.message}
          timeRemaining={undoAction.state.timeRemaining}
          totalDelay={undoAction.state.totalDelay}
          onUndo={undoAction.undo}
        />
      )}
    </div>
  )
}
