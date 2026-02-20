import * as React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual style variant
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost' | 'outline'
  /**
   * Button size
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg' | 'icon'
  /**
   * Show loading spinner and disable button
   * @default false
   */
  isLoading?: boolean
  /**
   * Render as child component (for Next.js Link, etc.)
   */
  asChild?: boolean
}

/**
 * Button Component - Phase 0 Design System
 *
 * Semantic color variants with monochromatic design (no gradients).
 * Supports dark mode, accessibility, and loading states.
 *
 * @example
 * ```tsx
 * <Button variant="primary">Save Changes</Button>
 * <Button variant="danger" size="sm">Delete</Button>
 * <Button variant="ghost" isLoading>Processing...</Button>
 * ```
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'default',
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

    const variants = {
      primary:
        'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary shadow-sm hover:shadow-md',
      secondary:
        'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-secondary shadow-sm hover:shadow-md',
      danger:
        'bg-danger text-danger-foreground hover:bg-danger/90 focus-visible:ring-danger shadow-sm hover:shadow-md',
      success:
        'bg-success text-success-foreground hover:bg-success/90 focus-visible:ring-success shadow-sm hover:shadow-md',
      warning:
        'bg-warning text-warning-foreground hover:bg-warning/90 focus-visible:ring-warning shadow-sm hover:shadow-md',
      ghost: 'hover:bg-accent hover:text-accent-foreground focus-visible:ring-accent',
      outline:
        'border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-primary',
    }

    const sizes = {
      sm: 'px-3 py-1.5 min-h-[44px] text-sm rounded-md',
      default: 'px-4 py-2 min-h-[44px]',
      lg: 'px-6 py-3 text-lg rounded-xl',
      icon: 'p-2 min-w-[44px] min-h-[44px] rounded-lg',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
