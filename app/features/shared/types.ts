/**
 * Shared Types for Feature Modules
 *
 * Common TypeScript interfaces used across multiple feature modules.
 */

import { User, Transaction, Rule } from '@prisma/client'

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
}

export interface TransactionWithUser extends Transaction {
  user: User
  majorCategoryRef?: {
    id: string
    emoji?: string | null
    name: string
  } | null
  categoryRef?: {
    id: string
    name: string
    icon?: string | null
  } | null
}

export interface Category {
  id: string
  name: string
  nameEn?: string | null
  slug: string
  icon?: string | null
}

export interface MajorCategory {
  id: string
  name: string
  nameEn?: string | null
  emoji: string
  slug: string
  budgetCategory?: string | null
  categories: Category[]
}

export interface TagDefinition {
  id: string
  namespace: string
  value: string
  label: string
  labelEn?: string | null
  color?: string | null
  sortOrder?: number
}

export interface NotificationState {
  message: string
  type: 'success' | 'error' | 'info'
}

export interface StatsData {
  totalIncome?: number
  totalExpenses?: number
  netBalance?: number
  byMajorCategory?: Array<{
    majorCategory: string
    total: number
    count: number
  }>
  byOrigin?: Array<{
    origin: string
    total: number
    count: number
  }>
  byMonth?: Array<{
    month: string
    income: number
    expenses: number
    net: number
  }>
}

export interface FilterState {
  status: string
  majorCategory: string
  category: string
  subcategory: string
  tags: string[]
  search: string
  flagged: boolean
  origin: string
  bank: string
}

export interface EditForm {
  rawDate?: Date | null
  rawDescription?: string
  rawAmount?: number | string
  rawBalance?: number | null
  notes?: string | null
  origin?: string
  bank?: string
  majorCategoryId?: string | null
  categoryId?: string | null
  majorCategory?: string | null
  category?: string | null
  tags?: string[]
  status?: string
  flagged?: boolean
}
