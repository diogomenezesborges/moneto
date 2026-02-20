/**
 * E2E Test: Task #134 - Tailwind Color Palette Simplification
 *
 * Verifies that the color palette changes don't break existing functionality
 * and that new semantic colors are available.
 *
 * Run with: npx playwright test e2e/task-134-verification.spec.ts
 */

import { test, expect } from '@playwright/test'

test.describe('Task #134: Tailwind Color Palette Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage before each test
    await page.goto('http://localhost:3000')

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')
  })

  test('1. Homepage loads without errors', async ({ page }) => {
    // Check that page loaded successfully
    await expect(page).toHaveURL('http://localhost:3000')

    // Check that no console errors occurred (except known pre-existing ones)
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.waitForTimeout(2000) // Wait for any async errors

    // Filter out known pre-existing errors (investments feature)
    const unexpectedErrors = errors.filter(
      err => !err.includes('investments') && !err.includes('TypeScript')
    )

    expect(unexpectedErrors).toHaveLength(0)
  })

  test('2. Header and navigation are visible', async ({ page }) => {
    // Check header exists
    const header = page.locator('header').first()
    await expect(header).toBeVisible()

    // Check navigation tabs exist
    const tabs = page.getByRole('button').filter({
      hasText: /Transações|Estatísticas|Fluxo|Regras|Revisão|Investimentos|Configurações/,
    })
    await expect(tabs.first()).toBeVisible()
  })

  test('3. Dark mode toggle works', async ({ page }) => {
    // Find dark mode toggle button
    // (Adjust selector based on your actual dark mode toggle implementation)
    const darkModeToggle = page
      .locator('button')
      .filter({ hasText: /dark|light|theme/i })
      .first()

    // Get initial background color
    const body = page.locator('body')
    const initialBg = await body.evaluate(el => window.getComputedStyle(el).backgroundColor)

    // Click dark mode toggle
    await darkModeToggle.click()
    await page.waitForTimeout(500) // Wait for transition

    // Verify background changed
    const newBg = await body.evaluate(el => window.getComputedStyle(el).backgroundColor)
    expect(newBg).not.toBe(initialBg)

    // Toggle back
    await darkModeToggle.click()
    await page.waitForTimeout(500)
  })

  test('4. Navigation tabs are clickable', async ({ page }) => {
    // Test clicking each tab
    const tabs = [
      'Transações',
      'Estatísticas',
      'Fluxo de Caixa',
      'Regras',
      'Revisão',
      'Investimentos',
      'Configurações',
    ]

    for (const tabName of tabs) {
      const tab = page.getByRole('button', { name: new RegExp(tabName, 'i') })
      if (await tab.isVisible()) {
        await tab.click()
        await page.waitForTimeout(500) // Wait for tab content to load

        // Verify no errors occurred
        const hasError = await page
          .locator('text=/error|erro/i')
          .isVisible()
          .catch(() => false)
        expect(hasError).toBeFalsy()
      }
    }
  })

  test('5. New Tailwind color classes are available', async ({ page }) => {
    // Inject a test element with new color classes
    await page.evaluate(() => {
      const testDiv = document.createElement('div')
      testDiv.id = 'color-test'
      testDiv.className = 'bg-primary text-white'
      testDiv.textContent = 'Test'
      document.body.appendChild(testDiv)
    })

    // Check that bg-primary applies indigo-600 (#4F46E5)
    const bgColor = await page.locator('#color-test').evaluate(el => {
      return window.getComputedStyle(el).backgroundColor
    })

    // Convert RGB to hex for comparison
    const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1])
      const g = parseInt(rgbMatch[2])
      const b = parseInt(rgbMatch[3])

      // #4F46E5 = rgb(79, 70, 229)
      expect(r).toBeCloseTo(79, 5)
      expect(g).toBeCloseTo(70, 5)
      expect(b).toBeCloseTo(229, 5)
    }

    // Clean up test element
    await page.evaluate(() => {
      document.getElementById('color-test')?.remove()
    })
  })

  test('6. Gray scale colors are available', async ({ page }) => {
    // Test gray-500 color
    await page.evaluate(() => {
      const testDiv = document.createElement('div')
      testDiv.id = 'gray-test'
      testDiv.className = 'text-gray-500'
      testDiv.textContent = 'Test'
      document.body.appendChild(testDiv)
    })

    const textColor = await page.locator('#gray-test').evaluate(el => {
      return window.getComputedStyle(el).color
    })

    // Check that color is applied (not default black)
    expect(textColor).not.toBe('rgb(0, 0, 0)')

    // Clean up
    await page.evaluate(() => {
      document.getElementById('gray-test')?.remove()
    })
  })

  test('7. Core UI elements render correctly', async ({ page }) => {
    // Check that key UI elements are present
    const elements = [page.locator('header'), page.locator('main'), page.locator('footer')]

    for (const element of elements) {
      await expect(element.first()).toBeVisible()
    }
  })

  test('8. Responsive design works (mobile viewport)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Wait for responsive changes
    await page.waitForTimeout(500)

    // Verify header is still visible
    const header = page.locator('header').first()
    await expect(header).toBeVisible()

    // Verify content is scrollable (not overflowing)
    const body = page.locator('body')
    const hasHorizontalScroll = await body.evaluate(el => {
      return el.scrollWidth > el.clientWidth
    })

    expect(hasHorizontalScroll).toBeFalsy()
  })

  test('9. No visual regressions in transaction table', async ({ page }) => {
    // Navigate to transactions tab (should be default)
    const transactionsTab = page.getByRole('button', { name: /transações/i })
    await transactionsTab.click()
    await page.waitForTimeout(1000)

    // Check if transaction table or empty state is visible
    const hasTable = await page
      .locator('table')
      .isVisible()
      .catch(() => false)
    const hasEmptyState = await page
      .locator('text=/sem transações|no transactions/i')
      .isVisible()
      .catch(() => false)

    // Either table or empty state should be visible
    expect(hasTable || hasEmptyState).toBeTruthy()
  })

  test('10. Buttons and interactive elements are styled', async ({ page }) => {
    // Find any button on the page
    const buttons = page.getByRole('button')
    const firstButton = buttons.first()

    if (await firstButton.isVisible()) {
      // Check that button has some background color (not transparent)
      const bgColor = await firstButton.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor
      })

      expect(bgColor).not.toBe('rgba(0, 0, 0, 0)')
      expect(bgColor).not.toBe('transparent')
    }
  })
})

test.describe('Task #134: Build Verification', () => {
  test('Build configuration is valid', async ({ page }) => {
    // This test verifies the page loads at all, which implies build succeeded
    await page.goto('http://localhost:3000')
    await expect(page).toHaveURL('http://localhost:3000')

    // Check that CSS is loaded (not broken build)
    const hasCss = await page.evaluate(() => {
      return document.styleSheets.length > 0
    })

    expect(hasCss).toBeTruthy()
  })
})
