---
name: memoria-design-system
description: Complete design system with dual-theme support (light/dark) for AI conversation memory applications. Use when building UI components, implementing theme switching, or maintaining visual consistency.
auto_detect: false
always_active: false
---

# Memoria Design System

## Purpose

Provides a comprehensive, dual-theme design system for AI conversation memory and knowledge management applications. Supports seamless light/dark mode switching with semantic color tokens, consistent typography, spacing, and component patterns.

## When to Use

- Building new UI components that need theme support
- Implementing theme switching functionality
- Maintaining visual consistency across features
- Designing layouts with proper spacing and typography
- Creating animations and transitions

## Design Principles

1. **Semantic Theming** - Colors have semantic meaning (primary, success, warning) that adapts to theme
2. **Accessibility First** - WCAG 2.1 AA contrast ratios in both themes
3. **Smooth Transitions** - 200ms theme switching with reduced motion support
4. **Consistent Spacing** - 4px base unit for predictable layouts
5. **Type Hierarchy** - Clear visual hierarchy through size, weight, and line height

---

## Color System

### Semantic Color Tokens

**Light Theme:**

```css
--background: 0 0% 100%; /* White */
--surface: 0 0% 98%; /* Off-white */
--surface-elevated: 0 0% 95%; /* Light gray */
--border: 0 0% 89%; /* Gray border */
--border-subtle: 0 0% 94%; /* Subtle border */

--text-primary: 0 0% 9%; /* Near black */
--text-secondary: 0 0% 45%; /* Medium gray */
--text-tertiary: 0 0% 64%; /* Light gray */
--text-inverse: 0 0% 98%; /* Off-white (for dark backgrounds) */

--primary: 221 83% 53%; /* Blue */
--primary-hover: 221 83% 48%; /* Darker blue */
--primary-text: 0 0% 100%; /* White text on primary */

--success: 142 76% 36%; /* Green */
--success-hover: 142 76% 31%;
--success-bg: 142 76% 95%; /* Light green background */

--warning: 38 92% 50%; /* Orange */
--warning-hover: 38 92% 45%;
--warning-bg: 38 92% 95%;

--error: 0 84% 60%; /* Red */
--error-hover: 0 84% 55%;
--error-bg: 0 84% 95%;

--info: 199 89% 48%; /* Cyan */
--info-hover: 199 89% 43%;
--info-bg: 199 89% 95%;
```

**Dark Theme:**

```css
--background: 0 0% 10%; /* Dark gray */
--surface: 0 0% 14%; /* Lighter dark gray */
--surface-elevated: 0 0% 18%; /* Elevated surface */
--border: 0 0% 27%; /* Gray border */
--border-subtle: 0 0% 20%; /* Subtle border */

--text-primary: 0 0% 90%; /* Off-white */
--text-secondary: 0 0% 64%; /* Medium gray */
--text-tertiary: 0 0% 45%; /* Darker gray */
--text-inverse: 0 0% 9%; /* Near black (for light backgrounds) */

--primary: 221 83% 53%; /* Blue (same hue as light) */
--primary-hover: 221 83% 58%; /* Lighter blue */
--primary-text: 0 0% 100%; /* White text on primary */

--success: 142 71% 45%; /* Green (adjusted saturation) */
--success-hover: 142 71% 50%;
--success-bg: 142 50% 15%; /* Dark green background */

--warning: 38 92% 50%; /* Orange */
--warning-hover: 38 92% 55%;
--warning-bg: 38 60% 15%;

--error: 0 84% 60%; /* Red */
--error-hover: 0 84% 65%;
--error-bg: 0 50% 15%;

--info: 199 89% 48%; /* Cyan */
--info-hover: 199 89% 53%;
--info-bg: 199 60% 15%;
```

---

## Typography

