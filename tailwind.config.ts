import type { Config } from 'tailwindcss'

/**
 * Phase 0: Professional Design System Overhaul
 * Simplified color palette: 4 semantic colors + neutral gray scale
 * Stripe/Linear/Vercel aesthetic - Issue #134
 */
const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ====================================================================
        // SEMANTIC COLORS (Phase 0)
        // ====================================================================

        // Primary: Indigo (Actions, links, brand)
        primary: {
          DEFAULT: '#4F46E5', // indigo-600
          hover: '#4338CA', // indigo-700
          light: '#EEF2FF', // indigo-50
          dark: '#312E81', // indigo-900
        },

        // Success: Emerald (Success states, positive actions)
        success: {
          DEFAULT: '#10B981', // emerald-500
          hover: '#059669', // emerald-600
          light: '#ECFDF5', // emerald-50
          dark: '#064E3B', // emerald-900
        },

        // Danger: Red (Errors, destructive actions)
        danger: {
          DEFAULT: '#EF4444', // red-500
          hover: '#DC2626', // red-600
          light: '#FEF2F2', // red-50
          dark: '#7F1D1D', // red-900
        },

        // Warning: Amber (Warnings, caution states)
        warning: {
          DEFAULT: '#F59E0B', // amber-500
          hover: '#D97706', // amber-600
          light: '#FFFBEB', // amber-50
          dark: '#78350F', // amber-900
        },

        // ====================================================================
        // USER AVATAR COLORS (Phase 0.17 - Issue B)
        // ====================================================================

        // User-specific avatar colors (distinct for user identification)
        'avatar-user-1': {
          DEFAULT: '#4F46E5', // indigo-600 (User 1)
          foreground: '#312E81', // indigo-900 (text on User 1 avatar)
        },
        'avatar-user-2': {
          DEFAULT: '#EC4899', // pink-500 (User 2)
          foreground: '#831843', // pink-900 (text on User 2 avatar)
        },
        'avatar-user-3': {
          DEFAULT: '#F59E0B', // yellow-500 (User 3)
          foreground: '#78350F', // yellow-900 (text on User 3 avatar)
        },
        'avatar-couple': {
          DEFAULT: '#A855F7', // purple-500 (Couple)
          foreground: '#581C87', // purple-900 (text on Couple avatar)
        },

        // ====================================================================
        // NEUTRAL COLORS (Phase 0)
        // ====================================================================

        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },

        // Semantic aliases for common use cases
        background: {
          DEFAULT: '#FFFFFF',
          dark: '#111827', // gray-900
        },
        foreground: {
          DEFAULT: '#111827', // gray-900
          dark: '#FFFFFF',
        },
        border: {
          DEFAULT: '#E5E7EB', // gray-200 (light mode)
          dark: '#374151', // gray-700 (dark mode)
        },
        input: {
          DEFAULT: '#E5E7EB', // gray-200 (light mode)
          dark: '#374151', // gray-700 (dark mode)
        },
        ring: {
          DEFAULT: '#4F46E5', // primary (light mode)
          dark: '#818CF8', // lighter indigo for dark mode
        },
      },
    },
  },
  plugins: [],
}
export default config
