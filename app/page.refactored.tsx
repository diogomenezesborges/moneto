/**
 * Refactored Main Application Page
 *
 * This is a proof-of-concept showing the new feature-based architecture.
 * Once fully implemented, this will replace the monolithic page.tsx
 *
 * Architecture:
 * - Feature-based component organization
 * - Shared hooks for auth, theme, notifications
 * - Cleaner separation of concerns
 * - Better code-splitting and maintainability
 */

'use client'

import { useState } from 'react'
import {
  Moon,
  Sun,
  Languages,
  Home,
  FileText,
  BarChart3,
  Settings as SettingsIcon,
  Eye,
  FolderTree,
} from 'lucide-react'
import { useAuth, useTheme, useNotification } from '@/app/features/shared/hooks'
import { TransactionsFeature } from '@/app/features/transactions'
import { RulesFeature } from '@/app/features/rules'
import { StatsFeature } from '@/app/features/stats'
import { SettingsFeature } from '@/app/features/settings'
import { ReviewFeature } from '@/app/features/review'

export default function App() {
  const { auth, authChecked, login, logout } = useAuth()
  const { darkMode, language, toggleDarkMode, toggleLanguage } = useTheme()
  const { notification, showSuccess, showError, showInfo, dismissNotification } = useNotification()

  // Tab state
  const [activeTab, setActiveTab] = useState('transactions')

  // Login state
  const [showLogin, setShowLogin] = useState(true)
  const [pinInput, setPinInput] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [nameInput, setNameInput] = useState('')

  // Handle authentication
  const handleAuth = async () => {
    try {
      const action = isRegistering ? 'register' : 'login'
      const body = isRegistering
        ? { action, name: nameInput, pin: pinInput }
        : { action, name: nameInput || 'User', pin: pinInput }

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (response.ok && data.user && data.token) {
        login(data.user, data.token)
        setShowLogin(false)
        setPinInput('')
        setNameInput('')
        showSuccess(`Welcome, ${data.user.name}!`)
      } else {
        showError(data.message || 'Authentication failed')
      }
    } catch (error) {
      showError('Authentication failed. Please try again.')
    }
  }

  const handleLogout = async () => {
    try {
      if (auth.token) {
        await fetch('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify({ action: 'logout' }),
        })
      }
      logout()
      setShowLogin(true)
      showInfo('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      logout()
    }
  }

  // Tab configuration
  const tabs = [
    { id: 'transactions', label: 'Transactions', icon: FileText },
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'rules', label: 'Rules', icon: FolderTree },
    { id: 'review', label: 'Review', icon: Eye },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ]

  // Show loading state while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-indigo-700 dark:text-indigo-300 font-semibold">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login screen if not authenticated
  if (!auth.isAuthenticated || showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/60 dark:border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-indigo-950 dark:text-white mb-2">💰 Moneto</h1>
            <p className="text-indigo-700 dark:text-indigo-300 font-medium">
              {isRegistering ? 'Create Account' : 'Welcome Back'}
            </p>
          </div>

          <div className="space-y-4">
            {isRegistering && (
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="Your Name"
                className="w-full px-6 py-4 bg-white dark:bg-slate-700 border-2 border-indigo-200 dark:border-slate-600 rounded-2xl text-indigo-950 dark:text-white placeholder-indigo-400 dark:placeholder-slate-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 font-medium"
              />
            )}

            <input
              type="password"
              inputMode="numeric"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
              placeholder="Enter PIN"
              className="w-full px-6 py-4 bg-white dark:bg-slate-700 border-2 border-indigo-200 dark:border-slate-600 rounded-2xl text-indigo-950 dark:text-white placeholder-indigo-400 dark:placeholder-slate-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 font-medium text-center text-2xl tracking-widest"
              maxLength={6}
            />

            <button
              onClick={handleAuth}
              disabled={!pinInput || (isRegistering && !nameInput)}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRegistering ? 'Create Account' : 'Sign In'}
            </button>

            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="w-full text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-800 dark:hover:text-indigo-200 transition-colors"
            >
              {isRegistering ? 'Already have an account? Sign In' : 'New user? Create Account'}
            </button>
          </div>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleDarkMode}
          className="fixed top-4 right-4 p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-xl transition-all border border-white/60 dark:border-white/20"
        >
          {darkMode ? (
            <Sun className="w-6 h-6 text-yellow-500" />
          ) : (
            <Moon className="w-6 h-6 text-indigo-700" />
          )}
        </button>
      </div>
    )
  }

  // Main application UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border-b border-white/60 dark:border-white/20 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-indigo-950 dark:text-white">💰 Moneto</h1>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleLanguage}
                className="p-2 rounded-xl hover:bg-indigo-100 dark:hover:bg-slate-700 transition-colors"
                title="Toggle Language"
              >
                <Languages className="w-5 h-5 text-indigo-700 dark:text-indigo-300" />
              </button>

              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl hover:bg-indigo-100 dark:hover:bg-slate-700 transition-colors"
                title="Toggle Dark Mode"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-indigo-700" />
                )}
              </button>

              <div className="h-8 w-px bg-indigo-200 dark:bg-slate-600"></div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-indigo-950 dark:text-white">
                    {auth.user?.name}
                  </p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400">
                    {language === 'pt' ? 'Autenticado' : 'Authenticated'}
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors text-sm"
                >
                  {language === 'pt' ? 'Sair' : 'Logout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border-b border-white/40 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-3">
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                      : 'bg-white/60 dark:bg-slate-700/60 text-indigo-700 dark:text-indigo-300 hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'transactions' && (
          <TransactionsFeature
            token={auth.token || ''}
            isAuthenticated={auth.isAuthenticated}
            onSuccess={showSuccess}
            onError={showError}
          />
        )}

        {activeTab === 'dashboard' && <StatsFeature />}

        {activeTab === 'rules' && (
          <RulesFeature
            token={auth.token || ''}
            isAuthenticated={auth.isAuthenticated}
            onSuccess={showSuccess}
            onError={showError}
          />
        )}

        {activeTab === 'review' && (
          <ReviewFeature
            token={auth.token || ''}
            isAuthenticated={auth.isAuthenticated}
            onSuccess={showSuccess}
            onError={showError}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsFeature
            token={auth.token || ''}
            isAuthenticated={auth.isAuthenticated}
            onSuccess={showSuccess}
            onError={showError}
          />
        )}
      </main>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div
            className={`rounded-2xl shadow-2xl p-4 border-2 backdrop-blur-md max-w-md ${
              notification.type === 'success'
                ? 'bg-emerald-500/90 border-emerald-400 text-white'
                : notification.type === 'error'
                  ? 'bg-red-500/90 border-red-400 text-white'
                  : 'bg-blue-500/90 border-blue-400 text-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="font-semibold">{notification.message}</p>
              </div>
              <button
                onClick={dismissNotification}
                className="text-white/80 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
