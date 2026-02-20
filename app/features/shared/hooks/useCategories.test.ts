/**
 * Tests for useCategories Hook
 *
 * Ensures category taxonomy fetching and management works correctly.
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useCategories, type MajorCategory } from './useCategories'

describe('useCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  const mockTaxonomy: MajorCategory[] = [
    {
      id: '1',
      name: 'Alimentação',
      nameEn: 'Food',
      emoji: '🍔',
      slug: 'alimentacao',
      budgetCategory: 'ESSENTIALS',
      categories: [
        {
          id: 'cat1',
          name: 'Supermercado',
          nameEn: 'Supermarket',
          slug: 'supermercado',
          icon: '🛒',
        },
        {
          id: 'cat2',
          name: 'Restaurantes',
          nameEn: 'Restaurants',
          slug: 'restaurantes',
          icon: '🍽️',
        },
      ],
    },
    {
      id: '2',
      name: 'Transporte',
      nameEn: 'Transport',
      emoji: '🚗',
      slug: 'transporte',
      budgetCategory: 'TRANSPORT',
      categories: [
        {
          id: 'cat3',
          name: 'Combustível',
          nameEn: 'Fuel',
          slug: 'combustivel',
          icon: '⛽',
        },
      ],
    },
  ]

  it('should initialize with default state when not authenticated', () => {
    const { result } = renderHook(() => useCategories({ token: '', isAuthenticated: false }))

    expect(result.current.taxonomy).toEqual([])
    expect(result.current.majorCategories).toEqual([])
    expect(result.current.allCategories).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('should fetch taxonomy when authenticated', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ taxonomy: mockTaxonomy }),
    })

    const { result } = renderHook(() =>
      useCategories({ token: 'test-token', isAuthenticated: true })
    )

    // Initially loading
    expect(result.current.loading).toBe(true)

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.taxonomy).toEqual(mockTaxonomy)
    expect(result.current.error).toBe(null)

    expect(global.fetch).toHaveBeenCalledWith('/api/categories/manage', {
      headers: { Authorization: 'Bearer test-token' },
    })
  })

  it('should extract major categories correctly', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ taxonomy: mockTaxonomy }),
    })

    const { result } = renderHook(() =>
      useCategories({ token: 'test-token', isAuthenticated: true })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.majorCategories).toEqual([
      {
        id: '1',
        name: 'Alimentação',
        nameEn: 'Food',
        emoji: '🍔',
        slug: 'alimentacao',
      },
      {
        id: '2',
        name: 'Transporte',
        nameEn: 'Transport',
        emoji: '🚗',
        slug: 'transporte',
      },
    ])
  })

  it('should flatten all categories correctly', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ taxonomy: mockTaxonomy }),
    })

    const { result } = renderHook(() =>
      useCategories({ token: 'test-token', isAuthenticated: true })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.allCategories).toHaveLength(3)
    expect(result.current.allCategories[0]).toMatchObject({
      id: 'cat1',
      name: 'Supermercado',
      slug: 'supermercado',
      majorCategoryId: '1',
      majorCategoryName: 'Alimentação',
    })
    expect(result.current.allCategories[1]).toMatchObject({
      id: 'cat2',
      name: 'Restaurantes',
      slug: 'restaurantes',
      majorCategoryId: '1',
      majorCategoryName: 'Alimentação',
    })
    expect(result.current.allCategories[2]).toMatchObject({
      id: 'cat3',
      name: 'Combustível',
      slug: 'combustivel',
      majorCategoryId: '2',
      majorCategoryName: 'Transporte',
    })
  })

  it('should get categories for specific major category', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ taxonomy: mockTaxonomy }),
    })

    const { result } = renderHook(() =>
      useCategories({ token: 'test-token', isAuthenticated: true })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const categories = result.current.getCategoriesForMajor('1')
    expect(categories).toHaveLength(2)
    expect(categories[0].name).toBe('Supermercado')
    expect(categories[1].name).toBe('Restaurantes')
  })

  it('should return empty array for non-existent major category', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ taxonomy: mockTaxonomy }),
    })

    const { result } = renderHook(() =>
      useCategories({ token: 'test-token', isAuthenticated: true })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const categories = result.current.getCategoriesForMajor('non-existent')
    expect(categories).toEqual([])
  })

  it('should handle fetch error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    const { result } = renderHook(() =>
      useCategories({ token: 'test-token', isAuthenticated: true })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('HTTP error! status: 500')
    expect(result.current.taxonomy).toEqual([])
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load taxonomy:', expect.any(Error))

    consoleErrorSpy.mockRestore()
  })

  it('should handle network error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() =>
      useCategories({ token: 'test-token', isAuthenticated: true })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
    expect(result.current.taxonomy).toEqual([])

    consoleErrorSpy.mockRestore()
  })

  it('should handle missing taxonomy in response', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    })

    const { result } = renderHook(() =>
      useCategories({ token: 'test-token', isAuthenticated: true })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.taxonomy).toEqual([])
    expect(result.current.error).toBe(null)
  })

  it('should not refetch when token changes but authenticated is false', async () => {
    const { rerender } = renderHook(
      ({ token, isAuthenticated }) => useCategories({ token, isAuthenticated }),
      {
        initialProps: { token: 'token1', isAuthenticated: false },
      }
    )

    expect(global.fetch).not.toHaveBeenCalled()

    rerender({ token: 'token2', isAuthenticated: false })

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should refetch when token changes and authenticated is true', async () => {
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ taxonomy: mockTaxonomy }),
    })

    const { result, rerender } = renderHook(
      ({ token, isAuthenticated }) => useCategories({ token, isAuthenticated }),
      {
        initialProps: { token: 'token1', isAuthenticated: true },
      }
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(global.fetch).toHaveBeenCalledTimes(1)

    // Change token
    rerender({ token: 'token2', isAuthenticated: true })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    expect(global.fetch).toHaveBeenLastCalledWith('/api/categories/manage', {
      headers: { Authorization: 'Bearer token2' },
    })
  })
})
