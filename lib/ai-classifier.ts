/**
 * AI Classifier using ID-based taxonomy
 * Returns category IDs with confidence and reasoning
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { getAllCategoriesWithIds } from './category-mapper'
import { isGeminiConfigured } from './gemini'

// Lazy initialization
let genAI: GoogleGenerativeAI | null = null
function getGenAI() {
  if (!isGeminiConfigured()) {
    throw new Error('Gemini API is not configured. Please set GEMINI_API_KEY environment variable.')
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  }
  return genAI
}

export interface AIClassificationResult {
  majorCategoryId: string
  categoryId: string
  tags: string[] // Replaces subcategories - flexible metadata
  confidence: number // 0.0 - 1.0
  reasoning: string
  version: string // Prompt version for tracking
}

/**
 * Classify a transaction using AI with deterministic prompt
 * Returns stable category IDs (not names)
 */
export async function classifyTransaction(
  transaction: {
    description: string
    amount: number
    date: Date
    bank?: string
  },
  historicalContext?: Array<{
    description: string
    majorCategoryId: string
    categoryId: string
    tags?: string[]
  }>
): Promise<AIClassificationResult> {
  const model = getGenAI().getGenerativeModel({ model: 'gemini-2.5-flash' })

  // Get the full taxonomy with IDs (2-level: Major → Category)
  const taxonomy = await getAllCategoriesWithIds()

  // Build a clean taxonomy structure for the prompt
  const taxonomyDescription = taxonomy
    .map(major => {
      const categories = major.categories.map(cat => `    • ${cat.name} (${cat.id})`).join('\n')
      return `  ${major.name} (${major.id})\n${categories}`
    })
    .join('\n\n')

  // Build historical context if provided
  const historySection =
    historicalContext && historicalContext.length > 0
      ? `\nHISTORICAL SIMILAR TRANSACTIONS:
${historicalContext
  .slice(0, 5)
  .map(
    h =>
      `- "${h.description}" → Major: ${h.majorCategoryId}, Category: ${h.categoryId}${h.tags && h.tags.length > 0 ? `, Tags: ${h.tags.join(', ')}` : ''}`
  )
  .join('\n')}`
      : ''

  // Available tag namespaces for additional context
  const tagNamespaces = `
AVAILABLE TAG NAMESPACES (for additional metadata):
- vehicle: (car, motorcycle, etc.) - Vehicle-related expenses
- trip: (destination names) - Travel destinations
- provider: (financial service provider names) - Financial service providers
- platform: (marketplace names) - E-commerce platforms
- occasion: (christmas, birthday, wedding, etc.) - Special occasions
- recipient: (person names) - Gift recipients
- sport: (yoga, gym, tennis, golf, football, running, etc.) - Sports activities
- type: (tax, fine, bank-fee, cash-withdrawal, decoration, beauty, books, education) - Transaction types
- utility: (water, electricity, gas) - Utility types
- service: (spotify, amazon, google, netflix, etc.) - Subscription services
- project: (project names) - Side projects
- reimbursable: (yes) - Mark as reimbursable expense`

  const prompt = `You are an expert financial categorization system for a personal budget tracker.

TRANSACTION TO CLASSIFY:
- Description: "${transaction.description}"
- Amount: €${transaction.amount.toFixed(2)} ${transaction.amount < 0 ? '(expense)' : '(income)'}
- Date: ${transaction.date.toISOString().split('T')[0]}
${transaction.bank ? `- Bank: ${transaction.bank}` : ''}
${historySection}

AVAILABLE TAXONOMY (2-tier hierarchy with stable IDs):
${taxonomyDescription}
${tagNamespaces}

CLASSIFICATION RULES:
1. Analyze the transaction description, amount, and context
2. Consider the language and local merchants in the description
3. Choose the MOST appropriate category:
   - Positive amounts (+) are typically INCOME
   - Negative amounts (-) are typically EXPENSES
4. Return category IDs (not names) from the taxonomy above
5. Suggest relevant tags in namespace:value format (e.g., "vehicle:car", "service:spotify")
6. Provide confidence score: 0.0-1.0 (where 1.0 = certain, 0.5 = moderate, 0.0 = guessing)
7. Give brief reasoning explaining the classification

IMPORTANT:
- Use ONLY category IDs from the taxonomy above
- NEVER invent new IDs or category names
- If uncertain, use a broader category with lower confidence
- For grocery stores → use appropriate food/grocery category
- For streaming services → use subscription category + service tag
- For salaries → use mc_income, cat_salario
- For rent/mortgage → use mc_fixed_costs, cat_casa

Return ONLY a valid JSON object:
{
  "majorCategoryId": "mc_xxx",
  "categoryId": "cat_xxx",
  "tags": ["namespace:value", ...] or [],
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation (1-2 sentences)"
}

DO NOT include markdown code blocks or any text outside the JSON object.`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract JSON from response (handle markdown code blocks if present)
    let jsonText = text.trim()
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim()
    } else {
      // Try to extract just the JSON object
      const objectMatch = text.match(/\{[\s\S]*\}/)
      if (objectMatch) {
        jsonText = objectMatch[0]
      }
    }

    const parsed = JSON.parse(jsonText)

    // Validate that the returned IDs exist in the taxonomy
    const validMajor = taxonomy.find(m => m.id === parsed.majorCategoryId)
    if (!validMajor) {
      throw new Error(`AI returned invalid major category ID: ${parsed.majorCategoryId}`)
    }

    const validCategory = validMajor.categories.find(c => c.id === parsed.categoryId)
    if (!validCategory) {
      throw new Error(`AI returned invalid category ID: ${parsed.categoryId}`)
    }

    // Ensure tags is an array of strings
    const tags = Array.isArray(parsed.tags)
      ? parsed.tags.filter((t: any) => typeof t === 'string')
      : []

    return {
      majorCategoryId: parsed.majorCategoryId,
      categoryId: parsed.categoryId,
      tags,
      confidence: Math.min(1.0, Math.max(0.0, parseFloat(parsed.confidence))),
      reasoning: parsed.reasoning || 'AI classification',
      version: 'v2.0', // 2-level taxonomy + tags
    }
  } catch (error) {
    throw new Error(`AI classification failed: ${error}`)
  }
}

/**
 * Batch classify multiple transactions
 * More efficient than calling classifyTransaction multiple times
 */
export async function classifyTransactionBatch(
  transactions: Array<{
    id: string
    description: string
    amount: number
    date: Date
    bank?: string
  }>
): Promise<Map<string, AIClassificationResult>> {
  const results = new Map<string, AIClassificationResult>()

  // Process in parallel with rate limiting (max 5 concurrent)
  const batchSize = 5
  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize)
    const promises = batch.map(async tx => {
      try {
        const result = await classifyTransaction({
          description: tx.description,
          amount: tx.amount,
          date: tx.date,
          bank: tx.bank,
        })
        return { id: tx.id, result }
      } catch (error) {
        console.error(`Failed to classify transaction ${tx.id}:`, error)
        return { id: tx.id, result: null }
      }
    })

    const batchResults = await Promise.all(promises)
    batchResults.forEach(({ id, result }) => {
      if (result) {
        results.set(id, result)
      }
    })
  }

  return results
}
