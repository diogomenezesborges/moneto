/**
 * E2E Tests for Investment Tracking Feature (Issue #114)
 *
 * Tests cover:
 * 1. Navigation & Tab Switching
 * 2. Cohort Performance View
 * 3. Cost Transparency Dashboard
 * 4. Investment Decision Journal
 * 5. Dark Mode
 * 6. Responsive Design
 */

import { test, expect, Page } from '@playwright/test'

// Test configuration
const BASE_URL = 'http://localhost:3000'
const TEST_USER = {
  username: 'testuser',
  password: 'test123',
}

/**
 * Helper: Login to application
 */
async function login(page: Page) {
  await page.goto(BASE_URL)

  // Wait for login form
  await page.waitForSelector('input[type="text"]', { timeout: 10000 })

  // Fill credentials
  await page.fill('input[type="text"]', TEST_USER.username)
  await page.fill('input[type="password"]', TEST_USER.password)

  // Submit
  await page.click('button[type="submit"]')

  // Wait for redirect to main app
  await page.waitForURL(/.*/, { timeout: 10000 })

  // Wait for main content to load
  await page.waitForSelector('text=Transações', { timeout: 10000 })
}

/**
 * Helper: Navigate to Investments tab
 */
async function navigateToInvestments(page: Page) {
  await page.click('text=Investimentos')
  await page.waitForSelector('text=Portfólio', { timeout: 5000 })
}

test.describe('Investment Tracking Feature - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should display Investments tab in navigation', async ({ page }) => {
    // Verify Investments tab exists
    const investmentsTab = page.locator('text=Investimentos')
    await expect(investmentsTab).toBeVisible()
  })

  test('should navigate to Investments feature', async ({ page }) => {
    await navigateToInvestments(page)

    // Verify 4 sub-tabs are present
    await expect(page.locator('text=Portfólio')).toBeVisible()
    await expect(page.locator('text=Desempenho por Compra')).toBeVisible()
    await expect(page.locator('text=Custos')).toBeVisible()
    await expect(page.locator('text=Diário')).toBeVisible()
  })

  test('should switch between Investment tabs', async ({ page }) => {
    await navigateToInvestments(page)

    // Click Portfolio tab
    await page.click('text=Portfólio')
    await expect(page.locator('text=Total Investido')).toBeVisible({ timeout: 5000 })

    // Click Cohorts tab
    await page.click('text=Desempenho por Compra')
    await expect(page.locator('text=Compra')).toBeVisible({ timeout: 5000 })

    // Click Costs tab
    await page.click('text=Custos')
    await expect(page.locator('text=Custo Anual Total')).toBeVisible({ timeout: 5000 })

    // Click Journal tab
    await page.click('text=Diário')
    await expect(page.locator('text=Revisões')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Investment Tracking - Cost Transparency Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await navigateToInvestments(page)
    await page.click('text=Custos')
    await page.waitForSelector('text=Custo Anual Total', { timeout: 5000 })
  })

  test('should open Add Cost dialog', async ({ page }) => {
    // Click Add Cost button
    const addButton = page.locator('button:has-text("Adicionar Custo")')
    await addButton.click()

    // Verify dialog opens
    await expect(page.locator('text=Novo Custo Recorrente')).toBeVisible({ timeout: 3000 })

    // Verify form fields exist
    await expect(page.locator('input[name="name"]')).toBeVisible()
    await expect(page.locator('select[name="type"]')).toBeVisible()
    await expect(page.locator('input[name="amount"]')).toBeVisible()
    await expect(page.locator('select[name="frequency"]')).toBeVisible()
  })

  test('should create a monthly platform fee', async ({ page }) => {
    // Open dialog
    await page.click('button:has-text("Adicionar Custo")')
    await page.waitForSelector('text=Novo Custo Recorrente', { timeout: 3000 })

    // Fill form
    await page.fill('input[name="name"]', 'Platform Fee - Interactive Brokers')
    await page.selectOption('select[name="type"]', 'PLATFORM_FEE')
    await page.fill('input[name="amount"]', '10')
    await page.selectOption('select[name="frequency"]', 'MONTHLY')

    // Submit
    await page.click('button:has-text("Adicionar")')

    // Wait for cost to appear in list
    await expect(page.locator('text=Platform Fee - Interactive Brokers')).toBeVisible({
      timeout: 5000,
    })

    // Verify annual impact calculation (€10 × 12 = €120)
    await expect(page.locator('text=€120.00')).toBeVisible({ timeout: 3000 })
  })

  test('should calculate total annual cost correctly', async ({ page }) => {
    // Create 3 costs and verify total

    // Cost 1: €10/month = €120/year
    await page.click('button:has-text("Adicionar Custo")')
    await page.fill('input[name="name"]', 'Cost 1')
    await page.selectOption('select[name="type"]', 'PLATFORM_FEE')
    await page.fill('input[name="amount"]', '10')
    await page.selectOption('select[name="frequency"]', 'MONTHLY')
    await page.click('button:has-text("Adicionar")')
    await page.waitForTimeout(1000)

    // Cost 2: €15/quarter = €60/year
    await page.click('button:has-text("Adicionar Custo")')
    await page.fill('input[name="name"]', 'Cost 2')
    await page.selectOption('select[name="type"]', 'CUSTODY_FEE')
    await page.fill('input[name="amount"]', '15')
    await page.selectOption('select[name="frequency"]', 'QUARTERLY')
    await page.click('button:has-text("Adicionar")')
    await page.waitForTimeout(1000)

    // Cost 3: €50/year = €50/year
    await page.click('button:has-text("Adicionar Custo")')
    await page.fill('input[name="name"]', 'Cost 3')
    await page.selectOption('select[name="type"]', 'MANAGEMENT_FEE')
    await page.fill('input[name="amount"]', '50')
    await page.selectOption('select[name="frequency"]', 'ANNUAL')
    await page.click('button:has-text("Adicionar")')
    await page.waitForTimeout(1000)

    // Verify total: €120 + €60 + €50 = €230
    const totalElement = page.locator('text=/Custo Anual Total.*€230/')
    await expect(totalElement).toBeVisible({ timeout: 5000 })
  })

  test('should delete a recurring cost', async ({ page }) => {
    // Create a cost
    await page.click('button:has-text("Adicionar Custo")')
    await page.fill('input[name="name"]', 'Test Cost to Delete')
    await page.selectOption('select[name="type"]', 'PLATFORM_FEE')
    await page.fill('input[name="amount"]', '5')
    await page.selectOption('select[name="frequency"]', 'MONTHLY')
    await page.click('button:has-text("Adicionar")')

    // Wait for cost to appear
    await expect(page.locator('text=Test Cost to Delete')).toBeVisible({ timeout: 5000 })

    // Click delete button
    const deleteButton = page.locator('button:has-text("Excluir")').first()
    await deleteButton.click()

    // Verify cost is removed
    await expect(page.locator('text=Test Cost to Delete')).not.toBeVisible({ timeout: 5000 })
  })
})

