/**
 * CategoryManagement Component
 *
 * UI for managing transaction categories.
 * Allows viewing, creating, editing, and deleting categories.
 */

'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2, Save, X, Tag } from 'lucide-react'
import { useCategories } from '@/app/features/shared/hooks/useCategories'
import type { MajorCategory, Category } from '@/app/features/shared/hooks/useCategories'
import { getAuthHeaders } from '@/lib/stores/authStore'

interface CategoryManagementProps {
  token: string
  isAuthenticated: boolean
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

export function CategoryManagement({
  token,
  isAuthenticated,
  onSuccess,
  onError,
}: CategoryManagementProps) {
  const { taxonomy, loading, error, getCategoriesForMajor } = useCategories({
    token,
    isAuthenticated,
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editNameEn, setEditNameEn] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createMajorCategoryId, setCreateMajorCategoryId] = useState('')
  const [createName, setCreateName] = useState('')
  const [createNameEn, setCreateNameEn] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Start editing a category
  const startEdit = (category: Category) => {
    setEditingId(category.id)
    setEditName(category.name)
    setEditNameEn(category.nameEn || '')
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditNameEn('')
  }

  // Save edited category
  const saveEdit = async (categoryId: string) => {
    if (!editName.trim()) {
      onError?.('Category name is required')
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch('/api/categories/manage', {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'category',
          id: categoryId,
          name: editName,
          nameEn: editNameEn || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update category')
      }

      onSuccess?.('Category updated successfully')
      cancelEdit()
      // Refresh data
      window.location.reload()
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to update category')
    } finally {
      setActionLoading(false)
    }
  }

  // Delete category
  const deleteCategory = async (categoryId: string, categoryName: string) => {
    if (
      !confirm(
        `Delete category "${categoryName}"?\n\nThis will affect all transactions using this category.`
      )
    ) {
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch('/api/categories/manage', {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'category',
          id: categoryId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete category')
      }

      onSuccess?.('Category deleted successfully')
      // Refresh data
      window.location.reload()
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to delete category')
    } finally {
      setActionLoading(false)
    }
  }

  // Create new category
  const createCategory = async () => {
    if (!createName.trim()) {
      onError?.('Category name is required')
      return
    }
    if (!createMajorCategoryId) {
      onError?.('Please select a major category')
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch('/api/categories/manage', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'category',
          majorCategoryId: createMajorCategoryId,
          name: createName,
          nameEn: createNameEn || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create category')
      }

      onSuccess?.('Category created successfully')
      setShowCreateForm(false)
      setCreateName('')
      setCreateNameEn('')
      setCreateMajorCategoryId('')
      // Refresh data
      window.location.reload()
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to create category')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-indigo-700 dark:text-indigo-300">Loading categories...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 text-center">
        <p className="text-red-700 dark:text-red-300">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-indigo-950 dark:text-white">
            Category Management
          </h2>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
        >
          {showCreateForm ? <X size={16} /> : <Plus size={16} />}
          {showCreateForm ? 'Cancel' : 'New Category'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-800">
          <h3 className="font-semibold text-indigo-950 dark:text-white mb-4">
            Create New Category
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-indigo-950 dark:text-white mb-2">
                Major Category *
              </label>
              <select
                value={createMajorCategoryId}
                onChange={e => setCreateMajorCategoryId(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-700 border-2 border-purple-300 dark:border-purple-700 rounded-xl text-indigo-950 dark:text-white"
              >
                <option value="">Select major category...</option>
                {taxonomy.map(major => (
                  <option key={major.id} value={major.id}>
                    {major.emoji} {major.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-indigo-950 dark:text-white mb-2">
                Category Name (Portuguese) *
              </label>
              <input
                type="text"
                value={createName}
                onChange={e => setCreateName(e.target.value)}
                placeholder="e.g., Supermercado"
                className="w-full px-4 py-2 bg-white dark:bg-slate-700 border-2 border-purple-300 dark:border-purple-700 rounded-xl text-indigo-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-indigo-950 dark:text-white mb-2">
                Category Name (English)
              </label>
              <input
                type="text"
                value={createNameEn}
                onChange={e => setCreateNameEn(e.target.value)}
                placeholder="e.g., Supermarket"
                className="w-full px-4 py-2 bg-white dark:bg-slate-700 border-2 border-purple-300 dark:border-purple-700 rounded-xl text-indigo-950 dark:text-white"
              />
            </div>
            <button
              onClick={createCategory}
              disabled={actionLoading}
              className="w-full px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Create Category
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Category List */}
      <div className="space-y-4">
        {taxonomy.map(major => {
          const categories = getCategoriesForMajor(major.id)
          return (
            <div
              key={major.id}
              className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl p-6 border border-white/60 dark:border-white/20"
            >
              <h3 className="text-lg font-bold text-indigo-950 dark:text-white mb-4">
                {major.emoji} {major.name}{' '}
                <span className="text-sm text-indigo-600 dark:text-indigo-400">
                  ({categories.length} categories)
                </span>
              </h3>

              <div className="space-y-2">
                {categories.map(category => (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-slate-900/50 rounded-xl border border-indigo-100 dark:border-slate-700"
                  >
                    {editingId === category.id ? (
                      /* Edit Mode */
                      <>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            placeholder="Portuguese name"
                            className="px-3 py-2 bg-white dark:bg-slate-700 border-2 border-indigo-300 dark:border-indigo-600 rounded-lg text-sm"
                          />
                          <input
                            type="text"
                            value={editNameEn}
                            onChange={e => setEditNameEn(e.target.value)}
                            placeholder="English name"
                            className="px-3 py-2 bg-white dark:bg-slate-700 border-2 border-indigo-300 dark:border-indigo-600 rounded-lg text-sm"
                          />
                        </div>
                        <button
                          onClick={() => saveEdit(category.id)}
                          disabled={actionLoading}
                          className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50"
                          title="Save"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={actionLoading}
                          className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      /* Display Mode */
                      <>
                        <div className="flex-1">
                          <div className="font-medium text-indigo-950 dark:text-white">
                            {category.name}
                          </div>
                          {category.nameEn && (
                            <div className="text-xs text-indigo-600 dark:text-indigo-400">
                              {category.nameEn}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {category.id}
                          </div>
                        </div>
                        <button
                          onClick={() => startEdit(category)}
                          disabled={actionLoading}
                          className="p-2 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors disabled:opacity-50"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        {category.id.startsWith('cat_custom_') && (
                          <button
                            onClick={() => deleteCategory(category.id, category.name)}
                            disabled={actionLoading}
                            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete (custom category only)"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
