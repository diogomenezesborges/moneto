import { GoogleGenerativeAI } from '@google/generative-ai'

// Lazy initialization to ensure env vars are loaded
let genAI: GoogleGenerativeAI | null = null

/**
 * Check if Gemini API is properly configured
 */
export function isGeminiConfigured(): boolean {
  const apiKey = process.env.GEMINI_API_KEY
  return !!apiKey && apiKey.length > 10 && !apiKey.includes('your_')
}

/**
 * Get configured GenAI instance
 * Throws error if not properly configured
 */
function getGenAI() {
  if (!isGeminiConfigured()) {
    throw new Error('Gemini API is not configured. Please set GEMINI_API_KEY environment variable.')
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  }
  return genAI
}

export interface CategorySuggestion {
  majorCategory: string
  category: string
  subCategory?: string
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
  score: number
}

export interface FileParseResult {
  transactions: Array<{
    date: Date
    description: string
    amount: number
    balance?: number
    origin?: string
    bank?: string
  }>
  metadata: {
    detectedFormat: string
    confidence: number
    processingNotes: string[]
  }
}

/**
 * Use Gemini to suggest categories for a transaction
 */
export async function suggestCategoryWithAI(
  transaction: {
    description: string
    amount: number
    date: Date
  },
  historicalContext: {
    majorCategory: string
    category: string
    subCategory?: string
    description: string
  }[],
  availableCategories: any
): Promise<CategorySuggestion> {
  const model = getGenAI().getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `You are an expert financial categorization assistant for a personal budget tracker.

TRANSACTION TO CATEGORIZE:
- Description: "${transaction.description}"
- Amount: €${transaction.amount.toFixed(2)}
- Date: ${transaction.date.toISOString().split('T')[0]}

AVAILABLE CATEGORY STRUCTURE:
${JSON.stringify(availableCategories, null, 2)}

HISTORICAL SIMILAR TRANSACTIONS (for learning):
${historicalContext
  .slice(0, 5)
  .map(
    h =>
      `- "${h.description}" → ${h.majorCategory} > ${h.category}${h.subCategory ? ` > ${h.subCategory}` : ''}`
  )
  .join('\n')}

INSTRUCTIONS:
1. Analyze the transaction description and amount
2. Consider the language and local context in the description
3. Look at historical patterns for similar transactions
4. Choose the MOST appropriate category from the available structure
5. Provide a confidence level (high: 80-100%, medium: 50-79%, low: 0-49%)
6. Give a brief reasoning

Return ONLY a valid JSON object with this structure:
{
  "majorCategory": "exact name from available categories",
  "category": "exact name from available subcategories",
  "subCategory": "specific subcategory or null",
  "confidence": "high|medium|low",
  "reasoning": "brief explanation",
  "score": 0-100
}

Important: Use EXACT category names from the available structure. Do not invent new categories.`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response')
    }

    const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0])

    return {
      majorCategory: parsed.majorCategory,
      category: parsed.category,
      subCategory: parsed.subCategory || undefined,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
      score: parsed.score,
    }
  } catch (error) {
    throw new Error(`AI categorization failed: ${error}`)
  }
}

/**
 * Use Gemini to parse unstructured files (PDF, images, etc.)
 */
export async function parseFileWithAI(
  fileBuffer: Buffer,
  fileType: string,
  fileName: string
): Promise<FileParseResult> {
  // Gemini 2.5 Flash supports both text and multimodal (images, PDFs)
  const model = getGenAI().getGenerativeModel({
    model: 'gemini-2.5-flash',
  })

  let prompt = `You are an expert at extracting financial transaction data from documents.

FILE: ${fileName}
TYPE: ${fileType}

TASK: Extract all financial transactions from this document.

For each transaction, identify:
- Date (convert to YYYY-MM-DD format)
- Description/Merchant name
- Amount (use negative for expenses, positive for income)
- Balance (if available)
- Any other relevant details

IMPORTANT:
- Handle various date formats (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, etc.)
- Amounts may use comma as decimal separator (e.g., "1.234,56") or period (e.g., "1,234.56") and various currency symbols
- Extract the bank/card name if visible in the document
- For credit cards: expenses are typically positive purchases, payments are negative

Return ONLY a valid JSON object with this structure:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "merchant or transaction description",
      "amount": -123.45,
      "balance": 1000.00,
      "bank": "bank name if found",
      "notes": "any additional context"
    }
  ],
  "metadata": {
    "detectedFormat": "PDF Bank Statement|Receipt|Manual Entry|etc",
    "confidence": 0-100,
    "processingNotes": ["any issues or observations"]
  }
}`

  try {
    let result

    if (fileType === 'pdf') {
      // Extract text from PDF first, then send to AI as text
      // Using require for CommonJS module compatibility
      const pdfParse = require('pdf-parse')
      const pdfData = await pdfParse(fileBuffer)
      const textContent = pdfData.text
      prompt += `\n\nFILE CONTENT:\n${textContent.substring(0, 20000)}` // Limit to first 20k chars
      result = await model.generateContent(prompt)
    } else if (fileType === 'image') {
      // For images, use vision model (requires multimodal API access)
      const imageParts = [
        {
          inlineData: {
            data: fileBuffer.toString('base64'),
            mimeType: 'image/jpeg',
          },
        },
      ]

      result = await model.generateContent([prompt, ...imageParts])
    } else {
      // For text files (CSV, etc.), convert to text
      const textContent = fileBuffer.toString('utf-8')
      prompt += `\n\nFILE CONTENT:\n${textContent.substring(0, 10000)}` // Limit to first 10k chars
      result = await model.generateContent(prompt)
    }

    const response = await result.response
    const text = response.text()

    // Extract JSON from response
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response')
    }

    const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0])

    // Convert date strings to Date objects and parse amounts
    const transactions = parsed.transactions.map((t: any) => ({
      date: new Date(t.date),
      description: t.description,
      amount: parseFloat(t.amount.toString().replace(',', '.')),
      balance: t.balance ? parseFloat(t.balance.toString().replace(',', '.')) : undefined,
      origin: t.origin || 'Couple',
      bank: t.bank || 'Unknown',
    }))

    return {
      transactions,
      metadata: {
        detectedFormat: parsed.metadata.detectedFormat,
        confidence: parsed.metadata.confidence,
        processingNotes: parsed.metadata.processingNotes || [],
      },
    }
  } catch (error) {
    throw new Error(`AI file parsing failed: ${error}`)
  }
}

/**
 * Get learned patterns from feedback to improve suggestions
 */
export async function getLearnedPatterns(
  userId: string,
  prisma: any
): Promise<Map<string, { category: string; confidence: number }>> {
  const feedback = await prisma.categorySuggestionFeedback.findMany({
    where: {
      transaction: { userId },
      action: 'accept',
    },
    include: {
      transaction: {
        select: {
          rawDescription: true,
        },
      },
    },
  })

  const patterns = new Map<string, { category: string; confidence: number }>()

  // Build pattern map from accepted suggestions
  feedback.forEach((f: any) => {
    const key = f.transaction.rawDescription.toLowerCase()
    const category = `${f.actualMajorCategory}|${f.actualCategory}|${f.actualSubCategory || ''}`

    if (patterns.has(key)) {
      const existing = patterns.get(key)!
      existing.confidence += 0.1 // Increase confidence with each confirmation
    } else {
      patterns.set(key, { category, confidence: 0.8 })
    }
  })

  return patterns
}