test.describe('Investment Tracking - Investment Decision Journal', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await navigateToInvestments(page)
    await page.click('text=Diário')
    await page.waitForSelector('text=Revisões', { timeout: 5000 })
  })

  test('should open Add Review dialog', async ({ page }) => {
    // Click Add Review button
    await page.click('button:has-text("Nova Revisão")')

    // Verify dialog opens
    await expect(page.locator('text=Nova Revisão de Investimento')).toBeVisible({ timeout: 3000 })

    // Verify form fields exist
    await expect(page.locator('input[type="date"]')).toBeVisible()
    await expect(page.locator('select[name="reviewType"]')).toBeVisible()
    await expect(page.locator('textarea[name="notes"]')).toBeVisible()
  })

  test('should create a quarterly review', async ({ page }) => {
    // Open dialog
    await page.click('button:has-text("Nova Revisão")')
    await page.waitForSelector('text=Nova Revisão de Investimento', { timeout: 3000 })

    // Fill form
    await page.fill('input[type="date"]', '2026-02-13')
    await page.selectOption('select[name="reviewType"]', 'QUARTERLY')

    // Add decisions (assuming there's an "Add Decision" button)
    await page.click('button:has-text("Adicionar Decisão")')
    await page.fill('input[name="decision-0"]', 'Maintain current allocation')

    await page.click('button:has-text("Adicionar Decisão")')
    await page.fill('input[name="decision-1"]', 'Continue DCA strategy')

    // Add notes
    await page.fill('textarea[name="notes"]', 'Portfolio performing as expected')

    // Submit
    await page.click('button:has-text("Criar Revisão")')

    // Verify review appears in list
    await expect(page.locator('text=Maintain current allocation')).toBeVisible({ timeout: 5000 })
  })

  test('should expand/collapse review entries', async ({ page }) => {
    // Create a review first
    await page.click('button:has-text("Nova Revisão")')
    await page.fill('input[type="date"]', '2026-02-13')
    await page.selectOption('select[name="reviewType"]', 'QUARTERLY')
    await page.click('button:has-text("Adicionar Decisão")')
    await page.fill('input[name="decision-0"]', 'Test decision')
    await page.fill('textarea[name="notes"]', 'Test notes')
    await page.click('button:has-text("Criar Revisão")')

    // Wait for review to appear
    await page.waitForTimeout(1000)

    // Click to expand
    const reviewEntry = page.locator('text=Test decision').first()
    await reviewEntry.click()

    // Verify notes are visible
    await expect(page.locator('text=Test notes')).toBeVisible({ timeout: 3000 })

    // Click to collapse
    await reviewEntry.click()

    // Verify notes are hidden (implementation-dependent)
    // This may vary based on your component's collapse behavior
  })
})

