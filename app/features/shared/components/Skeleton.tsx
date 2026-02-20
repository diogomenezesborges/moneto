'use client'

/**
 * Reusable skeleton loading components.
 * Replace spinners with content-aware placeholders for perceived performance.
 */

function SkeletonBlock({
  className = '',
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`}
      style={style}
    />
  )
}

/** Skeleton for a single transaction table row */
function TransactionRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
      {/* Checkbox */}
      <SkeletonBlock className="h-4 w-4 rounded flex-shrink-0" />
      {/* Date */}
      <SkeletonBlock className="h-4 w-20 flex-shrink-0" />
      {/* Avatar */}
      <SkeletonBlock className="h-8 w-8 rounded-full flex-shrink-0" />
      {/* Description */}
      <SkeletonBlock className="h-4 flex-1 max-w-[240px]" />
      {/* Category */}
      <SkeletonBlock className="h-5 w-20 rounded-full hidden md:block" />
      {/* Amount */}
      <SkeletonBlock className="h-4 w-16 flex-shrink-0 ml-auto" />
      {/* Actions */}
      <SkeletonBlock className="h-4 w-12 flex-shrink-0 hidden md:block" />
    </div>
  )
}

/** Skeleton for the transaction table (desktop view) */
export function TransactionTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-0">
      {/* Table header skeleton */}
      <div className="flex items-center gap-4 px-4 py-3 border-b-2 border-gray-200 dark:border-gray-700">
        <SkeletonBlock className="h-4 w-4 rounded flex-shrink-0" />
        <SkeletonBlock className="h-3 w-14 flex-shrink-0" />
        <SkeletonBlock className="h-3 w-8 rounded-full flex-shrink-0" />
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="h-3 w-20 hidden md:block" />
        <SkeletonBlock className="h-3 w-16 ml-auto flex-shrink-0" />
        <SkeletonBlock className="h-3 w-12 flex-shrink-0 hidden md:block" />
      </div>
      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, i) => (
        <TransactionRowSkeleton key={i} />
      ))}
    </div>
  )
}

/** Skeleton for mobile transaction cards */
export function TransactionCardsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse"
        >
          <div className="flex items-start justify-between mb-3">
            <SkeletonBlock className="h-5 w-32" />
            <SkeletonBlock className="h-5 w-20 rounded-full" />
          </div>
          <SkeletonBlock className="h-4 w-48 mb-2" />
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-3 w-16" />
            <SkeletonBlock className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Skeleton for KPI/stats cards */
export function StatsCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <SkeletonBlock className="h-4 w-4 rounded-full" />
        <SkeletonBlock className="h-3 w-24" />
      </div>
      <SkeletonBlock className="h-8 w-32 mb-2" />
      <SkeletonBlock className="h-3 w-20" />
    </div>
  )
}

/** Skeleton for chart areas */
export function ChartSkeleton({ height = 'h-[400px]' }: { height?: string }) {
  return (
    <div
      className={`${height} bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse`}
    >
      <div className="flex items-center gap-2 mb-4">
        <SkeletonBlock className="h-4 w-32" />
      </div>
      <div className="flex items-end gap-2 h-[calc(100%-3rem)]">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonBlock
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${30 + Math.random() * 60}%` } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  )
}

/** Skeleton for cash flow view */
export function CashFlowSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
      <ChartSkeleton height="h-[500px]" />
    </div>
  )
}

/** Skeleton for review table */
export function ReviewTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-800 animate-pulse"
        >
          <SkeletonBlock className="h-4 w-4 rounded flex-shrink-0" />
          <SkeletonBlock className="h-4 w-20 flex-shrink-0" />
          <SkeletonBlock className="h-4 flex-1 max-w-[200px]" />
          <SkeletonBlock className="h-6 w-24 rounded-full hidden md:block" />
          <SkeletonBlock className="h-4 w-16 flex-shrink-0 ml-auto" />
          <SkeletonBlock className="h-8 w-20 rounded-lg flex-shrink-0" />
        </div>
      ))}
    </div>
  )
}

/** Skeleton for settings/category management */
export function CategorySkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-xl"
        >
          <SkeletonBlock className="h-8 w-8 rounded-lg flex-shrink-0" />
          <SkeletonBlock className="h-4 flex-1 max-w-[180px]" />
          <SkeletonBlock className="h-6 w-16 rounded-full ml-auto" />
        </div>
      ))}
    </div>
  )
}
