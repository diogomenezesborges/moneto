import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dialog } from './dialog'

describe('Dialog compound component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render children when isOpen is true', () => {
      render(
        <Dialog isOpen={true} onClose={vi.fn()}>
          <Dialog.Content>
            <Dialog.Title>Test Dialog</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      )

      expect(screen.getByText('Test Dialog')).toBeInTheDocument()
    })

    it('should not render anything when isOpen is false', () => {
      render(
        <Dialog isOpen={false} onClose={vi.fn()}>
          <Dialog.Content>
            <Dialog.Title>Test Dialog</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      )

      expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument()
    })
  })

  describe('ARIA attributes', () => {
    it('should have role="dialog" and aria-modal="true"', () => {
      render(
        <Dialog {...defaultProps}>
          <Dialog.Content>
            <Dialog.Title>Accessible Dialog</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    it('should link title via aria-labelledby', () => {
      render(
        <Dialog {...defaultProps}>
          <Dialog.Content>
            <Dialog.Title>My Title</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      )

      const dialog = screen.getByRole('dialog')
      const titleId = dialog.getAttribute('aria-labelledby')
      expect(titleId).toBeTruthy()

      const titleElement = document.getElementById(titleId!)
      expect(titleElement).toBeInTheDocument()
      expect(titleElement?.textContent).toBe('My Title')
    })

    it('should link description via aria-describedby', () => {
      render(
        <Dialog {...defaultProps}>
          <Dialog.Content>
            <Dialog.Title>Title</Dialog.Title>
            <Dialog.Description>Some description text</Dialog.Description>
          </Dialog.Content>
        </Dialog>
      )

      const dialog = screen.getByRole('dialog')
      const descriptionId = dialog.getAttribute('aria-describedby')
      expect(descriptionId).toBeTruthy()

      const descElement = document.getElementById(descriptionId!)
      expect(descElement).toBeInTheDocument()
      expect(descElement?.textContent).toBe('Some description text')
    })
  })

  describe('size variants', () => {
    it('should apply max-w-sm for size sm', () => {
      render(
        <Dialog {...defaultProps}>
          <Dialog.Content size="sm">
            <Dialog.Title>Small</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog.className).toContain('max-w-sm')
    })

    it('should apply max-w-md for size md (default)', () => {
      render(
        <Dialog {...defaultProps}>
          <Dialog.Content>
            <Dialog.Title>Medium</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog.className).toContain('max-w-md')
    })

    it('should apply max-w-lg for size lg', () => {
      render(
        <Dialog {...defaultProps}>
          <Dialog.Content size="lg">
            <Dialog.Title>Large</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog.className).toContain('max-w-lg')
    })

    it('should apply max-w-xl for size xl', () => {
      render(
        <Dialog {...defaultProps}>
          <Dialog.Content size="xl">
            <Dialog.Title>Extra Large</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog.className).toContain('max-w-xl')
    })
  })

  describe('close button', () => {
    it('should render close button with aria-label', () => {
      render(
        <Dialog {...defaultProps}>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Title</Dialog.Title>
              <Dialog.Close />
            </Dialog.Header>
          </Dialog.Content>
        </Dialog>
      )

      const closeButton = screen.getByLabelText('Close')
      expect(closeButton).toBeInTheDocument()
    })

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(
        <Dialog isOpen={true} onClose={onClose}>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Title</Dialog.Title>
              <Dialog.Close />
            </Dialog.Header>
          </Dialog.Content>
        </Dialog>
      )

      await user.click(screen.getByLabelText('Close'))
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should call custom onClick when provided to Dialog.Close', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      const customOnClick = vi.fn()

      render(
        <Dialog isOpen={true} onClose={onClose}>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Title</Dialog.Title>
              <Dialog.Close onClick={customOnClick} />
            </Dialog.Header>
          </Dialog.Content>
        </Dialog>
      )

      await user.click(screen.getByLabelText('Close'))
      expect(customOnClick).toHaveBeenCalledTimes(1)
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('compound components render together', () => {
    it('should render full dialog with all subcomponents', () => {
      render(
        <Dialog {...defaultProps}>
          <Dialog.Overlay />
          <Dialog.Content size="md">
            <Dialog.Header>
              <Dialog.Title>Full Dialog</Dialog.Title>
              <Dialog.Close />
            </Dialog.Header>
            <div className="p-6">
              <Dialog.Description>Dialog body content here</Dialog.Description>
            </div>
            <Dialog.Footer>
              <button type="button">Cancel</button>
              <button type="button">Confirm</button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>
      )

      expect(screen.getByText('Full Dialog')).toBeInTheDocument()
      expect(screen.getByText('Dialog body content here')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Confirm')).toBeInTheDocument()
      expect(screen.getByLabelText('Close')).toBeInTheDocument()
    })
  })

  describe('custom className', () => {
    it('should pass className to Dialog.Content', () => {
      render(
        <Dialog {...defaultProps}>
          <Dialog.Content className="custom-content">
            <Dialog.Title>Title</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog.className).toContain('custom-content')
    })

    it('should pass className to Dialog.Title', () => {
      render(
        <Dialog {...defaultProps}>
          <Dialog.Content>
            <Dialog.Title className="custom-title">Title</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      )

      expect(screen.getByText('Title').className).toContain('custom-title')
    })

    it('should pass className to Dialog.Description', () => {
      render(
        <Dialog {...defaultProps}>
          <Dialog.Content>
            <Dialog.Title>Title</Dialog.Title>
            <Dialog.Description className="custom-desc">Description</Dialog.Description>
          </Dialog.Content>
        </Dialog>
      )

      expect(screen.getByText('Description').className).toContain('custom-desc')
    })
  })

  describe('escape key integration', () => {
    it('should call onClose when Escape key is pressed on dialog', async () => {
      const onClose = vi.fn()

      render(
        <Dialog isOpen={true} onClose={onClose}>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Escape Test</Dialog.Title>
              <Dialog.Close />
            </Dialog.Header>
          </Dialog.Content>
        </Dialog>
      )

      // Fire keydown directly on the dialog element (onKeyDown handler)
      const dialog = screen.getByRole('dialog')
      await userEvent.type(dialog, '{Escape}')
      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('context error', () => {
    it('should throw when subcomponent is used outside Dialog', () => {
      // Suppress console.error for this test since React will log the error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<Dialog.Title>Outside Dialog</Dialog.Title>)
      }).toThrow('Dialog compound components must be used within <Dialog>')

      consoleSpy.mockRestore()
    })
  })
})
