'use client'

import { X, Download, FileText, CheckCircle } from 'lucide-react'
import { useState } from 'react'

type ExportFormat = 'xlsx' | 'csv' | 'json'

interface ExportDialogProps {
  isOpen: boolean
  transactionCount: number
  language: 'pt' | 'en'
  onClose: () => void
  onExport: (format: ExportFormat) => void
}

export function ExportDialog({
  isOpen,
  transactionCount,
  language,
  onClose,
  onExport,
}: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('xlsx')
  const [exported, setExported] = useState(false)

  if (!isOpen) return null

  const handleExport = () => {
    onExport(selectedFormat)
    setExported(true)

    // Auto-close after showing success
    setTimeout(() => {
      setExported(false)
      onClose()
    }, 2000)
  }

  const handleClose = () => {
    setExported(false)
    onClose()
  }

  const formats = [
    {
      value: 'xlsx' as ExportFormat,
      name: 'Excel (.xlsx)',
      description:
        language === 'en'
          ? 'Best for analysis in Excel or Google Sheets'
          : 'Melhor para análise no Excel ou Google Sheets',
      icon: '📊',
    },
    {
      value: 'csv' as ExportFormat,
      name: 'CSV (.csv)',
      description:
        language === 'en'
          ? 'Universal format compatible with most tools'
          : 'Formato universal compatível com a maioria das ferramentas',
      icon: '📄',
    },
    {
      value: 'json' as ExportFormat,
      name: 'JSON (.json)',
      description:
        language === 'en'
          ? 'For developers and data processing'
          : 'Para desenvolvedores e processamento de dados',
      icon: '{ }',
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h2
              id="export-dialog-title"
              className="text-2xl font-bold text-indigo-900 dark:text-white"
            >
              {language === 'en' ? 'Export Transactions' : 'Exportar Transações'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
              {language === 'en'
                ? `Export ${transactionCount} transaction(s)`
                : `Exportar ${transactionCount} transação(ões)`}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
            aria-label={language === 'en' ? 'Close' : 'Fechar'}
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {!exported ? (
            <>
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-bold text-indigo-700 dark:text-indigo-400 mb-3">
                  {language === 'en' ? 'Select Format' : 'Selecionar Formato'}
                </label>
                <div className="space-y-2">
                  {formats.map(format => (
                    <button
                      key={format.value}
                      onClick={() => setSelectedFormat(format.value)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        selectedFormat === format.value
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 dark:border-indigo-400'
                          : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-600'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{format.icon}</span>
                        <div className="flex-1">
                          <p
                            className={`text-sm font-semibold ${
                              selectedFormat === format.value
                                ? 'text-indigo-900 dark:text-white'
                                : 'text-gray-900 dark:text-slate-200'
                            }`}
                          >
                            {format.name}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              selectedFormat === format.value
                                ? 'text-indigo-600 dark:text-indigo-300'
                                : 'text-gray-600 dark:text-slate-400'
                            }`}
                          >
                            {format.description}
                          </p>
                        </div>
                        {selectedFormat === format.value && (
                          <CheckCircle
                            size={20}
                            className="text-indigo-600 dark:text-indigo-400 flex-shrink-0"
                          />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {language === 'en' ? (
                    <>
                      <strong>Note:</strong> Export includes all currently filtered transactions.
                      The file will be downloaded to your default downloads folder.
                    </>
                  ) : (
                    <>
                      <strong>Nota:</strong> A exportação inclui todas as transações filtradas
                      atualmente. O arquivo será baixado para sua pasta de downloads padrão.
                    </>
                  )}
                </p>
              </div>
            </>
          ) : (
            /* Success Message */
            <div className="p-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle
                  size={32}
                  className="text-green-600 dark:text-green-400 flex-shrink-0"
                />
                <div>
                  <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                    {language === 'en' ? 'Export Successful!' : 'Exportação Bem-Sucedida!'}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {language === 'en' ? 'File has been downloaded' : 'Arquivo foi baixado'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!exported && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-slate-700">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            >
              {language === 'en' ? 'Cancel' : 'Cancelar'}
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <Download size={16} />
              {language === 'en' ? 'Export' : 'Exportar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
