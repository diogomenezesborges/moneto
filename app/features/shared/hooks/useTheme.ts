/**
 * useTheme Hook
 *
 * Manages dark mode state and system preference detection.
 */

import { useState, useEffect } from 'react'

export function useTheme() {
  const [darkMode, setDarkMode] = useState(false)
  const [language, setLanguage] = useState<'pt' | 'en'>('pt')

  // Detect system dark mode preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setDarkMode(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setDarkMode(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const toggleDarkMode = () => setDarkMode(prev => !prev)
  const toggleLanguage = () => setLanguage(prev => (prev === 'pt' ? 'en' : 'pt'))

  return {
    darkMode,
    language,
    toggleDarkMode,
    toggleLanguage,
    setDarkMode,
    setLanguage,
  }
}
