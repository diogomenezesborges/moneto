/**
 * Tests for Issue #215: ARIA Attributes in TransactionAddDialog
 *
 * Verifies that TransactionAddDialog has proper accessibility attributes
 * for screen readers, including role, aria-modal, and aria-labelledby.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TransactionAddDialog } from './TransactionAddDialog'

// Mock the UI components
vi.mock('@/components/ui/CategorySelector', () => ({
  CategorySelector: () => <div data-testid="category-selector">Category Selector</div>,
}))

vi.mock('@/components/ui/TagSelector', () => ({
  TagSelector: () => <div data-testid="tag-selector">Tag Selector</div>,
}))

vi.mock('@/components/ui/BankSelector', () => ({
  BankSelector: () => <div data-testid="bank-selector">Bank Selector</div>,
}))

vi.mock('@/components/ui/DateInput', () => ({
  DateInput: () => <input data-testid="date-input" />,
}))

describe('Issue #215: TransactionAddDialog ARIA Attributes', () => {
  const mockOnClose = vi.fn()
  const mockOnSave = vi.fn()
  const mockOnUpdateForm = vi.fn()

  const defaultProps = {
    isOpen: true,
    addForm: {
      rawDate: new Date(),
      rawDescription: '',
      rawAmount: 0,
      origin: '',
      bank: '',
    },
    saving: false,
    validationErrors: [],
    language: 'pt' as const,
    token: 'test-token',
    onClose: mockOnClose,
    onSave: mockOnSave,
    onUpdateForm: mockOnUpdateForm,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have role="dialog" and aria-modal="true"', () => {
    render(<TransactionAddDialog {...defaultProps} />)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('should have aria-labelledby linking to dialog title', () => {
    render(<TransactionAddDialog {...defaultProps} />)

    const dialog = screen.getByRole('dialog')
    const titleId = dialog.getAttribute('aria-labelledby')
    expect(titleId).toBe('add-transaction-dialog-title')

    const title = screen.getByText('Adicionar Nova Transação')
    expect(title).toHaveAttribute('id', 'add-transaction-dialog-title')
  })

  it('should have close button with aria-label in Portuguese', () => {
    render(<TransactionAddDialog {...defaultProps} />)

    const closeButton = screen.getByLabelText('Fechar')
    expect(closeButton).toBeInTheDocument()
    expect(closeButton).toHaveAttribute('aria-label', 'Fechar')
  })

  it('should have close button with aria-label in English', () => {
    render(<TransactionAddDialog {...defaultProps} language="en" />)

    const closeButton = screen.getByLabelText('Close')
    expect(closeButton).toBeInTheDocument()
    expect(closeButton).toHaveAttribute('aria-label', 'Close')
  })

  it('should mark decorative icons as aria-hidden="true"', () => {
    render(<TransactionAddDialog {...defaultProps} />)

    const dialog = screen.getByRole('dialog')
    const icons = dialog.querySelectorAll('svg')

    // At least the Plus icon in the title should be present
    expect(icons.length).toBeGreaterThan(0)

    // Check that at least one icon has aria-hidden
    const hiddenIcons = Array.from(icons).filter(
      icon => icon.getAttribute('aria-hidden') === 'true'
    )
    expect(hiddenIcons.length).toBeGreaterThan(0)
  })

  it('should have validation errors with role="alert" and aria-live="polite"', () => {
    const propsWithErrors = {
      ...defaultProps,
      validationErrors: ['Amount is required', 'Date is required'],
    }

    render(<TransactionAddDialog {...propsWithErrors} />)

    const alertRegion = screen.getByRole('alert')
    expect(alertRegion).toBeInTheDocument()
    expect(alertRegion).toHaveAttribute('aria-live', 'polite')
    expect(alertRegion).toHaveTextContent('Amount is required')
    expect(alertRegion).toHaveTextContent('Date is required')
  })

  it('should not render when isOpen is false', () => {
    render(<TransactionAddDialog {...defaultProps} isOpen={false} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should disable close button when saving', () => {
    render(<TransactionAddDialog {...defaultProps} saving={true} />)

    const closeButton = screen.getByLabelText('Fechar')
    expect(closeButton).toBeDisabled()
  })
})
