'use client'

import { cn } from '@/lib/utils'
import { Folder } from 'lucide-react'

interface CategoryBadgeProps {
  majorCategory?: string | null
  category?: string | null
  majorEmoji?: string | null
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
  language?: 'pt' | 'en'
}

/**
 * Phase 0 Design System - Monochromatic Category Colors
 *
 * Maps major categories to semantic color tokens (no gradients).
 * Uses subtle background tints with colored text and borders.
 */
const MAJOR_CATEGORY_COLORS: Record<
  string,
  {
    bg: string
    border: string
    text: string
  }
> = {
  // Income - Success semantic color
  Rendimento: {
    bg: 'bg-success/10 dark:bg-success/20',
    border: 'border-success/30 dark:border-success/40',
    text: 'text-success dark:text-success',
  },
  Income: {
    bg: 'bg-success/10 dark:bg-success/20',
    border: 'border-success/30 dark:border-success/40',
    text: 'text-success dark:text-success',
  },

  // Expenses - Danger semantic color
  'Custos Fixos': {
    bg: 'bg-danger/10 dark:bg-danger/20',
    border: 'border-danger/30 dark:border-danger/40',
    text: 'text-danger dark:text-danger',
  },
  'Fixed Costs': {
    bg: 'bg-danger/10 dark:bg-danger/20',
    border: 'border-danger/30 dark:border-danger/40',
    text: 'text-danger dark:text-danger',
  },
  'Custos Variáveis': {
    bg: 'bg-danger/10 dark:bg-danger/20',
    border: 'border-danger/30 dark:border-danger/40',
    text: 'text-danger dark:text-danger',
  },
  'Variable Costs': {
    bg: 'bg-danger/10 dark:bg-danger/20',
    border: 'border-danger/30 dark:border-danger/40',
    text: 'text-danger dark:text-danger',
  },

  // Wants - Warning semantic color
  'Gastos sem Culpa': {
    bg: 'bg-warning/10 dark:bg-warning/20',
    border: 'border-warning/30 dark:border-warning/40',
    text: 'text-warning dark:text-warning',
  },
  'Guilt-Free Spending': {
    bg: 'bg-warning/10 dark:bg-warning/20',
    border: 'border-warning/30 dark:border-warning/40',
    text: 'text-warning dark:text-warning',
  },

  // Savings & Investments - Primary semantic color
  'Economia e Investimentos': {
    bg: 'bg-primary/10 dark:bg-primary/20',
    border: 'border-primary/30 dark:border-primary/40',
    text: 'text-primary dark:text-primary',
  },
  'Savings & Investments': {
    bg: 'bg-primary/10 dark:bg-primary/20',
    border: 'border-primary/30 dark:border-primary/40',
    text: 'text-primary dark:text-primary',
  },

  // Other - Muted neutral color
  Outros: {
    bg: 'bg-muted',
    border: 'border-border',
    text: 'text-muted-foreground',
  },
  Other: {
    bg: 'bg-muted',
    border: 'border-border',
    text: 'text-muted-foreground',
  },
}

const DEFAULT_COLORS = {
  bg: 'bg-muted',
  border: 'border-border',
  text: 'text-muted-foreground',
}

function getColors(majorCategory: string | null | undefined) {
  if (!majorCategory) return DEFAULT_COLORS
  return MAJOR_CATEGORY_COLORS[majorCategory] || DEFAULT_COLORS
}

export function CategoryBadge({
  majorCategory,
  category,
  majorEmoji,
  size = 'md',
  showIcon = true,
  className = '',
  language = 'en',
}: CategoryBadgeProps) {
  if (!majorCategory && !category) {
    return (
      <span
        className={cn(
          'inline-flex items-center text-muted-foreground italic',
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-base',
          className
        )}
      >
        {language === 'en' ? 'Not categorized' : 'Não categorizado'}
      </span>
    )
  }

  const colors = getColors(majorCategory)

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  }

  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 18 : 14

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-lg border',
        colors.bg,
        colors.border,
        colors.text,
        sizeClasses[size],
        'transition-all',
        className
      )}
    >
      {showIcon && <Folder size={iconSize} className="shrink-0" aria-hidden="true" />}
      <span className="truncate">
        {majorCategory}
        {category && (
          <>
            <span className="opacity-50 mx-1.5">›</span>
            <span className="font-semibold">{category}</span>
          </>
        )}
      </span>
    </span>
  )
}

// Compact version for table rows - shows parent › child hierarchy
export function CategoryBadgeCompact({
  majorCategory,
  category,
  majorEmoji,
  className = '',
  language = 'en',
}: Omit<CategoryBadgeProps, 'size' | 'showIcon'>) {
  if (!majorCategory && !category) {
    return (
      <span className="text-xs text-muted-foreground italic">
        {language === 'en' ? 'N/A' : '-'}
      </span>
    )
  }

  const colors = getColors(majorCategory)
  const fullPath = `${majorCategory}${category ? ` › ${category}` : ''}`

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border',
        colors.bg,
        colors.border,
        colors.text,
        'transition-all',
        className
      )}
      title={fullPath}
    >
      <span className="flex flex-col leading-tight">
        <span className="opacity-70 text-[10px] font-medium">{majorCategory}</span>
        {category && <span className="font-semibold">{category}</span>}
      </span>
    </span>
  )
}

// For displaying in a list/grid - vertical layout
export function CategoryCard({
  majorCategory,
  category,
  majorEmoji,
  count,
  total,
  onClick,
  selected = false,
  className = '',
}: {
  majorCategory: string
  category?: string
  majorEmoji?: string | null
  count?: number
  total?: number
  onClick?: () => void
  selected?: boolean
  className?: string
}) {
  const colors = getColors(majorCategory)
  const percentage = count && total ? Math.round((count / total) * 100) : 0

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 rounded-lg border text-left transition-all',
        colors.bg,
        colors.border,
        colors.text,
        selected && 'ring-2 ring-primary ring-offset-2 dark:ring-offset-background',
        onClick && 'hover:shadow-md cursor-pointer',
        !onClick && 'cursor-default',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="font-semibold text-base">{category || majorCategory}</span>
      </div>
      {category && (
        <div className="text-xs font-medium text-muted-foreground mb-2">{majorCategory}</div>
      )}
      {count !== undefined && (
        <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-border">
          <span className="font-medium">{count} transactions</span>
          {total && (
            <span className="font-semibold text-sm bg-background/50 px-2 py-0.5 rounded-md">
              {percentage}%
            </span>
          )}
        </div>
      )}
    </button>
  )
}