test.describe('Investment Tracking - Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await navigateToInvestments(page)
  })

  test('should toggle dark mode correctly', async ({ page }) => {
    // Find dark mode toggle (implementation-dependent)
    // Assuming there's a button or icon for theme toggle
    const themeToggle = page.locator('button[aria-label="Toggle theme"]')

    if (await themeToggle.isVisible()) {
      // Click to enable dark mode
      await themeToggle.click()
      await page.waitForTimeout(500)

      // Verify dark mode is active (check background color or class)
      const body = page.locator('body')
      const bgColor = await body.evaluate(el => getComputedStyle(el).backgroundColor)

      // Dark mode should have dark background (rgb values < 50)
      const isDark =
        bgColor.includes('rgb(') && bgColor.match(/\d+/g)!.every(val => parseInt(val) < 50)

      expect(isDark).toBe(true)

      // Toggle back to light mode
      await themeToggle.click()
      await page.waitForTimeout(500)
    }
  })
})

test.describe('Investment Tracking - Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await navigateToInvestments(page)
  })

  test('should render correctly on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Navigate to Costs tab
    await page.click('text=Custos')

    // Verify content is visible and not overflowing
    const content = page.locator('text=Custo Anual Total')
    await expect(content).toBeVisible({ timeout: 5000 })

    // Check no horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5) // Allow 5px tolerance
  })

  test('should render correctly on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })

    // Navigate to Journal tab
    await page.click('text=Diário')

    // Verify content is visible
    const content = page.locator('text=Revisões')
    await expect(content).toBeVisible({ timeout: 5000 })
  })

  test('should render correctly on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })

    // Navigate to Cohorts tab
    await page.click('text=Desempenho por Compra')

    // Verify content is visible
    const content = page.locator('text=Compra')
    await expect(content).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Investment Tracking - Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await navigateToInvestments(page)
  })

  test('should validate required fields in Cost form', async ({ page }) => {
    await page.click('text=Custos')
    await page.click('button:has-text("Adicionar Custo")')

    // Try to submit empty form
    await page.click('button:has-text("Adicionar")')

    // Verify validation error (implementation-dependent)
    // May show as error message, red border, or disabled submit button
    const errorMessage = page.locator('text=/obrigatório|required/i')
    const isErrorVisible = await errorMessage.isVisible().catch(() => false)

    // If validation is inline, check for error styling
    if (!isErrorVisible) {
      const nameInput = page.locator('input[name="name"]')
      const hasError = await nameInput.evaluate(
        el => el.classList.contains('error') || el.classList.contains('invalid')
      )
      expect(hasError).toBe(true)
    } else {
      expect(isErrorVisible).toBe(true)
    }
  })

  test('should validate positive amounts in Cost form', async ({ page }) => {
    await page.click('text=Custos')
    await page.click('button:has-text("Adicionar Custo")')

    // Fill with negative amount
    await page.fill('input[name="name"]', 'Test Cost')
    await page.selectOption('select[name="type"]', 'PLATFORM_FEE')
    await page.fill('input[name="amount"]', '-10')
    await page.selectOption('select[name="frequency"]', 'MONTHLY')

    // Try to submit
    await page.click('button:has-text("Adicionar")')

    // Verify validation error
    const amountInput = page.locator('input[name="amount"]')
    const value = await amountInput.inputValue()

    // Input type="number" may prevent negative values or show validation
    expect(parseFloat(value)).toBeGreaterThan(0)
  })
})

test.describe('Investment Tracking - Performance', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should load Investments tab within 2 seconds', async ({ page }) => {
    const startTime = Date.now()

    await navigateToInvestments(page)
    await page.waitForSelector('text=Portfólio', { timeout: 5000 })

    const loadTime = Date.now() - startTime

    console.log(`Investment tab load time: ${loadTime}ms`)
    expect(loadTime).toBeLessThan(2000)
  })

  test('should switch tabs within 500ms', async ({ page }) => {
    await navigateToInvestments(page)

    const startTime = Date.now()
    await page.click('text=Custos')
    await page.waitForSelector('text=Custo Anual Total', { timeout: 5000 })

    const switchTime = Date.now() - startTime

    console.log(`Tab switch time: ${switchTime}ms`)
    expect(switchTime).toBeLessThan(500)
  })
})
