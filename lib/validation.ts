import { z } from 'zod'

// ============================================================================
// Authentication Schemas
// ============================================================================

export const AuthLoginSchema = z.object({
  action: z.literal('login'),
  name: z.string().min(1, 'Name is required').max(100),
  pin: z.string().min(4, 'PIN must be at least 4 characters').max(20),
})

export const AuthRegisterSchema = z.object({
  action: z.literal('register'),
  name: z.string().min(1, 'Name is required').max(100),
  pin: z.string().min(4, 'PIN must be at least 4 characters').max(20),
})

export const AuthLogoutSchema = z.object({
  action: z.literal('logout'),
})

export const AuthRequestSchema = z.discriminatedUnion('action', [
  AuthLoginSchema,
  AuthRegisterSchema,
  AuthLogoutSchema,
])

// ============================================================================
// Transaction Schemas
// ============================================================================

export const TransactionCreateSchema = z.object({
  date: z.string().datetime(),
  description: z.string().min(1).max(500),
  amount: z.number(),
  balance: z.number().optional(),
  origin: z.string().min(1).max(100), // Free-text origin (e.g., "Personal", "Joint", "Family")
  bank: z.string().min(1).max(100),
  majorCategoryId: z.string().optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(1000).optional(),
})

export const TransactionBatchCreateSchema = z.object({
  transactions: z.array(TransactionCreateSchema).min(1).max(1000),
})

export const TransactionUpdateSchema = z.object({
  id: z.string().cuid(),
  rawDate: z.coerce.date().optional(),
  rawDescription: z.string().min(1).max(500).optional(),
  rawAmount: z.number().optional(),
  rawBalance: z.number().optional().nullable(),
  origin: z.string().min(1).max(100).optional(),
  bank: z.string().min(1).max(100).optional(),
  majorCategoryId: z.string().optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(1000).optional().nullable(),
  flagged: z.boolean().optional(),
  status: z.enum(['pending', 'categorized', 'approved']).optional(),
  reviewStatus: z.enum(['pending_review', 'rejected']).nullable().optional(),
})

export const TransactionDeleteSchema = z.object({
  id: z.string().cuid(),
  permanent: z.boolean().optional().default(false), // true = hard delete, false = soft delete
})

export const TransactionRestoreSchema = z.object({
  id: z.string().cuid(),
})

export const TransactionBulkDeleteSchema = z.object({
  ids: z.array(z.string().cuid()).min(1).max(100),
  permanent: z.boolean().optional().default(false),
})

export const TransactionAIClassifySchema = z.object({
  transactionId: z.string().cuid(),
})

export const TransactionSuggestCategoriesSchema = z.object({
  transactionIds: z.array(z.string().cuid()).min(1).max(50),
})

// ============================================================================
// Rule Schemas
// ============================================================================

export const RuleCreateSchema = z.object({
  keyword: z.string().min(1).max(200),
  majorCategory: z.string().min(1).max(100),
  category: z.string().min(1).max(100),
  tags: z.array(z.string()).default([]),
  isDefault: z.boolean().default(false),
})

export const RuleDeleteSchema = z.object({
  id: z.string().cuid(),
})

// ============================================================================
// Category Schemas
// ============================================================================

export const CategoryCreateSchema = z.object({
  action: z.literal('create'),
  majorCategoryId: z.string(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9_-]+$/),
  name: z.string().min(1).max(100),
  nameEn: z.string().min(1).max(100).optional(),
  icon: z.string().min(1).max(50).optional(),
  sortOrder: z.number().int().min(0).default(0),
})

export const CategoryUpdateSchema = z.object({
  action: z.literal('update'),
  categoryId: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
  nameEn: z.string().min(1).max(100).optional(),
  icon: z.string().min(1).max(50).optional(),
  sortOrder: z.number().int().min(0).optional(),
})

export const CategoryDeleteSchema = z.object({
  action: z.literal('delete'),
  categoryId: z.string().cuid(),
})

export const CategoryManageSchema = z.discriminatedUnion('action', [
  CategoryCreateSchema,
  CategoryUpdateSchema,
  CategoryDeleteSchema,
])

// Category Management API Schemas (for /api/categories/manage)
export const CategoryManageCreateSchema = z.object({
  type: z.literal('category'),
  majorCategoryId: z.string().min(1, 'Major category ID is required'),
  name: z.string().min(1, 'Category name is required').max(100),
  nameEn: z.string().max(100).optional(),
  icon: z.string().max(50).optional(),
})

export const CategoryManageUpdateSchema = z.object({
  type: z.literal('category'),
  id: z.string().min(1, 'Category ID is required'),
  name: z.string().min(1, 'Category name is required').max(100),
  nameEn: z.string().max(100).optional(),
  icon: z.string().max(50).optional(),
})

export const CategoryManageDeleteSchema = z.object({
  type: z.literal('category'),
  id: z.string().min(1, 'Category ID is required'),
})

// ============================================================================
// Tag Schemas
// ============================================================================

export const TagCreateSchema = z.object({
  namespace: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z_]+$/),
  value: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9_-]+$/),
  label: z.string().min(1).max(100),
  labelEn: z.string().min(1).max(100).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
})

// ============================================================================
// Bank Schemas
// ============================================================================

export const BankCreateSchema = z.object({
  name: z.string().min(1, 'Bank name is required').max(100),
  logo: z.string().max(200).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
    .nullable()
    .optional(),
})

