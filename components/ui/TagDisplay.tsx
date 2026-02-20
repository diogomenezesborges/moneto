'use client'

import { X, Hash, Tag } from 'lucide-react'

interface TagDisplayProps {
  tags: string[]
  onRemove?: (tag: string) => void
  size?: 'sm' | 'md' | 'lg'
  language?: 'pt' | 'en'
  maxDisplay?: number
  className?: string
  showNamespace?: boolean
  variant?: 'default' | 'outline' | 'minimal'
}

/**
 * Phase 0 Design System - Tag Colors (Monochromatic Single Neutral Style)
 *
 * Issue #145: All tags now use a single neutral gray color scheme (muted semantic token).
 * Only the dot indicator color varies by namespace for visual distinction.
 * No gradients, following CategoryBadge.tsx pattern.
 */
const TAG_COLORS: Record<string, { dot: string }> = {
  vehicle: { dot: 'bg-blue-500' },
  trip: { dot: 'bg-emerald-500' },
  provider: { dot: 'bg-violet-500' },
  platform: { dot: 'bg-amber-500' },
  occasion: { dot: 'bg-rose-500' },
  recipient: { dot: 'bg-pink-500' },
  sport: { dot: 'bg-cyan-500' },
  type: { dot: 'bg-gray-500' },
  utility: { dot: 'bg-sky-500' },
  service: { dot: 'bg-indigo-500' },
  project: { dot: 'bg-purple-500' },
  reimbursable: { dot: 'bg-teal-500' },
  bank: { dot: 'bg-slate-500' },
  location: { dot: 'bg-stone-500' },
  asset: { dot: 'bg-lime-500' },
}

// Shared monochromatic style for all tags
const SHARED_TAG_STYLE = {
  bg: 'bg-muted/50 dark:bg-muted/30',
  text: 'text-muted-foreground',
  border: 'border-border',
  borderHover: 'hover:border-muted-foreground/50',
  shadow: 'hover:shadow-md',
}

// Human-readable labels for tag values
const TAG_LABELS: Record<string, { pt: string; en: string }> = {
  // Vehicle
  'vehicle:carro': { pt: 'Carro', en: 'Car' },
  'vehicle:mota': { pt: 'Mota', en: 'Motorcycle' },
  'vehicle:autocaravana': { pt: 'Autocaravana', en: 'Campervan' },

  // Trips
  'trip:croatia': { pt: 'Croácia', en: 'Croatia' },
  'trip:tuscany': { pt: 'Toscana', en: 'Tuscany' },
  'trip:mallorca': { pt: 'Maiorca', en: 'Mallorca' },
  'trip:south-america': { pt: 'América do Sul', en: 'South America' },
  'trip:algarve-25': { pt: 'Algarve 25', en: 'Algarve 25' },
  'trip:milan-como': { pt: 'Milão/Como', en: 'Milan/Como' },

  // Providers
  'provider:sgf': { pt: 'SGF', en: 'SGF' },
  'provider:ar': { pt: 'AR', en: 'AR' },
  'provider:casa-investimentos': { pt: 'Casa Inv.', en: 'Casa Inv.' },

  // Platforms
  'platform:olx': { pt: 'OLX', en: 'OLX' },
  'platform:vinted': { pt: 'Vinted', en: 'Vinted' },

  // Occasions
  'occasion:natal': { pt: 'Natal', en: 'Christmas' },
  'occasion:aniversario': { pt: 'Aniversário', en: 'Birthday' },
  'occasion:casamento': { pt: 'Casamento', en: 'Wedding' },

  // Recipients
  'recipient:child': { pt: 'Child', en: 'Child' },
  'recipient:family': { pt: 'Family', en: 'Family' },

  // Sports
  'sport:yoga': { pt: 'Yoga', en: 'Yoga' },
  'sport:ginasio': { pt: 'Ginásio', en: 'Gym' },
  'sport:padel': { pt: 'Padel', en: 'Padel' },
  'sport:golfe': { pt: 'Golfe', en: 'Golf' },
  'sport:futebol': { pt: 'Futebol', en: 'Football' },
  'sport:corrida': { pt: 'Corrida', en: 'Running' },

  // Types
  'type:irs': { pt: 'IRS', en: 'Tax' },
  'type:fine': { pt: 'Multa', en: 'Fine' },
  'type:bank-fee': { pt: 'Comissão', en: 'Bank Fee' },
  'type:cash-withdrawal': { pt: 'Levantamento', en: 'Withdrawal' },
  'type:decoracao': { pt: 'Decoração', en: 'Decoration' },
  'type:beleza': { pt: 'Beleza', en: 'Beauty' },
  'type:livros': { pt: 'Livros', en: 'Books' },
  'type:formacao': { pt: 'Formação', en: 'Training' },

  // Utilities
  'utility:agua': { pt: 'Água', en: 'Water' },
  'utility:eletricidade': { pt: 'Electricidade', en: 'Electricity' },
  'utility:gas': { pt: 'Gás', en: 'Gas' },
  'utility:luz-gas': { pt: 'Luz+Gás', en: 'Elec+Gas' },

  // Services
  'service:spotify': { pt: 'Spotify', en: 'Spotify' },
  'service:amazon': { pt: 'Amazon', en: 'Amazon' },
  'service:google': { pt: 'Google', en: 'Google' },
  'service:netflix': { pt: 'Netflix', en: 'Netflix' },

  // Projects
  'project:brides': { pt: 'Brides', en: 'Brides' },
  'project:medium': { pt: 'Medium', en: 'Medium' },
  'project:y': { pt: 'Projecto Y', en: 'Project Y' },

  // Reimbursable
  'reimbursable:yes': { pt: 'Reembolsável', en: 'Reimbursable' },

  // Location
  'location:trabalho': { pt: 'Trabalho', en: 'Work' },

  // Asset
  'asset:autocaravana': { pt: 'Autocaravana', en: 'Campervan' },
}

