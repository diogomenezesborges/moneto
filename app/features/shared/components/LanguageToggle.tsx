'use client'

import { Globe } from 'lucide-react'

interface LanguageToggleProps {
  language: 'pt' | 'en'
  onChange: (language: 'pt' | 'en') => void
}

export function LanguageToggle({ language, onChange }: LanguageToggleProps) {
  return (
    <button
      onClick={() => onChange(language === 'pt' ? 'en' : 'pt')}
      className="flex items-center gap-2 px-3 min-h-[44px] rounded-xl bg-white dark:bg-slate-700 border-2 border-indigo-200 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-600 transition-colors text-sm font-semibold"
      title={language === 'en' ? 'Switch to Portuguese' : 'Mudar para Inglês'}
    >
      <Globe size={16} />
      <span className="uppercase">{language}</span>
    </button>
  )
}
