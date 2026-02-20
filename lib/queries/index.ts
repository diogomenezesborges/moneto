/**
 * Query Hooks Index
 *
 * Centralized export for all TanStack Query hooks.
 */

// Transactions
export {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useBulkDeleteTransactions,
  useTrashTransactions,
  useRestoreTransaction,
  usePermanentDelete,
  transactionKeys,
} from './transactions'
export type {
  Transaction,
  TransactionFilters,
  TransactionsResponse,
  TransactionUpdate,
} from './transactions'

// Categories
export { useCategories, categoryKeys } from './categories'
export type { Category, MajorCategory, TaxonomyResponse } from './categories'

// Rules
export { useRules, useCreateRule, useDeleteRule, useApplyRulesToPending, ruleKeys } from './rules'
export type { Rule, CreateRuleData } from './rules'

// Stats
export { useStats, useCashFlow, useSavingsTrend, statsKeys } from './stats'
export type {
  Stats,
  CashFlowFilters,
  CashFlowNode,
  CashFlowLink,
  CashFlowData,
  SavingsTrendPoint,
} from './stats'

// Review
export { useReviewTransactions, useReviewAction, reviewKeys } from './review'
export type { ReviewTransaction, ReviewAction } from './review'

// Net Worth
export { useNetWorth, calculateTrend, netWorthKeys } from './net-worth'
export type {
  NetWorthData,
  NetWorthAccount,
  NetWorthHolding,
  NetWorthHistoryPoint,
} from './net-worth'
