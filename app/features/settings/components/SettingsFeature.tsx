/**
 * SettingsFeature Component
 *
 * Settings and trash management.
 */

'use client'

import { useState } from 'react'
import { Settings, Tag, Landmark, Trash2, RotateCcw, X } from 'lucide-react'
import {
  useTrashTransactions,
  useRestoreTransaction,
  usePermanentDelete,
} from '@/lib/queries/transactions'
import { CategoryManagement } from './CategoryManagement'

interface SettingsFeatureProps {
  token: string
  isAuthenticated: boolean
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

export function SettingsFeature({
  token,
  isAuthenticated,
  onSuccess,
  onError,
}: SettingsFeatureProps) {
  const [activeSection, setActiveSection] = useState<'overview' | 'categories' | 'trash'>(
    'overview'
  )

  const { data: trashedTransactions = [], isLoading: trashLoading } = useTrashTransactions()
  const restoreMutation = useRestoreTransaction()
  const permanentDeleteMutation = usePermanentDelete()

  const handleRestore = async (id: string) => {
    try {
      await restoreMutation.mutateAsync(id)
      onSuccess?.('Transaction restored successfully')
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to restore transaction')
    }
  }

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('⚠️ Permanently delete this transaction? This cannot be undone!')) {
      return
    }

    try {
      await permanentDeleteMutation.mutateAsync(id)
      onSuccess?.('Transaction permanently deleted')
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to delete transaction')
    }
  }

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex gap-2 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl p-2 border border-white/60 dark:border-white/20">
        <button
          onClick={() => setActiveSection('overview')}
          className={`flex-1 px-4 py-2 min-h-[44px] rounded-xl font-medium transition-all ${
            activeSection === 'overview'
              ? 'bg-indigo-500 text-white'
              : 'text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-700'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Settings
        </button>
        <button
          onClick={() => setActiveSection('categories')}
          className={`flex-1 px-4 py-2 min-h-[44px] rounded-xl font-medium transition-all ${
            activeSection === 'categories'
              ? 'bg-purple-500 text-white'
              : 'text-indigo-700 dark:text-indigo-300 hover:bg-purple-50 dark:hover:bg-slate-700'
          }`}
        >
          <Tag className="w-4 h-4 inline mr-2" />
          Categories
        </button>
        <button
          onClick={() => setActiveSection('trash')}
          className={`flex-1 px-4 py-2 min-h-[44px] rounded-xl font-medium transition-all ${
            activeSection === 'trash'
              ? 'bg-red-500 text-white'
              : 'text-indigo-700 dark:text-indigo-300 hover:bg-red-50 dark:hover:bg-slate-700'
          }`}
        >
          <Trash2 className="w-4 h-4 inline mr-2" />
          Trash ({trashedTransactions.length})
        </button>
      </div>

      {/* Settings Overview Section */}
      {activeSection === 'overview' && (
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-3xl shadow-lg p-8 border border-white/60 dark:border-white/20 text-center">
          <Settings className="w-16 h-16 text-purple-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-indigo-950 dark:text-white mb-2">
            Settings & Configuration
          </h2>
          <p className="text-indigo-700 dark:text-indigo-300 mb-6">
            Manage categories, banks, and system configuration.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setActiveSection('categories')}
              className="bg-purple-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-purple-200 dark:border-purple-900 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all text-left"
            >
              <Tag className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="font-semibold text-indigo-950 dark:text-white mb-2">
                Category Management ✅
              </h3>
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                Create, edit, and organize transaction categories
              </p>
            </button>

            <div className="bg-indigo-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-indigo-200 dark:border-indigo-900 opacity-50">
              <Landmark className="w-8 h-8 text-indigo-600 mb-3" />
              <h3 className="font-semibold text-indigo-950 dark:text-white mb-2">
                Bank Management (Coming Soon)
              </h3>
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                Configure banks and import settings
              </p>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-slate-900/50 rounded-2xl p-6 text-left">
            <h3 className="font-semibold text-indigo-950 dark:text-white mb-3">
              Planned Features:
            </h3>
            <ul className="space-y-2 text-indigo-700 dark:text-indigo-300">
              <li>• ✅ Category management (available now!)</li>
              <li>• Tag definitions and namespaces</li>
              <li>• Bank configuration</li>
              <li>• Import/export settings</li>
              <li>• Icon and emoji selection</li>
            </ul>
          </div>
        </div>
      )}

      {/* Category Management Section */}
      {activeSection === 'categories' && (
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-3xl shadow-lg p-8 border border-white/60 dark:border-white/20">
          <CategoryManagement
            token={token}
            isAuthenticated={isAuthenticated}
            onSuccess={onSuccess}
            onError={onError}
          />
        </div>
      )}

      {/* Trash Section */}
      {activeSection === 'trash' && (
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-3xl shadow-lg p-8 border border-white/60 dark:border-white/20">
          <div className="text-center mb-6">
            <Trash2 className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-indigo-950 dark:text-white mb-2">Trash</h2>
            <p className="text-indigo-700 dark:text-indigo-300">
              Deleted transactions are kept here for 30 days before being permanently removed.
            </p>
          </div>

          {trashLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-indigo-700 dark:text-indigo-300">Loading trash...</p>
            </div>
          ) : trashedTransactions.length === 0 ? (
            <div className="text-center py-12 bg-indigo-50 dark:bg-slate-900/50 rounded-2xl">
              <Trash2 className="w-12 h-12 text-indigo-300 dark:text-indigo-700 mx-auto mb-3" />
              <p className="text-indigo-700 dark:text-indigo-300">Trash is empty</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trashedTransactions.map(transaction => (
                <div
                  key={transaction.id}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-2xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-indigo-950 dark:text-white truncate">
                          {transaction.rawDescription}
                        </p>
                        <span
                          className={`text-sm font-semibold ${
                            transaction.rawAmount < 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          €{Math.abs(transaction.rawAmount).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-indigo-600 dark:text-indigo-400">
                        <span>{new Date(transaction.rawDate).toLocaleDateString('pt-PT')}</span>
                        <span>•</span>
                        <span>{transaction.origin}</span>
                        {transaction.bank && (
                          <>
                            <span>•</span>
                            <span>{transaction.bank}</span>
                          </>
                        )}
                        {transaction.deletedAt && (
                          <>
                            <span>•</span>
                            <span className="text-red-600 dark:text-red-400">
                              Deleted {new Date(transaction.deletedAt).toLocaleDateString('pt-PT')}
                            </span>
                          </>
                        )}
                      </div>
                      {transaction.majorCategoryRef && (
                        <div className="mt-2">
                          <span className="inline-block px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs">
                            {transaction.majorCategoryRef.emoji} {transaction.majorCategoryRef.name}
                            {transaction.categoryRef && ` → ${transaction.categoryRef.name}`}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRestore(transaction.id)}
                        disabled={restoreMutation.isPending}
                        className="px-3 py-2 min-h-[44px] bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        title="Restore transaction"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span className="hidden sm:inline">Restore</span>
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(transaction.id)}
                        disabled={permanentDeleteMutation.isPending}
                        className="px-3 py-2 min-h-[44px] bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        title="Permanently delete"
                      >
                        <X className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
