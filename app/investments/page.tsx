'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Moon, Sun, FileText, Wallet, Sparkles } from 'lucide-react'
import { InvestmentsFeature } from '@/app/features/investments'

export default function InvestmentsPage() {
  const router = useRouter()
  const [darkMode, setDarkMode] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [token, setToken] = useState<string>('')

  // Load dark mode preference and token on mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'
    setDarkMode(savedDarkMode)
    if (savedDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    const savedToken = localStorage.getItem('token') || 'dev-token-no-auth'
    setToken(savedToken)
    setInitialized(true)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/'
  }

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newMode = !prev
      localStorage.setItem('darkMode', String(newMode))
      if (newMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      return newMode
    })
  }

  // Show nothing until dark mode preference is loaded to prevent flash
  if (!initialized) {
    return <div className="min-h-screen bg-slate-900" />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 relative overflow-hidden">
      {/* Header - matching homepage exactly */}
      <header className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md shadow-sm border-b border-white/50 dark:border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <a
                href="/"
                className="text-xl font-semibold text-indigo-950 dark:text-white hover:opacity-80 transition-opacity flex items-center gap-2"
              >
                <Wallet className="w-5 h-5 text-primary" aria-hidden="true" />
                <Sparkles className="w-5 h-5 text-warning" aria-hidden="true" />
                Moneto
              </a>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/"
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-2xl font-medium hover:shadow-lg hover:scale-105 transition-all shadow-sm"
                title="Voltar às Transações"
              >
                <FileText size={18} />
                <span className="hidden sm:inline">Transactions</span>
              </a>
              <button
                onClick={toggleDarkMode}
                className="p-2.5 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl text-indigo-950 dark:text-white hover:shadow-md transition-all shadow-sm"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl text-indigo-950 dark:text-white font-medium hover:shadow-md transition-all shadow-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        {/* Main Content Card */}
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-3xl shadow-lg p-6 border border-white/60 dark:border-white/20 relative z-10">
          <InvestmentsFeature token={token} />
        </div>
      </div>
    </div>
  )
}
