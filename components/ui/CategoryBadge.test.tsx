import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoryBadge, CategoryBadgeCompact, CategoryCard } from './CategoryBadge'

describe('CategoryBadge Component - Phase 0 Design System', () => {
  describe('CategoryBadge', () => {
    describe('Rendering', () => {
      it('should render with majorCategory only', () => {
        render(<CategoryBadge majorCategory="Rendimento" />)
        expect(screen.getByText('Rendimento')).toBeInTheDocument()
      })

      it('should render with majorCategory and category', () => {
        render(<CategoryBadge majorCategory="Rendimento" category="Salário" />)
        expect(screen.getByText('Rendimento')).toBeInTheDocument()
        expect(screen.getByText('Salário')).toBeInTheDocument()
      })

      it('should render "Not categorized" when no category provided (en)', () => {
        render(<CategoryBadge language="en" />)
        expect(screen.getByText('Not categorized')).toBeInTheDocument()
      })

      it('should render "Não categorizado" when no category provided (pt)', () => {
        render(<CategoryBadge language="pt" />)
        expect(screen.getByText('Não categorizado')).toBeInTheDocument()
      })

      it('should show icon by default', () => {
        const { container } = render(<CategoryBadge majorCategory="Income" />)
        const icon = container.querySelector('svg')
        expect(icon).toBeInTheDocument()
      })

      it('should hide icon when showIcon=false', () => {
        const { container } = render(<CategoryBadge majorCategory="Income" showIcon={false} />)
        const icon = container.querySelector('svg')
        expect(icon).not.toBeInTheDocument()
      })
    })

    describe('Semantic Color Mapping', () => {
      it('should use success colors for Income (Rendimento)', () => {
        const { container } = render(<CategoryBadge majorCategory="Rendimento" />)
        const badge = container.firstChild as HTMLElement
        expect(badge).toHaveClass('bg-success/10', 'text-success', 'border-success/30')
      })

      it('should use success colors for Income (English)', () => {
        const { container } = render(<CategoryBadge majorCategory="Income" />)
        const badge = container.firstChild as HTMLElement
        expect(badge).toHaveClass('bg-success/10', 'text-success', 'border-success/30')
      })

      it('should use danger colors for Fixed Costs (Custos Fixos)', () => {
        const { container } = render(<CategoryBadge majorCategory="Custos Fixos" />)
        const badge = container.firstChild as HTMLElement
        expect(badge).toHaveClass('bg-danger/10', 'text-danger', 'border-danger/30')
      })

      it('should use danger colors for Variable Costs', () => {
        const { container } = render(<CategoryBadge majorCategory="Variable Costs" />)
        const badge = container.firstChild as HTMLElement
        expect(badge).toHaveClass('bg-danger/10', 'text-danger', 'border-danger/30')
      })

      it('should use warning colors for Guilt-Free Spending', () => {
        const { container } = render(<CategoryBadge majorCategory="Gastos sem Culpa" />)
        const badge = container.firstChild as HTMLElement
        expect(badge).toHaveClass('bg-warning/10', 'text-warning', 'border-warning/30')
      })

      it('should use primary colors for Savings & Investments', () => {
        const { container } = render(<CategoryBadge majorCategory="Savings & Investments" />)
        const badge = container.firstChild as HTMLElement
        expect(badge).toHaveClass('bg-primary/10', 'text-primary', 'border-primary/30')
      })

      it('should use muted colors for Other categories', () => {
        const { container } = render(<CategoryBadge majorCategory="Outros" />)
        const badge = container.firstChild as HTMLElement
        expect(badge).toHaveClass('bg-muted', 'text-muted-foreground', 'border-border')
      })

      it('should use default colors for unknown categories', () => {
        const { container } = render(<CategoryBadge majorCategory="Unknown Category" />)
        const badge = container.firstChild as HTMLElement
        expect(badge).toHaveClass('bg-muted', 'text-muted-foreground', 'border-border')
      })
    })

    describe('Size Variants', () => {
      it('should render small size', () => {
        const { container } = render(<CategoryBadge majorCategory="Income" size="sm" />)
        const badge = container.firstChild as HTMLElement
        expect(badge).toHaveClass('text-xs', 'px-2', 'py-0.5', 'gap-1')
      })

      it('should render default (medium) size', () => {
        const { container } = render(<CategoryBadge majorCategory="Income" size="md" />)
        const badge = container.firstChild as HTMLElement
        expect(badge).toHaveClass('text-sm', 'px-2.5', 'py-1', 'gap-1.5')
      })

      it('should render large size', () => {
        const { container } = render(<CategoryBadge majorCategory="Income" size="lg" />)
        const badge = container.firstChild as HTMLElement
        expect(badge).toHaveClass('text-base', 'px-3', 'py-1.5', 'gap-2')
      })
    })

    describe('Design System Compliance', () => {
      it('should not use gradient backgrounds', () => {
        const { container } = render(<CategoryBadge majorCategory="Income" />)
        const badge = container.firstChild as HTMLElement
        expect(badge.className).not.toMatch(/gradient/)
      })

      it('should use semantic color tokens', () => {
        const { container } = render(<CategoryBadge majorCategory="Income" />)
        const badge = container.firstChild as HTMLElement
        // Should use semantic tokens like bg-success, not specific colors like bg-green-500
        expect(badge).toHaveClass('bg-success/10')
        expect(badge.className).not.toMatch(/bg-green/)
        expect(badge.className).not.toMatch(/bg-emerald/)
      })

      it('should include dark mode support via Tailwind tokens', () => {
        const { container } = render(<CategoryBadge majorCategory="Income" />)
        const badge = container.firstChild as HTMLElement
        // Verify dark mode classes are used
        expect(badge.className).toMatch(/dark:bg-success/)
      })

      it('should apply custom className', () => {
        const { container } = render(
          <CategoryBadge majorCategory="Income" className="custom-class" />
        )
        const badge = container.firstChild as HTMLElement
        expect(badge).toHaveClass('custom-class')
      })
    })

    describe('Accessibility', () => {
      it('should hide icon from screen readers', () => {
        const { container } = render(<CategoryBadge majorCategory="Income" />)
        const icon = container.querySelector('svg')
        expect(icon).toHaveAttribute('aria-hidden', 'true')
      })
    })
  })

  describe('CategoryBadgeCompact', () => {
    describe('Rendering', () => {
      it('should render with majorCategory only', () => {
        render(<CategoryBadgeCompact majorCategory="Income" />)
        expect(screen.getByText('Income')).toBeInTheDocument()
      })

      it('should render with majorCategory and category in vertical layout', () => {
        render(<CategoryBadgeCompact majorCategory="Income" category="Salary" />)
        expect(screen.getByText('Income')).toBeInTheDocument()
        expect(screen.getByText('Salary')).toBeInTheDocument()
      })

      it('should render "N/A" when no category provided (en)', () => {
        render(<CategoryBadgeCompact language="en" />)
        expect(screen.getByText('N/A')).toBeInTheDocument()
      })

      it('should render "-" when no category provided (pt)', () => {
        render(<CategoryBadgeCompact language="pt" />)
        expect(screen.getByText('-')).toBeInTheDocument()
      })

      it('should have title attribute with full path', () => {
        const { container } = render(
          <CategoryBadgeCompact majorCategory="Income" category="Salary" />
        )
        const badge = container.firstChild as HTMLElement
        expect(badge).toHaveAttribute('title', 'Income › Salary')
      })
    })

    describe('Semantic Colors', () => {
      it('should use success colors for Income', () => {
        const { container } = render(<CategoryBadgeCompact majorCategory="Income" />)
        const badge = container.firstChild as HTMLElement
        expect(badge).toHaveClass('bg-success/10', 'text-success', 'border-success/30')
      })

      it('should use danger colors for Fixed Costs', () => {
        const { container } = render(<CategoryBadgeCompact majorCategory="Fixed Costs" />)
        const badge = container.firstChild as HTMLElement
        expect(badge).toHaveClass('bg-danger/10', 'text-danger', 'border-danger/30')
      })
    })

    describe('Design System Compliance', () => {
      it('should not use gradient backgrounds', () => {
        const { container } = render(<CategoryBadgeCompact majorCategory="Income" />)
        const badge = container.firstChild as HTMLElement
        expect(badge.className).not.toMatch(/gradient/)
      })

      it('should apply custom className', () => {
        const { container } = render(
          <CategoryBadgeCompact majorCategory="Income" className="custom-class" />
        )
        const badge = container.firstChild as HTMLElement
        expect(badge).toHaveClass('custom-class')
      })
    })
  })

  describe('CategoryCard', () => {
    describe('Rendering', () => {
      it('should render with majorCategory only', () => {
        render(<CategoryCard majorCategory="Income" />)
        expect(screen.getByText('Income')).toBeInTheDocument()
      })

      it('should render with category and majorCategory', () => {
        render(<CategoryCard majorCategory="Income" category="Salary" />)
        expect(screen.getByText('Salary')).toBeInTheDocument()
        expect(screen.getByText('Income')).toBeInTheDocument()
      })

      it('should render transaction count', () => {
        render(<CategoryCard majorCategory="Income" count={42} />)
        expect(screen.getByText('42 transactions')).toBeInTheDocument()
      })

      it('should calculate and display percentage', () => {
        render(<CategoryCard majorCategory="Income" count={25} total={100} />)
        expect(screen.getByText('25%')).toBeInTheDocument()
      })

      it('should round percentage correctly', () => {
        render(<CategoryCard majorCategory="Income" count={33} total={100} />)
        expect(screen.getByText('33%')).toBeInTheDocument()
      })
    })

    describe('Interaction', () => {
      it('should call onClick when clicked', async () => {
        const user = userEvent.setup()
        const handleClick = vi.fn()
        render(<CategoryCard majorCategory="Income" onClick={handleClick} />)

        await user.click(screen.getByRole('button'))
        expect(handleClick).toHaveBeenCalledTimes(1)
      })

      it('should have cursor-pointer class when onClick provided', () => {
        const { container } = render(<CategoryCard majorCategory="Income" onClick={() => {}} />)
        const card = container.firstChild as HTMLElement
        expect(card).toHaveClass('cursor-pointer')
      })

      it('should have cursor-default class when no onClick', () => {
        const { container } = render(<CategoryCard majorCategory="Income" />)
        const card = container.firstChild as HTMLElement
        expect(card).toHaveClass('cursor-default')
      })

      it('should show selected state with ring', () => {
        const { container } = render(<CategoryCard majorCategory="Income" selected={true} />)
        const card = container.firstChild as HTMLElement
        expect(card).toHaveClass('ring-2', 'ring-primary')
      })

      it('should not show ring when not selected', () => {
        const { container } = render(<CategoryCard majorCategory="Income" selected={false} />)
        const card = container.firstChild as HTMLElement
        expect(card.className).not.toMatch(/ring-2/)
      })
    })

    describe('Semantic Colors', () => {
      it('should use success colors for Income', () => {
        const { container } = render(<CategoryCard majorCategory="Income" />)
        const card = container.firstChild as HTMLElement
        expect(card).toHaveClass('bg-success/10', 'text-success', 'border-success/30')
      })

      it('should use danger colors for expenses', () => {
        const { container } = render(<CategoryCard majorCategory="Fixed Costs" />)
        const card = container.firstChild as HTMLElement
        expect(card).toHaveClass('bg-danger/10', 'text-danger', 'border-danger/30')
      })
    })

    describe('Design System Compliance', () => {
      it('should not use gradient backgrounds', () => {
        const { container } = render(<CategoryCard majorCategory="Income" />)
        const card = container.firstChild as HTMLElement
        expect(card.className).not.toMatch(/gradient/)
      })

      it('should apply custom className', () => {
        const { container } = render(
          <CategoryCard majorCategory="Income" className="custom-class" />
        )
        const card = container.firstChild as HTMLElement
        expect(card).toHaveClass('custom-class')
      })
    })
  })

  describe('Cross-Component Consistency', () => {
    it('should use same color scheme across all components', () => {
      const { container: badge } = render(<CategoryBadge majorCategory="Income" />)
      const { container: compact } = render(<CategoryBadgeCompact majorCategory="Income" />)
      const { container: card } = render(<CategoryCard majorCategory="Income" />)

      const badgeEl = badge.firstChild as HTMLElement
      const compactEl = compact.firstChild as HTMLElement
      const cardEl = card.firstChild as HTMLElement

      // All should use same semantic colors
      expect(badgeEl).toHaveClass('bg-success/10', 'text-success')
      expect(compactEl).toHaveClass('bg-success/10', 'text-success')
      expect(cardEl).toHaveClass('bg-success/10', 'text-success')
    })
  })
})
