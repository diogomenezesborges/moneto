'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Language = 'pt' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (pt: string | null | undefined, en: string | null | undefined) => string
  isEnglish: boolean
  isPortuguese: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const STORAGE_KEY = 'family-finances-language'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  // Load language preference from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'pt') {
      setLanguageState(stored)
    }
  }, [])

  // Save language preference to localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(STORAGE_KEY, lang)
  }

  // Translation helper function
  // Returns PT if language is Portuguese, EN if English
  // Falls back to the other language if the preferred one is null/undefined
  const t = (pt: string | null | undefined, en: string | null | undefined): string => {
    if (language === 'en') {
      return en || pt || ''
    }
    return pt || en || ''
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isEnglish: language === 'en',
        isPortuguese: language === 'pt',
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Language toggle button component
export function LanguageToggle({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useLanguage()

  return (
    <button
      onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
        bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300
        hover:bg-indigo-200 dark:hover:bg-indigo-800/40 transition-colors ${className}`}
      title={language === 'pt' ? 'Switch to English' : 'Mudar para Português'}
    >
      <span className={language === 'pt' ? 'font-bold' : 'opacity-50'}>PT</span>
      <span className="text-indigo-400 dark:text-indigo-500">/</span>
      <span className={language === 'en' ? 'font-bold' : 'opacity-50'}>EN</span>
    </button>
  )
}

// Static translations for common UI elements
export const translations = {
  // Navigation
  transactions: { pt: 'Transações', en: 'Transactions' },
  categories: { pt: 'Categorias', en: 'Categories' },
  rules: { pt: 'Regras', en: 'Rules' },
  stats: { pt: 'Estatísticas', en: 'Statistics' },
  settings: { pt: 'Definições', en: 'Settings' },
  cashFlow: { pt: 'Cash Flow', en: 'Cash Flow' },

  // Actions
  import: { pt: 'Importar', en: 'Import' },
  export: { pt: 'Exportar', en: 'Export' },
  save: { pt: 'Guardar', en: 'Save' },
  cancel: { pt: 'Cancelar', en: 'Cancel' },
  delete: { pt: 'Apagar', en: 'Delete' },
  edit: { pt: 'Editar', en: 'Edit' },
  add: { pt: 'Adicionar', en: 'Add' },
  filter: { pt: 'Filtrar', en: 'Filter' },
  search: { pt: 'Pesquisar', en: 'Search' },
  clear: { pt: 'Limpar', en: 'Clear' },
  apply: { pt: 'Aplicar', en: 'Apply' },

  // Status
  pending: { pt: 'Pendente', en: 'Pending' },
  categorized: { pt: 'Categorizado', en: 'Categorized' },
  flagged: { pt: 'Marcado', en: 'Flagged' },
  all: { pt: 'Todos', en: 'All' },

  // Form labels
  majorCategory: { pt: 'Categoria Principal', en: 'Major Category' },
  category: { pt: 'Categoria', en: 'Category' },
  subCategory: { pt: 'Subcategoria', en: 'Subcategory' },
  description: { pt: 'Descrição', en: 'Description' },
  amount: { pt: 'Montante', en: 'Amount' },
  date: { pt: 'Data', en: 'Date' },
  origin: { pt: 'Origem', en: 'Origin' },
  bank: { pt: 'Banco', en: 'Bank' },
  notes: { pt: 'Notas', en: 'Notes' },
  tags: { pt: 'Tags', en: 'Tags' },

  // Budget categories
  needs: { pt: 'Necessidades (50%)', en: 'Needs (50%)' },
  wants: { pt: 'Desejos (30%)', en: 'Wants (30%)' },
  savings: { pt: 'Poupança (20%)', en: 'Savings (20%)' },

  // Messages
  noTransactions: { pt: 'Sem transações', en: 'No transactions' },
  loading: { pt: 'A carregar...', en: 'Loading...' },
  error: { pt: 'Erro', en: 'Error' },
  success: { pt: 'Sucesso', en: 'Success' },

  // Pagination
  showing: { pt: 'A mostrar', en: 'Showing' },
  of: { pt: 'de', en: 'of' },
  page: { pt: 'Página', en: 'Page' },
  perPage: { pt: 'por página', en: 'per page' },
  previous: { pt: 'Anterior', en: 'Previous' },
  next: { pt: 'Próxima', en: 'Next' },
}

// Hook for static translations
export function useTranslations() {
  const { language } = useLanguage()

  return (key: keyof typeof translations): string => {
    return translations[key][language]
  }
}