function parseTag(tag: string): { namespace: string; value: string } {
  const [namespace, value] = tag.split(':')
  return { namespace: namespace || '', value: value || tag }
}

function getTagLabel(tag: string, language: 'pt' | 'en'): string {
  const labels = TAG_LABELS[tag]
  if (labels) {
    return labels[language]
  }
  // Fallback: format the value nicely
  const { value } = parseTag(tag)
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ')
}

function getTagColor(tag: string): {
  bg: string
  text: string
  border: string
  borderHover: string
  dot: string
  shadow: string
} {
  const { namespace } = parseTag(tag)
  const namespaceColors = TAG_COLORS[namespace] || TAG_COLORS.type

  return {
    ...SHARED_TAG_STYLE,
    dot: namespaceColors.dot,
  }
}

export function TagDisplay({
  tags,
  onRemove,
  size = 'sm',
  language = 'pt',
  maxDisplay = 10,
  className = '',
  showNamespace = false,
  variant = 'default',
}: TagDisplayProps) {
  if (!tags || tags.length === 0) {
    return null
  }

  const displayTags = tags.slice(0, maxDisplay)
  const overflowCount = tags.length - maxDisplay

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-1 gap-1.5',
    md: 'text-xs px-2.5 py-1.5 gap-2',
    lg: 'text-sm px-3 py-2 gap-2.5',
  }

  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {displayTags.map(tag => {
        const colors = getTagColor(tag)
        const label = getTagLabel(tag, language)
        const { namespace } = parseTag(tag)

        const variantClasses = {
          default: `${colors.bg} ${colors.text} ${colors.border} ${colors.borderHover} border-2 ${colors.shadow}`,
          outline: `bg-transparent ${colors.text} ${colors.border} ${colors.borderHover} border-2 ${colors.shadow}`,
          minimal: `bg-transparent ${colors.text} border-none hover:${colors.bg}`,
        }

        return (
          <span
            key={tag}
            className={`inline-flex items-center rounded-full font-semibold
              transition-all duration-300 ease-in-out
              hover:scale-110 hover:-translate-y-0.5
              shadow-sm
              ${sizeClasses[size]} ${variantClasses[variant]}`}
            title={`${namespace}: ${label}`}
          >
            {/* Colored dot indicator for namespace */}
            <span className={`${dotSizes[size]} rounded-full ${colors.dot} shrink-0`} />
            {showNamespace && <span className="opacity-70 font-medium">{namespace}:</span>}
            <span className="font-bold">{label}</span>
            {onRemove && (
              <button
                onClick={e => {
                  e.stopPropagation()
                  onRemove(tag)
                }}
                className="ml-1 p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-all duration-200 hover:scale-125"
                aria-label={`Remove ${label}`}
              >
                <X size={size === 'sm' ? 10 : size === 'md' ? 12 : 14} />
              </button>
            )}
          </span>
        )
      })}
      {overflowCount > 0 && (
        <span
          className={`inline-flex items-center rounded-full border-2 font-bold
            ${sizeClasses[size]}
            ${SHARED_TAG_STYLE.bg}
            ${SHARED_TAG_STYLE.text}
            ${SHARED_TAG_STYLE.border}
            ${SHARED_TAG_STYLE.borderHover}
            transition-all duration-300 ease-in-out
            hover:scale-110 hover:-translate-y-0.5
            ${SHARED_TAG_STYLE.shadow}`}
          title={tags
            .slice(maxDisplay)
            .map(t => getTagLabel(t, language))
            .join(', ')}
        >
          +{overflowCount}
        </span>
      )}
    </div>
  )
}

