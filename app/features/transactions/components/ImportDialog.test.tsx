/**
 * Tests for Bug #7: Race Condition in File Import
 *
 * Verifies that concurrent import attempts are properly prevented
 * and file cleanup happens immediately to avoid duplicate imports.
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImportDialog } from './ImportDialog'

describe('Bug #7: Import Race Condition Prevention', () => {
  const mockOnClose = vi.fn()
  const mockOnImport = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const renderDialog = (onImport = mockOnImport) => {
    return render(
      <ImportDialog isOpen={true} language="pt" onClose={mockOnClose} onImport={onImport} />
    )
  }

  it('should prevent concurrent import attempts', async () => {
    const user = userEvent.setup({ delay: null })

    // Mock slow import that takes 100ms
    const slowImport = vi
      .fn()
      .mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve({ success: true, imported: 5, duplicates: 0 }), 100)
          )
      )

    renderDialog(slowImport)

    // Select file and origin
    const file = new File(['test'], 'test.csv', { type: 'text/csv' })
    const fileInput = screen.getByLabelText(/Selecionar arquivo/i)
    await user.upload(fileInput, file)

    const originInput = screen.getByLabelText(/Origem/i)
    await user.type(originInput, 'Personal')

    // Click import button
    const importButton = screen.getByRole('button', { name: /^Importar$/i })
    await user.click(importButton)

    // Try to click again immediately (race condition attempt)
    await user.click(importButton)
    await user.click(importButton)
    await user.click(importButton)

    // Wait for import to complete
    await waitFor(() => expect(slowImport).toHaveBeenCalledTimes(1))

    // Only ONE import should have been triggered despite 4 clicks
    expect(slowImport).toHaveBeenCalledTimes(1)
  })

  it('should clear form immediately when import starts', async () => {
    const user = userEvent.setup({ delay: null })

    mockOnImport.mockResolvedValue({ success: true, imported: 5, duplicates: 0 })

    renderDialog()

    // Select file and origin
    const file = new File(['test'], 'test.csv', { type: 'text/csv' })
    const fileInput = screen.getByLabelText(/Selecionar arquivo/i)
    await user.upload(fileInput, file)

    const originInput = screen.getByLabelText(/Origem/i)
    await user.type(originInput, 'Personal')

    // Verify file name is shown
    expect(screen.getByText('test.csv')).toBeInTheDocument()

    // Click import
    const importButton = screen.getByRole('button', { name: /^Importar$/i })
    await user.click(importButton)

    // File input should be cleared IMMEDIATELY (not after 3 seconds)
    await waitFor(() => {
      const input = screen.getByLabelText(/Selecionar arquivo/i) as HTMLInputElement
      expect(input.value).toBe('')
    })

    // Origin input should also be cleared immediately
    await waitFor(() => {
      const input = screen.getByLabelText(/Origem/i) as HTMLInputElement
      expect(input.value).toBe('')
    })
  })

  it('should restore form state on import error', async () => {
    const user = userEvent.setup({ delay: null })

    // Mock import exception (not just failed response, but actual exception)
    // This triggers the catch block which restores state
    mockOnImport.mockRejectedValue(new Error('File format invalid'))

    renderDialog()

    // Select file and origin
    const file = new File(['test'], 'test.csv', { type: 'text/csv' })
    const fileInput = screen.getByLabelText(/Selecionar arquivo/i)
    await user.upload(fileInput, file)

    const originInput = screen.getByLabelText(/Origem/i)
    await user.type(originInput, 'Personal')

    // Click import
    const importButton = screen.getByRole('button', { name: /^Importar$/i })
    await user.click(importButton)

    // Wait for error message (from catch block)
    await waitFor(() => {
      expect(screen.getByText(/Import failed unexpectedly/i)).toBeInTheDocument()
    })

    // Origin should be restored so user can retry
    await waitFor(() => {
      const input = screen.getByLabelText(/Origem/i) as HTMLInputElement
      expect(input.value).toBe('Personal')
    })
  })

  it('should auto-close dialog after successful import', async () => {
    const user = userEvent.setup({ delay: null })

    mockOnImport.mockResolvedValue({ success: true, imported: 10, duplicates: 2 })

    renderDialog()

    // Select file and origin
    const file = new File(['test'], 'test.csv', { type: 'text/csv' })
    const fileInput = screen.getByLabelText(/Selecionar arquivo/i)
    await user.upload(fileInput, file)

    const originInput = screen.getByLabelText(/Origem/i)
    await user.type(originInput, 'Personal')

    // Click import
    const importButton = screen.getByRole('button', { name: /^Importar$/i })
    await user.click(importButton)

    // Wait for success message - matches actual format: "Importado(s) 10 transacao(oes)"
    await waitFor(() => {
      expect(screen.getByText(/Importado\(s\) 10/i)).toBeInTheDocument()
    })

    // Dialog should close after 3 seconds
    await waitFor(
      () => {
        expect(mockOnClose).toHaveBeenCalled()
      },
      { timeout: 4000 }
    )
  })

  it('should block import button while import is in progress', async () => {
    const user = userEvent.setup({ delay: null })

    // Mock import that takes 100ms
    const slowImport = vi
      .fn()
      .mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve({ success: true, imported: 5, duplicates: 0 }), 100)
          )
      )

    renderDialog(slowImport)

    // Select file and origin
    const file = new File(['test'], 'test.csv', { type: 'text/csv' })
    const fileInput = screen.getByLabelText(/Selecionar arquivo/i)
    await user.upload(fileInput, file)

    const originInput = screen.getByLabelText(/Origem/i)
    await user.type(originInput, 'Personal')

    // Click import
    const importButton = screen.getByRole('button', { name: /^Importar$/i })
    await user.click(importButton)

    // Button should be disabled during import
    await waitFor(() => {
      expect(importButton).toBeDisabled()
    })

    // Wait for import to complete
    await waitFor(() => {
      expect(slowImport).toHaveBeenCalledTimes(1)
    })
  })

  it('should handle network errors gracefully', async () => {
    const user = userEvent.setup({ delay: null })

    // Mock network error (exception thrown)
    mockOnImport.mockRejectedValue(new Error('Network timeout'))

    renderDialog()

    // Select file and origin
    const file = new File(['test'], 'test.csv', { type: 'text/csv' })
    const fileInput = screen.getByLabelText(/Selecionar arquivo/i)
    await user.upload(fileInput, file)

    const originInput = screen.getByLabelText(/Origem/i)
    await user.type(originInput, 'Personal')

    // Click import
    const importButton = screen.getByRole('button', { name: /^Importar$/i })
    await user.click(importButton)

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Import failed unexpectedly/i)).toBeInTheDocument()
    })

    // Form state should be restored
    const input = screen.getByLabelText(/Origem/i) as HTMLInputElement
    expect(input.value).toBe('Personal')
  })

  it('should prevent duplicate imports by disabling button', async () => {
    const user = userEvent.setup({ delay: null })

    // Mock slow import
    const slowImport = vi
      .fn()
      .mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve({ success: true, imported: 5, duplicates: 0 }), 1000)
          )
      )

    renderDialog(slowImport)

    // Select file and origin
    const file = new File(['test'], 'test.csv', { type: 'text/csv' })
    const fileInput = screen.getByLabelText(/Selecionar arquivo/i)
    await user.upload(fileInput, file)

    const originInput = screen.getByLabelText(/Origem/i)
    await user.type(originInput, 'Personal')

    const importButton = screen.getByRole('button', { name: /^Importar$/i })
    await user.click(importButton)

    // Button should be disabled immediately to prevent duplicate clicks
    await waitFor(() => {
      expect(importButton).toBeDisabled()
    })

    // Verify button shows "Importing..." state
    expect(screen.getByText(/Importando/i)).toBeInTheDocument()

    // Only one import should be triggered
    await waitFor(() => expect(slowImport).toHaveBeenCalledTimes(1))
  })

  it('should handle rapid sequential imports correctly', async () => {
    const user = userEvent.setup({ delay: null })

    // Mock imports - first succeeds, second should not happen in same dialog
    // because Import button is hidden after success
    mockOnImport
      .mockResolvedValueOnce({ success: true, imported: 5, duplicates: 0 })
      .mockResolvedValueOnce({ success: true, imported: 3, duplicates: 0 })

    renderDialog()

    // First import
    const file1 = new File(['test1'], 'test1.csv', { type: 'text/csv' })
    const fileInput = screen.getByLabelText(/Selecionar arquivo/i)
    await user.upload(fileInput, file1)

    const originInput = screen.getByLabelText(/Origem/i)
    await user.type(originInput, 'Personal')

    const importButton = screen.getByRole('button', { name: /^Importar$/i })
    await user.click(importButton)

    // Wait for first import to complete
    await waitFor(() => {
      expect(mockOnImport).toHaveBeenCalledTimes(1)
    })

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/Importado\(s\) 5/i)).toBeInTheDocument()
    })

    // After successful import, Import button is hidden (only Close button visible)
    // This is correct UI behavior - user must close dialog before importing again
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /^Importar$/i })).not.toBeInTheDocument()
    })

    // Verify Close button(s) are visible (header X button + footer Close button)
    const closeButtons = screen.getAllByRole('button', { name: /Fechar|Close/i })
    expect(closeButtons.length).toBeGreaterThanOrEqual(1)
  })
})
