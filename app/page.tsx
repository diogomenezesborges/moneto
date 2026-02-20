/**
 * Main Application Page
 *
 * Integrates all feature modules into a unified application.
 * Handles authentication, navigation, and theme management.
 *
 * Architecture: Feature-based modular design (Issue #70)
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FileText,
  BarChart3,
  Settings,
  Zap,
  Eye,
  EyeOff,
  LogOut,
  GitBranch,
  TrendingUp,
  Menu,
  X,
  Wallet,
  Sparkles,
} from 'lucide-react'
import { useTheme, useNotification } from '@/app/features/shared/hooks'
import { useAuthStore } from '@/lib/stores/authStore'
import { TransactionsFeature } from '@/app/features/transactions/components/TransactionsFeature'
import { StatsFeature } from '@/app/features/stats/components/StatsFeature'
import { RulesFeature } from '@/app/features/rules/components/RulesFeature'
import { ReviewFeature } from '@/app/features/review/components/ReviewFeature'
import { SettingsFeature } from '@/app/features/settings/components/SettingsFeature'
import { CashFlowFeature } from '@/app/features/cash-flow/components/CashFlowFeature'
import { InvestmentsFeature } from '@/app/features/investments'
import { Notification } from '@/app/features/shared/components/Notification'
import { LanguageToggle } from '@/app/features/shared/components/LanguageToggle'
import { ThemeToggle } from '@/app/features/shared/components/ThemeToggle'
import { DashboardHero } from '@/app/features/dashboard/components/DashboardHero'
import { useTransactions } from '@/lib/queries'
import { useStats } from '@/app/features/stats/hooks/useStats'

type TabId = 'transactions' | 'stats' | 'cashflow' | 'rules' | 'review' | 'investments' | 'settings'

interface Tab {
  id: TabId
  label: string
  labelEn: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

const TABS: Tab[] = [
  { id: 'transactions', label: 'Transações', labelEn: 'Transactions', icon: FileText },
  { id: 'stats', label: 'Estatísticas', labelEn: 'Statistics', icon: BarChart3 },
  { id: 'cashflow', label: 'Fluxo de Caixa', labelEn: 'Cash Flow', icon: GitBranch },
  { id: 'rules', label: 'Regras', labelEn: 'Rules', icon: Zap },
  { id: 'review', label: 'Revisão', labelEn: 'Review', icon: Eye },
  { id: 'investments', label: 'Investimentos', labelEn: 'Investments', icon: TrendingUp },
  { id: 'settings', label: 'Configurações', labelEn: 'Settings', icon: Settings },
]

export default function App() {
  // Hooks
  const { user, token, isAuthenticated, authChecked, login, logout } = useAuthStore()
  const { language, toggleLanguage } = useTheme()
  const { notification, showNotification, dismissNotification } = useNotification()

  // Local state
  const [activeTab, setActiveTab] = useState<TabId>('transactions')
  const [reviewCount, setReviewCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Login form state
  const [pinInput, setPinInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)

  // Fetch transactions for dashboard stats (only when authenticated)
  const { data: transactions } = useTransactions(
    {},
    {
      enabled: isAuthenticated,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  )

  // Calculate stats for dashboard
  const stats = useStats({ transactions: transactions || [] })

  // Fetch review count
  const fetchReviewCount = useCallback(async () => {
    if (!isAuthenticated || !token) return
    try {
      const res = await fetch('/api/transactions/review', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setReviewCount(Array.isArray(data) ? data.length : 0)
      }
    } catch {
      // Ignore errors
    }
  }, [isAuthenticated, token])

  // Fetch review count on auth change
  useEffect(() => {
    if (isAuthenticated) {
      fetchReviewCount()
    }
  }, [isAuthenticated, fetchReviewCount])

  // Verify token on mount (fix infinite loading on page refresh)
  useEffect(() => {
    const { token, authChecked, setAuthChecked, logout } = useAuthStore.getState()

    // If auth already checked or no token, mark as checked
    if (authChecked || !token) {
      setAuthChecked(true)
      return
    }

    // Verify token is still valid by making a simple API call
    const verifyToken = async () => {
      try {
        const res = await fetch('/api/transactions?limit=1', {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          // Token is invalid, logout
          logout()
        }
        // If successful, auth state is already set from Zustand rehydration
      } catch (error) {
        // Network error or invalid token, logout
        logout()
      } finally {
        // ALWAYS mark auth as checked, regardless of success/failure
        setAuthChecked(true)
      }
    }

    verifyToken()
  }, []) // Run once on mount

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nameInput.trim() || !pinInput.trim()) {
      showNotification('Please enter both name and PIN', 'error')
      return
    }

    setAuthLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'login',
          name: nameInput,
          pin: pinInput,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        // Get CSRF token from response body (primary) or header (fallback)
        const csrfToken = data.csrfToken || res.headers.get('X-CSRF-Token')

        // Store in Zustand (which handles localStorage persistence automatically)
        login(data.user, data.token, csrfToken)

        showNotification(`Welcome, ${data.user.name}!`, 'success')
        setPinInput('')
        setNameInput('')
      } else {
        showNotification(data.message || 'Authentication failed', 'error')
      }
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Login failed', 'error')
    } finally {
      setAuthLoading(false)
    }
  }

  // Handle logout
  const handleLogout = () => {
    logout()
    showNotification('Logged out successfully', 'info')
    setActiveTab('transactions')
  }

  // Get tab label based on language
  const getTabLabel = (tab: Tab) => (language === 'pt' ? tab.label : tab.labelEn)

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-indigo-700 dark:text-indigo-300 font-semibold">
            {language === 'pt' ? 'Carregando...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        {/* Notification */}
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={dismissNotification}
          />
        )}

        {/* Theme & Language Toggles */}
        <div className="fixed top-4 right-4 flex gap-2">
          <ThemeToggle />
          <LanguageToggle language={language} onChange={toggleLanguage} />
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 max-w-md w-full border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4" aria-label="Moneto Logo">
              <Wallet className="w-12 h-12 text-primary" />
              <Sparkles className="w-12 h-12 text-warning" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Moneto</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {language === 'pt' ? 'Gestão Financeira Familiar' : 'Family Financial Management'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                {language === 'pt' ? 'Nome' : 'Name'}
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder={language === 'pt' ? 'Digite seu nome' : 'Enter your name'}
                className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white px-4 py-3 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                PIN
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value)}
                  placeholder={language === 'pt' ? 'Digite seu PIN' : 'Enter your PIN'}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white px-4 py-3 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  aria-label={
                    showPin
                      ? language === 'pt'
                        ? 'Ocultar PIN'
                        : 'Hide PIN'
                      : language === 'pt'
                        ? 'Mostrar PIN'
                        : 'Show PIN'
                  }
                >
                  {showPin ? (
                    <EyeOff size={20} aria-hidden="true" />
                  ) : (
                    <Eye size={20} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading || !nameInput.trim() || !pinInput.trim()}
              className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {authLoading
                ? language === 'pt'
                  ? 'Entrando...'
                  : 'Logging in...'
                : language === 'pt'
                  ? 'Entrar'
                  : 'Login'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            {language === 'pt'
              ? 'Use seu nome e PIN para acessar'
              : 'Use your name and PIN to access'}
          </p>
        </div>
      </div>
    )
  }

  // Main application (authenticated)
  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300`}>
      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={dismissNotification}
        />
      )}

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5" aria-label="Moneto Logo">
                <Wallet className="w-8 h-8 text-primary" />
                <Sparkles className="w-8 h-8 text-warning" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Moneto</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {language === 'pt' ? `Olá, ${user?.name}!` : `Hello, ${user?.name}!`}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Hamburger Menu - Mobile Only */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden min-h-[44px] min-w-[44px] p-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors inline-flex items-center justify-center"
                aria-label={
                  mobileMenuOpen
                    ? language === 'pt'
                      ? 'Fechar menu'
                      : 'Close menu'
                    : language === 'pt'
                      ? 'Abrir menu'
                      : 'Open menu'
                }
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X size={24} aria-hidden="true" />
                ) : (
                  <Menu size={24} aria-hidden="true" />
                )}
              </button>

              <ThemeToggle />
              <LanguageToggle language={language} onChange={toggleLanguage} />
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 min-h-[44px] rounded-xl flex items-center gap-2 transition-colors font-semibold"
                title={language === 'pt' ? 'Sair' : 'Logout'}
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">{language === 'pt' ? 'Sair' : 'Logout'}</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation - Desktop Only */}
          <nav
            className="hidden md:flex gap-2 mt-4 overflow-x-auto"
            role="tablist"
            aria-label={language === 'pt' ? 'Navegação principal' : 'Main navigation'}
          >
            {TABS.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              const showBadge = tab.id === 'review' && reviewCount > 0
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`${tab.id}-panel`}
                  className={`relative flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-xl font-semibold transition-all duration-150 whitespace-nowrap ${
                    isActive
                      ? 'bg-primary hover:bg-primary-hover text-white shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <Icon size={18} aria-hidden="true" />
                  {getTabLabel(tab)}
                  {showBadge && (
                    <span
                      className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1.5"
                      aria-label={`${reviewCount} ${language === 'pt' ? 'itens para revisão' : 'items to review'}`}
                    >
                      {reviewCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Sidebar Navigation */}
      {mobileMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Sidebar */}
          <div className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 z-50 shadow-lg animate-slide-in-left md:hidden">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {language === 'pt' ? 'Menu' : 'Menu'}
              </h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label={language === 'pt' ? 'Fechar menu' : 'Close menu'}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {/* Sidebar Navigation */}
            <nav
              className="p-4 space-y-2"
              role="tablist"
              aria-label={language === 'pt' ? 'Navegação principal' : 'Main navigation'}
            >
              {TABS.map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                const showBadge = tab.id === 'review' && reviewCount > 0
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setMobileMenuOpen(false)
                    }}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`${tab.id}-panel`}
                    className={`relative w-full flex items-center gap-3 px-4 py-3 min-h-[44px] rounded-xl font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-primary hover:bg-primary-hover text-white shadow-sm'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Icon size={20} aria-hidden="true" />
                    {getTabLabel(tab)}
                    {showBadge && (
                      <span
                        className="ml-auto min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1.5"
                        aria-label={`${reviewCount} ${language === 'pt' ? 'itens para revisão' : 'items to review'}`}
                      >
                        {reviewCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Dashboard Hero - Shows on all tabs */}
        <DashboardHero
          stats={stats}
          reviewCount={reviewCount}
          language={language}
          onNavigateToReview={() => setActiveTab('review')}
        />

        {activeTab === 'transactions' && (
          <div
            role="tabpanel"
            id="transactions-panel"
            aria-labelledby="transactions-tab"
            className="animate-fade-in"
          >
            <TransactionsFeature
              token={token || ''}
              isAuthenticated={isAuthenticated}
              onSuccess={message => showNotification(message, 'success')}
              onError={message => showNotification(message, 'error')}
            />
          </div>
        )}

        {activeTab === 'stats' && (
          <div
            role="tabpanel"
            id="stats-panel"
            aria-labelledby="stats-tab"
            className="animate-fade-in"
          >
            <StatsFeature />
          </div>
        )}

        {activeTab === 'cashflow' && (
          <div
            role="tabpanel"
            id="cashflow-panel"
            aria-labelledby="cashflow-tab"
            className="animate-fade-in"
          >
            <CashFlowFeature
              token={token || ''}
              isAuthenticated={isAuthenticated}
              onSuccess={message => showNotification(message, 'success')}
              onError={message => showNotification(message, 'error')}
            />
          </div>
        )}

        {activeTab === 'rules' && (
          <div
            role="tabpanel"
            id="rules-panel"
            aria-labelledby="rules-tab"
            className="animate-fade-in"
          >
            <RulesFeature
              onSuccess={message => showNotification(message, 'success')}
              onError={message => showNotification(message, 'error')}
            />
          </div>
        )}

        {activeTab === 'review' && (
          <div
            role="tabpanel"
            id="review-panel"
            aria-labelledby="review-tab"
            className="animate-fade-in"
          >
            <ReviewFeature
              token={token || ''}
              isAuthenticated={isAuthenticated}
              onSuccess={message => showNotification(message, 'success')}
              onError={message => showNotification(message, 'error')}
            />
          </div>
        )}

        {activeTab === 'investments' && (
          <div
            role="tabpanel"
            id="investments-panel"
            aria-labelledby="investments-tab"
            className="animate-fade-in"
          >
            <InvestmentsFeature token={token || ''} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div
            role="tabpanel"
            id="settings-panel"
            aria-labelledby="settings-tab"
            className="animate-fade-in"
          >
            <SettingsFeature
              token={token || ''}
              isAuthenticated={isAuthenticated}
              onSuccess={message => showNotification(message, 'success')}
              onError={message => showNotification(message, 'error')}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>© 2025 Moneto. Family Financial Management.</p>
      </footer>
    </div>
  )
}