export const BankUpdateSchema = z.object({
  id: z.string().cuid('Invalid bank ID'),
  name: z.string().min(1, 'Bank name is required').max(100),
  logo: z.string().max(200).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
    .nullable()
    .optional(),
})

export const BankDeleteSchema = z.object({
  id: z.string().cuid('Invalid bank ID'),
})

// ============================================================================
// Investment Tracking Schemas
// ============================================================================

export const HoldingTypeEnum = z.enum(['ETF', 'PPR', 'STOCK', 'BOND', 'CRYPTO', 'OTHER'])

export const HoldingCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  ticker: z.string().max(20).optional().nullable(), // e.g., "IWDA.AS", "AAPL"
  type: HoldingTypeEnum,
  currency: z.string().length(3).default('EUR'), // ISO 4217 currency code
  notes: z.string().max(1000).optional().nullable(),
})

export const HoldingUpdateSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
  ticker: z.string().max(20).optional().nullable(),
  type: HoldingTypeEnum.optional(),
  currency: z.string().length(3).optional(),
  notes: z.string().max(1000).optional().nullable(),
  isActive: z.boolean().optional(),
  // Manual price update for PPRs and assets without API prices
  manualPrice: z.number().positive().optional().nullable(),
})

export const HoldingDeleteSchema = z.object({
  id: z.string().cuid(),
})

export const InvestmentTransactionTypeEnum = z.enum(['BUY', 'SELL'])

export const InvestmentTransactionCreateSchema = z.object({
  holdingId: z.string().cuid(),
  type: InvestmentTransactionTypeEnum,
  units: z.number().positive('Units must be positive'),
  pricePerUnit: z.number().positive('Price must be positive'),
  fees: z.number().min(0).default(0),
  date: z.coerce.date(),
  notes: z.string().max(500).optional().nullable(),
})

export const InvestmentTransactionDeleteSchema = z.object({
  id: z.string().cuid(),
})

export const ManualPriceUpdateSchema = z.object({
  holdingId: z.string().cuid(),
  price: z.number().positive('Price must be positive'),
})

// ============================================================================
// AI Schemas
// ============================================================================

export const AICategorizeSchema = z.object({
  transactionIds: z
    .array(z.string().cuid())
    .min(1, 'At least one transaction ID is required')
    .max(50, 'Maximum 50 transactions can be categorized at once'),
  useAI: z.boolean().default(true).optional(),
})

export const AIFeedbackSuggestionSchema = z.object({
  majorCategory: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()).optional().default([]),
  confidence: z.enum(['high', 'medium', 'low']),
  score: z.number().min(0).max(100).optional(),
  source: z.enum(['ai', 'pattern', 'rule', 'unknown']).optional(),
})

export const AIFeedbackSchema = z.object({
  transactionId: z.string().cuid('Invalid transaction ID'),
  suggestion: AIFeedbackSuggestionSchema,
  action: z.enum(['accept', 'reject', 'edit']),
  actualCategory: z
    .object({
      majorCategory: z.string().min(1),
      category: z.string().min(1),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
})

export const AIParseFileSchema = z.object({
  origin: z.string().min(1).max(100), // Free-text origin label
  useAI: z.boolean().default(false).optional(),
})

// ============================================================================
// Utility Types
// ============================================================================

export type AuthLoginInput = z.infer<typeof AuthLoginSchema>
export type AuthRegisterInput = z.infer<typeof AuthRegisterSchema>
export type AuthRequestInput = z.infer<typeof AuthRequestSchema>
export type TransactionCreateInput = z.infer<typeof TransactionCreateSchema>
export type TransactionBatchCreateInput = z.infer<typeof TransactionBatchCreateSchema>
export type TransactionUpdateInput = z.infer<typeof TransactionUpdateSchema>
export type RuleCreateInput = z.infer<typeof RuleCreateSchema>
export type CategoryManageInput = z.infer<typeof CategoryManageSchema>
export type CategoryManageCreateInput = z.infer<typeof CategoryManageCreateSchema>
export type CategoryManageUpdateInput = z.infer<typeof CategoryManageUpdateSchema>
export type CategoryManageDeleteInput = z.infer<typeof CategoryManageDeleteSchema>
export type TagCreateInput = z.infer<typeof TagCreateSchema>
export type BankCreateInput = z.infer<typeof BankCreateSchema>
export type BankUpdateInput = z.infer<typeof BankUpdateSchema>
export type BankDeleteInput = z.infer<typeof BankDeleteSchema>
export type AICategorizeInput = z.infer<typeof AICategorizeSchema>
export type AIFeedbackInput = z.infer<typeof AIFeedbackSchema>
export type AIParseFileInput = z.infer<typeof AIParseFileSchema>
export type HoldingType = z.infer<typeof HoldingTypeEnum>
export type HoldingCreateInput = z.infer<typeof HoldingCreateSchema>
export type HoldingUpdateInput = z.infer<typeof HoldingUpdateSchema>
export type HoldingDeleteInput = z.infer<typeof HoldingDeleteSchema>
export type InvestmentTransactionType = z.infer<typeof InvestmentTransactionTypeEnum>
export type InvestmentTransactionCreateInput = z.infer<typeof InvestmentTransactionCreateSchema>
export type InvestmentTransactionDeleteInput = z.infer<typeof InvestmentTransactionDeleteSchema>
export type ManualPriceUpdateInput = z.infer<typeof ManualPriceUpdateSchema>
