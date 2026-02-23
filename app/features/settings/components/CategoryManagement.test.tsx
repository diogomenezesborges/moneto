/**
 * Tests for Bug #3: Category Management Feature
 *
 * Verifies that the Category Management component works correctly
 * with full CRUD operations.
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoryManagement } from './CategoryManagement'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock the useCategories hook
vi.mock('@/app/features/shared/hooks/useCategories', () => ({
  useCategories: vi.fn(() => ({
    taxonomy: [
      {
        id: 'major_1',
        name: 'Alimentação',
        emoji: '🍽️',
        slug: 'alimentacao',
        categories: [
          {
            id: 'cat_1',
            name: 'Supermercado',
            nameEn: 'Supermarket',
            slug: 'supermercado',
          },
          {
            id: 'cat_custom_test',
            name: 'Custom Category',
            nameEn: 'Custom',
            slug: 'custom',
          },
        ],
      },
    ],
    loading: false,
    error: null,
    getCategoriesForMajor: (id: string) => {
      if (id === 'major_1') {
        return [
          {
            id: 'cat_1',
            name: 'Supermercado',
            nameEn: 'Supermarket',
            slug: 'supermercado',
          },
          {
            id: 'cat_custom_test',
            name: 'Custom Category',
            nameEn: 'Custom',
            slug: 'custom',
          },
        ]
      }
      return []
    },
  })),
}))

// Mock getAuthHeaders
vi.mock('@/lib/stores/authStore', () => ({
  getAuthHeaders: () => ({ Authorization: 'Bearer test-token' }),
}))

describe('Bug #3: Category Management Feature', () => {
  let queryClient: QueryClient
  const mockOnSuccess = vi.fn()
  const mockOnError = vi.fn()

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <CategoryManagement
          token="test-token"
          isAuthenticated={true}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      </QueryClientProvider>
    )
  }

  it('should render category management UI', () => {
    renderComponent()

    expect(screen.getByText('Category Management')).toBeInTheDocument()
    expect(screen.getByText('New Category')).toBeInTheDocument()
  })

  it('should display categories grouped by major category', () => {
    renderComponent()

    expect(screen.getByText('🍽️ Alimentação')).toBeInTheDocument()
    expect(screen.getByText('Supermercado')).toBeInTheDocument()
    expect(screen.getByText('Custom Category')).toBeInTheDocument()
  })

  it('should show create form when clicking New Category', async () => {
    const user = userEvent.setup()
    renderComponent()

    const newCategoryButton = screen.getByText('New Category')
    await user.click(newCategoryButton)

    expect(screen.getByText('Create New Category')).toBeInTheDocument()
    expect(screen.getByText('Major Category *')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g., Supermercado')).toBeInTheDocument()
  })

  it('should validate form data before creating category', async () => {
    const user = userEvent.setup()
    renderComponent()

    // Open create form
    await user.click(screen.getByText('New Category'))

    // Try to create without filling required fields
    const createButton = screen.getByText('Create Category')
    await user.click(createButton)

    // Should show error
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Category name is required')
    })
  })

  it('should create new category with valid data', async () => {
    const user = userEvent.setup()

    // Mock successful create API call
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, category: { id: 'cat_new' } }),
    })

    // Mock window.location.reload
    delete (window as any).location
    ;(window as any).location = { reload: vi.fn() }

    renderComponent()

    // Open create form
    await user.click(screen.getByText('New Category'))

    // Fill form
    const majorCategorySelect = screen.getByRole('combobox')
    await user.selectOptions(majorCategorySelect, 'major_1')

    const nameInput = screen.getByPlaceholderText('e.g., Supermercado')
    await user.type(nameInput, 'Nova Categoria')

    // Submit form
    const createButton = screen.getByText('Create Category')
    await user.click(createButton)

    // Verify API was called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/categories/manage',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Nova Categoria'),
        })
      )
    })

    // Verify success callback
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith('Category created successfully')
    })
  })

  it('should enable edit mode when clicking edit button', async () => {
    const user = userEvent.setup()
    renderComponent()

    // Find and click edit button (first one)
    const editButtons = screen.getAllByTitle('Edit')
    await user.click(editButtons[0])

    // Should show edit inputs
    expect(screen.getByPlaceholderText('Portuguese name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('English name')).toBeInTheDocument()
  })

  it('should save edited category', async () => {
    const user = userEvent.setup()

    // Mock successful update API call
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    // Mock window.location.reload
    delete (window as any).location
    ;(window as any).location = { reload: vi.fn() }

    renderComponent()

    // Enter edit mode
    const editButtons = screen.getAllByTitle('Edit')
    await user.click(editButtons[0])

    // Edit name
    const nameInput = screen.getByPlaceholderText('Portuguese name')
    await user.clear(nameInput)
    await user.type(nameInput, 'Edited Name')

    // Save
    const saveButton = screen.getByTitle('Save')
    await user.click(saveButton)

    // Verify API was called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/categories/manage',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('Edited Name'),
        })
      )
    })
  })

  it('should only show delete button for custom categories', () => {
    renderComponent()

    // cat_custom_test should have delete button
    expect(screen.getByTitle('Delete (custom category only)')).toBeInTheDocument()

    // cat_1 (not custom) should NOT have delete button near "Supermercado"
    const regularCategory = screen.getByText('Supermercado').closest('div')
    const deleteButton = regularCategory?.querySelector('[title="Delete (custom category only)"]')
    expect(deleteButton).toBeNull()
  })

  it('should confirm before deleting category', async () => {
    const user = userEvent.setup()

    // Mock window.confirm
    window.confirm = vi.fn().mockReturnValue(false) // User cancels

    renderComponent()

    // Find delete button for custom category
    const deleteButton = screen.getByTitle('Delete (custom category only)')
    await user.click(deleteButton)

    // Verify confirmation was shown
    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('Delete category "Custom Category"?')
    )

    // Verify API was NOT called (user cancelled)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should delete custom category after confirmation', async () => {
    const user = userEvent.setup()

    // Mock window.confirm - user confirms
    window.confirm = vi.fn().mockReturnValue(true)

    // Mock successful delete API call
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    // Mock window.location.reload
    delete (window as any).location
    ;(window as any).location = { reload: vi.fn() }

    renderComponent()

    // Find and click delete button
    const deleteButton = screen.getByTitle('Delete (custom category only)')
    await user.click(deleteButton)

    // Verify API was called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/categories/manage',
        expect.objectContaining({
          method: 'DELETE',
          body: expect.stringContaining('cat_custom_test'),
        })
      )
    })

    // Verify success callback
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith('Category deleted successfully')
    })
  })

  it('should handle API errors gracefully', async () => {
    const user = userEvent.setup()

    // Mock API error
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    })

    renderComponent()

    // Open create form
    await user.click(screen.getByText('New Category'))

    // Fill form
    const majorCategorySelect = screen.getByRole('combobox')
    await user.selectOptions(majorCategorySelect, 'major_1')

    const nameInput = screen.getByPlaceholderText('e.g., Supermercado')
    await user.type(nameInput, 'Test Category')

    // Submit
    await user.click(screen.getByText('Create Category'))

    // Verify error callback
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Failed to create category')
    })
  })

  it('should show loading state during actions', async () => {
    const user = userEvent.setup()

    // Mock slow API call
    global.fetch = vi.fn().mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ success: true }),
              }),
            100
          )
        )
    )

    renderComponent()

    // Open create form and fill it
    await user.click(screen.getByText('New Category'))
    const majorCategorySelect = screen.getByRole('combobox')
    await user.selectOptions(majorCategorySelect, 'major_1')
    const nameInput = screen.getByPlaceholderText('e.g., Supermercado')
    await user.type(nameInput, 'Test')

    // Submit
    const createButton = screen.getByText('Create Category')
    await user.click(createButton)

    // Should show loading state
    expect(screen.getByText('Creating...')).toBeInTheDocument()

    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByText('Creating...')).not.toBeInTheDocument()
    })
  })
})
