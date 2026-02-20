'use client'

import { X, Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react'
import { useState, useRef } from 'react'

interface ImportDialogProps {
  isOpen: boolean
  language: 'pt' | 'en'
  onClose: () => void
  onImport: (
    file: File,
    origin: string,
    bank?: string
  ) => Promise<{
    success: boolean
    imported?: number
    duplicates?: number
    error?: string
  }>
}

export function ImportDialog({ isOpen, language, onClose, onImport }: ImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedOrigin, setSelectedOrigin] = useState<string>('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    imported?: number
    duplicates?: number
    error?: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setResult(null)
    }
  }

  const handleImport = async () => {
    if (!selectedFile || !selectedOrigin) return

    // RACE CONDITION GUARD: Prevent concurrent imports
    if (importing) {
      console.warn('Import already in progress, ignoring duplicate request')
      return
    }

    setImporting(true)
    setResult(null)

    // Store file reference before clearing state (to prevent race conditions)
    const fileToImport = selectedFile
    const originToImport = selectedOrigin

    // IMMEDIATE CLEANUP: Clear form immediately to prevent duplicate submissions
    setSelectedFile(null)
    setSelectedOrigin('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    try {
      const importResult = await onImport(fileToImport, originToImport)
      setResult(importResult)

      if (importResult.success) {
        // Auto-close dialog after showing success message
        setTimeout(() => {
          onClose()
          setResult(null)
        }, 3000)
      }
    } catch (error) {
      // On error, restore the form state so user can retry
      setSelectedFile(fileToImport)
      setSelectedOrigin(originToImport)

      setResult({
        success: false,
        error: 'Import failed unexpectedly',
      })
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    if (!importing) {
      setSelectedFile(null)
      setSelectedOrigin('')
      setResult(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h2
              id="import-dialog-title"
              className="text-2xl font-bold text-indigo-900 dark:text-white flex items-center gap-2"
            >
              <Download className="w-6 h-6" aria-hidden="true" />
              {language === 'en' ? 'Import Transactions' : 'Importar Transacoes'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
              {language === 'en' ? 'Upload transaction file' : 'Carregar arquivo de transacoes'}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={importing}
            className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
            aria-label={language === 'en' ? 'Close' : 'Fechar'}
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Origin Selection */}
          <div>
            <label
              htmlFor="origin-select"
              className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2"
            >
              {language === 'en' ? 'Origin *' : 'Origem *'}
            </label>
            <input
              id="origin-select"
              type="text"
              value={selectedOrigin}
              onChange={e => setSelectedOrigin(e.target.value)}
              disabled={importing}
              placeholder={
                language === 'en'
                  ? 'e.g., Personal, Joint, Business'
                  : 'ex: Pessoal, Conjunto, Negocio'
              }
              className="w-full px-3 py-2.5 text-sm font-medium border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* File Selection */}
          <div>
            <label
              htmlFor="file-upload"
              className="block w-full p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <div className="flex flex-col items-center gap-3">
                {selectedFile ? (
                  <>
                    <FileText size={48} className="text-gray-700 dark:text-gray-300" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload size={48} className="text-gray-400 dark:text-gray-500" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {language === 'en'
                          ? 'Click to select file'
                          : 'Clique para selecionar arquivo'}
                      </p>
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                        {language === 'en' ? 'CSV, XLSX, JSON, or PDF' : 'CSV, XLSX, JSON, ou PDF'}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.json,.pdf"
                onChange={handleFileSelect}
                disabled={importing}
                className="hidden"
              />
            </label>
          </div>

          {/* Result Message */}
          {result && (
            <div
              className={`p-4 rounded-xl border-2 ${
                result.success
                  ? 'bg-success/10 dark:bg-success/20 border-success/30 dark:border-success/40'
                  : 'bg-danger/10 dark:bg-danger/20 border-danger/30 dark:border-danger/40'
              }`}
              role="alert"
              aria-live="polite"
            >
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle
                    size={24}
                    className="text-green-600 dark:text-green-400 flex-shrink-0"
                  />
                ) : (
                  <AlertCircle size={24} className="text-red-600 dark:text-red-400 flex-shrink-0" />
                )}
                <div>
                  {result.success ? (
                    <>
                      <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                        {language === 'en' ? 'Import Successful!' : 'Importacao Bem-Sucedida!'}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        {language === 'en'
                          ? `Imported ${result.imported} transaction(s).`
                          : `Importado(s) ${result.imported} transacao(oes).`}
                        {result.duplicates && result.duplicates > 0 && (
                          <span className="block mt-1">
                            {language === 'en'
                              ? `Skipped ${result.duplicates} duplicate(s).`
                              : `${result.duplicates} duplicado(s) ignorado(s).`}
                          </span>
                        )}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                        {language === 'en' ? 'Import Failed' : 'Falha na Importacao'}
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {result.error ||
                          (language === 'en' ? 'Unknown error' : 'Erro desconhecido')}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl">
            <p className="text-xs text-gray-700 dark:text-gray-300">
              {language === 'en' ? (
                <>
                  <strong>Supported formats:</strong> CSV, XLSX/XLS, JSON, PDF (with AI). The
                  generic parser expects columns: Date, Description, Amount, Balance (optional).
                </>
              ) : (
                <>
                  <strong>Formatos suportados:</strong> CSV, XLSX/XLS, JSON, PDF (com IA). O parser
                  generico espera colunas: Data, Descricao, Valor, Saldo (opcional).
                </>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={handleClose}
            disabled={importing}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {result?.success
              ? language === 'en'
                ? 'Close'
                : 'Fechar'
              : language === 'en'
                ? 'Cancel'
                : 'Cancelar'}
          </button>
          {!result?.success && (
            <button
              onClick={handleImport}
              disabled={!selectedFile || !selectedOrigin || importing}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {importing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  {language === 'en' ? 'Importing...' : 'Importando...'}
                </>
              ) : (
                <>
                  <Upload size={16} />
                  {language === 'en' ? 'Import' : 'Importar'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