### Font Families

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
```

### Type Scale

```css
/* Size | Line Height | Letter Spacing | Usage */
--text-xs: 0.75rem; /* 12px */
--leading-xs: 1rem; /* 16px */
--tracking-xs: 0.05em; /* Tags, labels */
--text-sm: 0.875rem; /* 14px */
--leading-sm: 1.25rem; /* 20px */
--tracking-sm: 0.025em; /* Body small */
--text-base: 1rem; /* 16px */
--leading-base: 1.5rem; /* 24px */
--tracking-base: 0; /* Body */
--text-lg: 1.125rem; /* 18px */
--leading-lg: 1.75rem; /* 28px */
--tracking-lg: -0.01em; /* Subheading */
--text-xl: 1.25rem; /* 20px */
--leading-xl: 1.75rem; /* 28px */
--tracking-xl: -0.02em; /* Heading 3 */
--text-2xl: 1.5rem; /* 24px */
--leading-2xl: 2rem; /* 32px */
--tracking-2xl: -0.03em; /* Heading 2 */
--text-3xl: 1.875rem; /* 30px */
--leading-3xl: 2.25rem; /* 36px */
--tracking-3xl: -0.04em; /* Heading 1 */
```

### Font Weights

```css
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

---

## Spacing System

**Base Unit:** 4px (0.25rem)

```css
--spacing-0: 0;
--spacing-1: 0.25rem; /* 4px */
--spacing-2: 0.5rem; /* 8px */
--spacing-3: 0.75rem; /* 12px */
--spacing-4: 1rem; /* 16px */
--spacing-5: 1.25rem; /* 20px */
--spacing-6: 1.5rem; /* 24px */
--spacing-8: 2rem; /* 32px */
--spacing-10: 2.5rem; /* 40px */
--spacing-12: 3rem; /* 48px */
```

---

## Border Radius

```css
--radius-none: 0;
--radius-sm: 0.125rem; /* 2px */
--radius-md: 0.375rem; /* 6px */
--radius-lg: 0.5rem; /* 8px */
--radius-xl: 0.75rem; /* 12px */
--radius-full: 9999px; /* Pill shape */
```

---

## Animation System

### Timing Functions

```css
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Durations

```css
--duration-fast: 150ms;
--duration-base: 200ms;
--duration-slow: 300ms;
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Component Patterns

### Button Components

**Primary Button:**

```tsx
<button
  className="
  px-4 py-2
  bg-primary text-primary-text
  hover:bg-primary-hover
  focus:ring-2 focus:ring-primary
  rounded-lg font-medium
  transition-colors
"
>
  Primary Action
</button>
```

**Secondary Button:**

```tsx
<button
  className="
  px-4 py-2
  bg-surface border border-border
  text-text-primary
  hover:bg-surface-elevated
  rounded-lg font-medium
  transition-colors
"
>
  Secondary Action
</button>
```

### Input Components

**Text Input:**

```tsx
<input
  type="text"
  className="
    w-full px-3 py-2
    bg-surface border border-border
    text-text-primary placeholder:text-text-tertiary
    rounded-lg
    focus:ring-2 focus:ring-primary
    transition-colors
  "
  placeholder="Enter text..."
/>
```

### Card Component

```tsx
<div
  className="
  bg-surface border border-border
  rounded-xl p-6
  shadow-md hover:shadow-lg
  transition-shadow
"
>
  <h3 className="text-xl font-semibold text-text-primary mb-2">Card Title</h3>
  <p className="text-sm text-text-secondary">Card description...</p>
</div>
```

### Badge Component

```tsx
<span
  className="
  inline-flex items-center
  px-2.5 py-0.5
  bg-success-bg text-success
  text-xs font-medium
  rounded-full
"
>
  Success
</span>
```

---

## Theme Implementation

### Theme Toggle Hook

```typescript
import { useEffect, useState } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'

    const initialTheme = stored || systemPreference
    setTheme(initialTheme)
    document.documentElement.classList.toggle('dark', initialTheme === 'dark')
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  return { theme, toggleTheme }
}
```

### Theme Toggle Component

```tsx
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 bg-surface border border-border hover:bg-surface-elevated rounded-lg transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5 text-text-secondary" />
      ) : (
        <Sun className="h-5 w-5 text-text-secondary" />
      )}
    </button>
  )
}
```

---

## Accessibility Guidelines

### Contrast Ratios (WCAG 2.1 AA)

- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- Both themes tested for compliance

### Focus Indicators

```css
.focus-visible:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}
```

---

**End of Memoria Design System Skill**
