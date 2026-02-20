/**
 * Tests for UndoToast Component (Issue #219)
 *
 * Verifies the undo toast UI:
 * - Renders message and undo button
 * - Progress bar width corresponds to timeRemaining/totalDelay
 * - Undo button calls onUndo
 * - Keyboard accessible (can focus undo button)
 * - Correct ARIA attributes
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UndoToast } from './UndoToast'

describe('UndoToast', () => {
  const defaultProps = {
    message: 'Transaction deleted',
    timeRemaining: 3000,
    totalDelay: 5000,
    onUndo: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the message text', () => {
      render(<UndoToast {...defaultProps} />)

      expect(screen.getByText('Transaction deleted')).toBeInTheDocument()
    })

    it('should render the undo button', () => {
      render(<UndoToast {...defaultProps} />)

      expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument()
    })

    it('should render with role="alert" for screen readers', () => {
      render(<UndoToast {...defaultProps} />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should render the progress bar', () => {
      render(<UndoToast {...defaultProps} />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('Progress Bar', () => {
    it('should show 60% progress when 3000ms of 5000ms remain', () => {
      render(<UndoToast {...defaultProps} timeRemaining={3000} totalDelay={5000} />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveStyle({ width: '60%' })
    })

    it('should show 100% progress at the start', () => {
      render(<UndoToast {...defaultProps} timeRemaining={5000} totalDelay={5000} />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveStyle({ width: '100%' })
    })

    it('should show 0% progress when time is up', () => {
      render(<UndoToast {...defaultProps} timeRemaining={0} totalDelay={5000} />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveStyle({ width: '0%' })
    })

    it('should handle zero totalDelay gracefully', () => {
      render(<UndoToast {...defaultProps} timeRemaining={0} totalDelay={0} />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveStyle({ width: '0%' })
    })

    it('should have correct aria attributes on progress bar', () => {
      render(<UndoToast {...defaultProps} timeRemaining={3000} totalDelay={5000} />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '60')
      expect(progressBar).toHaveAttribute('aria-valuemin', '0')
      expect(progressBar).toHaveAttribute('aria-valuemax', '100')
      expect(progressBar).toHaveAttribute('aria-label', 'Time remaining to undo')
    })
  })

  describe('Undo Button', () => {
    it('should call onUndo when clicked', async () => {
      const onUndo = vi.fn()
      const user = userEvent.setup()

      render(<UndoToast {...defaultProps} onUndo={onUndo} />)

      await user.click(screen.getByRole('button', { name: /undo/i }))

      expect(onUndo).toHaveBeenCalledTimes(1)
    })

    it('should have minimum 44px touch target', () => {
      render(<UndoToast {...defaultProps} />)

      const button = screen.getByRole('button', { name: /undo/i })
      expect(button.className).toContain('min-w-[44px]')
      expect(button.className).toContain('min-h-[44px]')
    })

    it('should be focusable for keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<UndoToast {...defaultProps} />)

      await user.tab()

      expect(screen.getByRole('button', { name: /undo/i })).toHaveFocus()
    })

    it('should have aria-label for accessibility', () => {
      render(<UndoToast {...defaultProps} />)

      expect(screen.getByRole('button', { name: /undo/i })).toHaveAttribute(
        'aria-label',
        'Undo action'
      )
    })
  })

  describe('Styling', () => {
    it('should have fixed positioning', () => {
      render(<UndoToast {...defaultProps} />)

      const container = screen.getByRole('alert')
      expect(container.className).toContain('fixed')
      expect(container.className).toContain('bottom-4')
      expect(container.className).toContain('right-4')
    })

    it('should have z-index 50', () => {
      render(<UndoToast {...defaultProps} />)

      const container = screen.getByRole('alert')
      expect(container.className).toContain('z-50')
    })

    it('should have slide-in animation', () => {
      render(<UndoToast {...defaultProps} />)

      const container = screen.getByRole('alert')
      expect(container.className).toContain('animate-in')
      expect(container.className).toContain('slide-in-from-bottom-5')
      expect(container.className).toContain('fade-in')
    })

    it('should have dark background for visibility', () => {
      render(<UndoToast {...defaultProps} />)

      const toast = screen.getByRole('alert').firstChild as HTMLElement
      expect(toast.className).toContain('bg-gray-900')
    })
  })
})
