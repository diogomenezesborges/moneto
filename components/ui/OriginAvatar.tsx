'use client'

interface OriginAvatarProps {
  origin: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function OriginAvatar({ origin, size = 'md', showLabel = false }: OriginAvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-lg',
    lg: 'w-10 h-10 text-xl',
  }

  const getAvatarContent = () => {
    // Generate a consistent initial from the origin name
    const initial = origin.charAt(0).toUpperCase()

    switch (origin.toLowerCase()) {
      case 'personal':
        return (
          <div
            className={`${sizeClasses[size]} rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-avatar-user-1/30 dark:border-avatar-user-1/40 flex items-center justify-center font-bold text-avatar-user-1-foreground`}
          >
            {initial}
          </div>
        )
      case 'joint':
        return (
          <div
            className={`${sizeClasses[size]} rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-avatar-user-2/30 dark:border-avatar-user-2/40 flex items-center justify-center font-bold text-avatar-user-2-foreground`}
          >
            {initial}
          </div>
        )
      case 'family':
        return (
          <div
            className={`${sizeClasses[size]} rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-avatar-user-3/30 dark:border-avatar-user-3/40 flex items-center justify-center font-bold text-avatar-user-3-foreground`}
          >
            {initial}
          </div>
        )
      case 'couple':
        return (
          <div
            className={`${sizeClasses[size]} rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-avatar-couple/30 dark:border-avatar-couple/40 flex items-center justify-center`}
          >
            {initial}
          </div>
        )
      default:
        return (
          <div
            className={`${sizeClasses[size]} rounded-full bg-gray-100 dark:bg-gray-500/20 border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center font-bold text-gray-600 dark:text-gray-400`}
          >
            {initial}
          </div>
        )
    }
  }

  if (showLabel) {
    return (
      <div className="inline-flex items-center gap-2">
        {getAvatarContent()}
        <span className="text-sm font-medium text-foreground">{origin}</span>
      </div>
    )
  }

  return getAvatarContent()
}
