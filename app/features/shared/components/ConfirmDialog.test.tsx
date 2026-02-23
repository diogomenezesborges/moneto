/**
 * Tests for ConfirmDialog (refactored to use Dialog primitive)
 *
 * Verifies that ConfirmDialog has proper accessibility attributes,
 * variant styling, and uses the unified Dialog component (Issue #220).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from './ConfirmDialog'

describe('ConfirmDialog', () => {
  const mockOnConfirm = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have role="dialog" and aria-modal="true"', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm Action"
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('should have aria-labelledby linking to dialog title', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete Transaction"
        message="This cannot be undone"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const dialog = screen.getByRole('dialog')
    const titleId = dialog.getAttribute('aria-labelledby')
    expect(titleId).toBeTruthy()

    const title = document.getElementById(titleId!)
    expect(title).toBeInTheDocument()
    expect(title?.textContent).toBe('Delete Transaction')
  })

  it('should have aria-describedby linking to description', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm"
        message="This action is irreversible"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const dialog = screen.getByRole('dialog')
    const descId = dialog.getAttribute('aria-describedby')
    expect(descId).toBeTruthy()

    const desc = document.getElementById(descId!)
    expect(desc?.textContent).toBe('This action is irreversible')
  })

  it('should have close button with aria-label', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm"
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const closeButton = screen.getByLabelText('Close')
    expect(closeButton).toBeInTheDocument()
  })

  it('should call onCancel when close button clicked', async () => {
    const user = userEvent.setup()

    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm"
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    await user.click(screen.getByLabelText('Close'))
    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('should call onConfirm when confirm button clicked', async () => {
    const user = userEvent.setup()

    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete"
        message="Delete this?"
        confirmText="Yes, delete"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    await user.click(screen.getByText('Yes, delete'))
    expect(mockOnConfirm).toHaveBeenCalledTimes(1)
  })

  it('should call onCancel when cancel button clicked', async () => {
    const user = userEvent.setup()

    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm"
        message="Are you sure?"
        cancelText="No, go back"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    await user.click(screen.getByText('No, go back'))
    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('should render with danger variant icons', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Danger"
        message="Warning"
        variant="danger"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const dialog = screen.getByRole('dialog')
    const icon = dialog.querySelector('svg[aria-hidden="true"]')
    expect(icon).toBeInTheDocument()
  })

  it('should render with info variant', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Info"
        message="Information"
        variant="info"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('Info')).toBeInTheDocument()
    expect(screen.getByText('Information')).toBeInTheDocument()
  })

  it('should not render when isOpen is false', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        title="Hidden Dialog"
        message="This should not render"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should use default button text', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Default"
        message="Test"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('Confirm')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })
})
