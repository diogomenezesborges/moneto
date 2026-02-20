/**
 * Category Queries Tests
 *
 * Tests for category taxonomy query hooks.
 */

import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { useCategories, categoryKeys } from './categories'
import { useAuthStore } from '@/lib/stores/authStore'
import { createWrapper } from './test-utils'

// Mock authStore
vi.mock('@/lib/stores/authStore', () => ({
  useAuthStore: vi.fn(),
  getAuthHeaders: vi.fn(() => ({
    Authorization: 'Bearer mock-token',
    'Content-Type': 'application/json',
  })),
}))

// Mock fetch
global.fetch = vi.fn()

describe('Category Queries', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    vi.clearAllMocks()
    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      token: 'mock-token',
    })
  })

  describe('categoryKeys', () => {
    it('should generate correct query keys', () => {
      expect(categoryKeys.all).toEqual(['categories'])
      expect(categoryKeys.taxonomy()).toEqual(['categories', 'taxonomy'])
    })
  })

  describe('useCategories', () => {
    it('should fetch categories successfully', async () => {
      const mockTaxonomy = {
        taxonomy: [
          {
            id: '1',
            name: 'Alimentação',
            nameEn: 'Food',
            emoji: '🍔',
            slug: 'alimentacao',
            budgetCategory: 'Variable',
            categories: [
              { id: '1-1', name: 'Restaurantes', slug: 'restaurantes' },
              { id: '1-2', name: 'Supermercado', slug: 'supermercado' },
            ],
          },
          {
            id: '2',
            name: 'Transporte',
            nameEn: 'Transport',
            emoji: '🚗',
            slug: 'transporte',
            budgetCategory: 'Variable',
            categories: [{ id: '2-1', name: 'Combustível', slug: 'combustivel' }],
          },
        ],
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTaxonomy,
      })

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.taxonomy).toEqual(mockTaxonomy.taxonomy)
      expect(global.fetch).toHaveBeenCalledWith('/api/categories/manage', {
        headers: {
          Authorization: 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
      })
    })

    it('should compute majorCategories correctly', async () => {
      const mockTaxonomy = {
        taxonomy: [
          {
            id: '1',
            name: 'Alimentação',
            nameEn: 'Food',
            emoji: '🍔',
            slug: 'alimentacao',
            categories: [{ id: '1-1', name: 'Restaurantes', slug: 'restaurantes' }],
          },
        ],
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTaxonomy,
      })

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.majorCategories).toEqual([
        {
          id: '1',
          name: 'Alimentação',
          nameEn: 'Food',
          emoji: '🍔',
          slug: 'alimentacao',
        },
      ])
    })

    it('should compute allCategories with major category references', async () => {
      const mockTaxonomy = {
        taxonomy: [
          {
            id: '1',
            name: 'Alimentação',
            slug: 'alimentacao',
            categories: [
              { id: '1-1', name: 'Restaurantes', slug: 'restaurantes' },
              { id: '1-2', name: 'Supermercado', slug: 'supermercado' },
            ],
          },
        ],
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTaxonomy,
      })

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.allCategories).toEqual([
        {
          id: '1-1',
          name: 'Restaurantes',
          slug: 'restaurantes',
          majorCategoryId: '1',
          majorCategoryName: 'Alimentação',
        },
        {
          id: '1-2',
          name: 'Supermercado',
          slug: 'supermercado',
          majorCategoryId: '1',
          majorCategoryName: 'Alimentação',
        },
      ])
    })

    it('should get categories for specific major category', async () => {
      const mockTaxonomy = {
        taxonomy: [
          {
            id: '1',
            name: 'Alimentação',
            slug: 'alimentacao',
            categories: [
              { id: '1-1', name: 'Restaurantes', slug: 'restaurantes' },
              { id: '1-2', name: 'Supermercado', slug: 'supermercado' },
            ],
          },
          {
            id: '2',
            name: 'Transporte',
            slug: 'transporte',
            categories: [{ id: '2-1', name: 'Combustível', slug: 'combustivel' }],
          },
        ],
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTaxonomy,
      })

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const foodCategories = result.current.getCategoriesForMajor('1')
      expect(foodCategories).toEqual([
        { id: '1-1', name: 'Restaurantes', slug: 'restaurantes' },
        { id: '1-2', name: 'Supermercado', slug: 'supermercado' },
      ])

      const transportCategories = result.current.getCategoriesForMajor('2')
      expect(transportCategories).toEqual([{ id: '2-1', name: 'Combustível', slug: 'combustivel' }])
    })

    it('should return empty array for non-existent major category', async () => {
      const mockTaxonomy = {
        taxonomy: [
          {
            id: '1',
            name: 'Alimentação',
            slug: 'alimentacao',
            categories: [],
          },
        ],
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTaxonomy,
      })

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const categories = result.current.getCategoriesForMajor('non-existent')
      expect(categories).toEqual([])
    })

    it('should handle fetch error', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect((result.current.error as Error).message).toBe('Failed to fetch categories')
    })

    it('should not fetch when not authenticated', () => {
      ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: false,
        token: null,
      })

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.isPending).toBe(true)
      expect(result.current.fetchStatus).toBe('idle')
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should not fetch when token is missing', () => {
      ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: true,
        token: null,
      })

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.isPending).toBe(true)
      expect(result.current.fetchStatus).toBe('idle')
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should return empty arrays when no data loaded', () => {
      ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: false,
        token: null,
      })

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.taxonomy).toEqual([])
      expect(result.current.majorCategories).toEqual([])
      expect(result.current.allCategories).toEqual([])
    })
  })
})