// Compact single-line tag display for tables
export function TagBadges({
  tags,
  language = 'pt',
  maxDisplay = 3,
  className = '',
  showEmpty = true,
}: {
  tags: string[]
  language?: 'pt' | 'en'
  maxDisplay?: number
  className?: string
  showEmpty?: boolean
}) {
  if (!tags || tags.length === 0) {
    if (!showEmpty) return null
    return <span className="text-gray-400 dark:text-gray-500 text-[10px] italic">-</span>
  }

  return (
    <TagDisplay
      tags={tags}
      size="sm"
      language={language}
      maxDisplay={maxDisplay}
      className={className}
      variant="default"
    />
  )
}

// Tags header with icon - for form sections
export function TagsLabel({
  language = 'pt',
  className = '',
}: {
  language?: 'pt' | 'en'
  className?: string
}) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Tag size={14} className="text-gray-400" />
      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {language === 'en' ? 'Tags' : 'Tags'}
      </span>
    </div>
  )
}

// Namespace legend for showing all tag types
export function TagNamespaceLegend({
  namespaces,
  language = 'pt',
  className = '',
}: {
  namespaces?: string[]
  language?: 'pt' | 'en'
  className?: string
}) {
  const defaultNamespaces = [
    'type',
    'vehicle',
    'trip',
    'provider',
    'platform',
    'occasion',
    'recipient',
    'sport',
    'utility',
    'service',
    'project',
    'reimbursable',
  ]
  const ns = namespaces || defaultNamespaces

  const namespaceLabels: Record<string, { pt: string; en: string }> = {
    type: { pt: 'Tipo', en: 'Type' },
    vehicle: { pt: 'Veículo', en: 'Vehicle' },
    trip: { pt: 'Viagem', en: 'Trip' },
    provider: { pt: 'Fornecedor', en: 'Provider' },
    platform: { pt: 'Plataforma', en: 'Platform' },
    occasion: { pt: 'Ocasião', en: 'Occasion' },
    recipient: { pt: 'Destinatário', en: 'Recipient' },
    sport: { pt: 'Desporto', en: 'Sport' },
    utility: { pt: 'Utilidade', en: 'Utility' },
    service: { pt: 'Serviço', en: 'Service' },
    project: { pt: 'Projeto', en: 'Project' },
    reimbursable: { pt: 'Reembolsável', en: 'Reimbursable' },
    bank: { pt: 'Banco', en: 'Bank' },
    location: { pt: 'Local', en: 'Location' },
    asset: { pt: 'Ativo', en: 'Asset' },
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {ns.map(namespace => {
        const colors = TAG_COLORS[namespace] || TAG_COLORS.type
        const label = namespaceLabels[namespace]?.[language] || namespace
        return (
          <div
            key={namespace}
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"
          >
            <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
            <span>{label}</span>
          </div>
        )
      })}
    </div>
  )
}
