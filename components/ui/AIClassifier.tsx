'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Info } from 'lucide-react'

interface AIClassifierProps {
  transactionId: string
  token: string
  onClassified: () => void
  className?: string
}

export function AIClassifier({
  transactionId,
  token,
  onClassified,
  className = '',
}: AIClassifierProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClassify = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/transactions/ai-classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ transactionId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'AI classification failed')
      }

      const data = await res.json()
      onClassified()

      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Classification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        onClick={handleClassify}
        disabled={loading}
        className="inline-flex items-center gap-1 px-2 py-1 min-h-[44px] text-xs font-medium text-white bg-primary hover:bg-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        title="Classify with AI"
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
        {loading ? 'Classifying...' : 'AI Classify'}
      </button>

      {error && (
        <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <Info size={12} />
          {error}
        </span>
      )}
    </div>
  )
}

interface ConfidenceBadgeProps {
  confidence: number | null
  reasoning?: string | null
  className?: string
}

export function ConfidenceBadge({ confidence, reasoning, className = '' }: ConfidenceBadgeProps) {
  if (confidence === null || confidence === undefined) {
    return null
  }

  const percentage = Math.round(confidence * 100)
  let bgColor = 'bg-success/10 dark:bg-success/20 text-success'
  let label = 'High'

  if (confidence < 0.5) {
    bgColor = 'bg-danger/10 dark:bg-danger/20 text-danger'
    label = 'Low'
  } else if (confidence < 0.7) {
    bgColor = 'bg-warning/10 dark:bg-warning/20 text-warning'
    label = 'Medium'
  }

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bgColor} ${className}`}
      title={reasoning || `AI Confidence: ${percentage}%`}
    >
      <Sparkles size={10} />
      <span>
        {label} ({percentage}%)
      </span>
      {reasoning && (
        <div className="group relative inline-block">
          <Info size={10} className="cursor-help" />
          <div className="invisible group-hover:visible absolute z-50 w-48 p-2 mt-1 text-xs bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded shadow-lg -left-20 border border-gray-700 dark:border-gray-300">
            {reasoning}
          </div>
        </div>
      )}
    </div>
  )
}

interface AIBatchClassifierProps {
  token: string
  onClassified: () => void
  className?: string
}

export function AIBatchClassifier({ token, onClassified, className = '' }: AIBatchClassifierProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ classified: number; lowConfidence: number } | null>(null)

  const handleBatchClassify = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)

      const res = await fetch('/api/transactions/ai-classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ batchMode: true }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Batch classification failed')
      }

      const data = await res.json()
      setResult({
        classified: data.classified || 0,
        lowConfidence: data.lowConfidence || 0,
      })
      onClassified()

      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Batch classification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`inline-flex flex-col gap-2 ${className}`}>
      <button
        onClick={handleBatchClassify}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        {loading ? 'Classifying...' : 'AI Classify Batch (up to 50)'}
      </button>

      {result && (
        <div className="text-xs text-green-600 dark:text-green-400 font-medium">
          ✓ Classified {result.classified} transactions
          {result.lowConfidence > 0 && ` (${result.lowConfidence} flagged as low confidence)`}
        </div>
      )}

      {error && (
        <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <Info size={12} />
          {error}
        </span>
      )}
    </div>
  )
}
