import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button Component - Phase 0 Design System', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<Button>Click me</Button>)
      const button = screen.getByRole('button', { name: /click me/i })
      expect(button).toBeInTheDocument()
    })

    it('should render children correctly', () => {
      render(<Button>Save Changes</Button>)
      expect(screen.getByText('Save Changes')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<Button className="custom-class">Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('Variants', () => {
    it('should render primary variant by default', () => {
      render(<Button>Primary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground')
    })

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground')
    })

    it('should render danger variant', () => {
      render(<Button variant="danger">Delete</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-danger', 'text-danger-foreground')
    })

    it('should render success variant', () => {
      render(<Button variant="success">Success</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-success', 'text-success-foreground')
    })

    it('should render warning variant', () => {
      render(<Button variant="warning">Warning</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-warning', 'text-warning-foreground')
    })

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-accent')
    })

    it('should render outline variant', () => {
      render(<Button variant="outline">Outline</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border', 'border-input', 'bg-background')
    })
  })

  describe('Sizes', () => {
    it('should render default size', () => {
      render(<Button>Default</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-4', 'py-2')
    })

    it('should render small size', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm')
    })

    it('should render large size', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-6', 'py-3', 'text-lg')
    })

    it('should render icon size', () => {
      render(<Button size="icon">Icon</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('p-2')
    })
  })

  describe('Loading State', () => {
    it('should show loading spinner when isLoading is true', () => {
      render(<Button isLoading>Loading</Button>)
      const spinner = screen.getByRole('button').querySelector('svg')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('animate-spin')
    })

    it('should disable button when isLoading is true', () => {
      render(<Button isLoading>Loading</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should not show spinner when isLoading is false', () => {
      render(<Button isLoading={false}>Not Loading</Button>)
      const button = screen.getByRole('button')
      const spinner = button.querySelector('svg')
      expect(spinner).not.toBeInTheDocument()
    })
  })

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should apply disabled styles', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:pointer-events-none')
    })

    it('should be disabled when both disabled and isLoading are true', () => {
      render(
        <Button disabled isLoading>
          Disabled & Loading
        </Button>
      )
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })
  })

  describe('Event Handlers', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click me</Button>)

      await user.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should not call onClick when disabled', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      )

      await user.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('should not call onClick when loading', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      render(
        <Button onClick={handleClick} isLoading>
          Loading
        </Button>
      )

      await user.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have button role', () => {
      render(<Button>Accessible</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should support aria-label', () => {
      render(<Button aria-label="Close dialog">X</Button>)
      expect(screen.getByRole('button', { name: /close dialog/i })).toBeInTheDocument()
    })

    it('should support aria-disabled', () => {
      render(<Button aria-disabled="true">Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })

    it('should have focus-visible ring styles', () => {
      render(<Button>Focusable</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2')
    })

    it('should hide loading spinner from screen readers', () => {
      render(<Button isLoading>Loading</Button>)
      const spinner = screen.getByRole('button').querySelector('svg')
      expect(spinner).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('HTML Attributes', () => {
    it('should support type attribute', () => {
      render(<Button type="submit">Submit</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('should support form attribute', () => {
      render(<Button form="my-form">Submit</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('form', 'my-form')
    })

    it('should support data attributes', () => {
      render(<Button data-testid="custom-button">Button</Button>)
      const button = screen.getByTestId('custom-button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('Ref Forwarding', () => {
    it('should forward ref to button element', () => {
      const ref = vi.fn()
      render(<Button ref={ref}>Button</Button>)
      expect(ref).toHaveBeenCalled()
    })
  })

  describe('Design System Compliance', () => {
    it('should not use gradient backgrounds (primary)', () => {
      render(<Button variant="primary">Primary</Button>)
      const button = screen.getByRole('button')
      // Should use solid bg-primary, not gradients
      expect(button.className).not.toMatch(/gradient/)
      expect(button).toHaveClass('bg-primary')
    })

    it('should not use gradient backgrounds (danger)', () => {
      render(<Button variant="danger">Danger</Button>)
      const button = screen.getByRole('button')
      expect(button.className).not.toMatch(/gradient/)
      expect(button).toHaveClass('bg-danger')
    })

    it('should use semantic color tokens', () => {
      render(<Button>Button</Button>)
      const button = screen.getByRole('button')
      // Check for semantic tokens (bg-primary, text-primary-foreground)
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground')
    })

    it('should include hover and focus states', () => {
      render(<Button>Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-primary/90')
      expect(button).toHaveClass('focus-visible:ring-2')
    })

    it('should support dark mode via Tailwind classes', () => {
      // Dark mode is handled by Tailwind's dark: prefix
      // This test verifies the component structure supports it
      render(<Button>Button</Button>)
      const button = screen.getByRole('button')
      // Base classes should work with dark mode (no hardcoded colors)
      expect(button.className).not.toMatch(/#[0-9a-f]{3,6}/i) // No hex colors
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined children', () => {
      render(<Button>{undefined}</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should handle empty string children', () => {
      render(<Button>{''}</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should handle multiple className merging', () => {
      render(<Button className="custom-1 custom-2">Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-1', 'custom-2')
    })

    it('should handle conflicting Tailwind classes (cn utility)', () => {
      // cn utility should resolve conflicts (e.g., px-4 + px-6 = px-6)
      render(<Button className="px-6">Button</Button>)
      const button = screen.getByRole('button')
      // Should have px-6 from className, not px-4 from default
      expect(button.className).toContain('px-6')
    })
  })
})
