import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { parseFileWithAI, isGeminiConfigured } from '@/lib/gemini'
import { parseFile } from '@/lib/parsers'
import { validateCsrfToken } from '@/lib/csrf'
import { AIParseFileSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // CSRF protection
    const csrfValidation = validateCsrfToken(request)
    if (!csrfValidation.valid) {
      return NextResponse.json(
        { error: 'CSRF validation failed', details: csrfValidation.error },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const originParam = formData.get('origin') as string
    const useAIParam = formData.get('useAI') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate FormData fields
    const validation = AIParseFileSchema.safeParse({
      origin:
        originParam && originParam !== 'null' && originParam !== 'undefined'
          ? originParam
          : 'Couple',
      useAI: useAIParam,
    })

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      )
    }

    const { origin, useAI } = validation.data

    console.log('[Parse File API] Received origin:', originParam, '=> Using:', origin)

    const fileName = file.name
    const fileType = file.type
    const fileSize = file.size

    // Normalize file type for parser
    let normalizedFileType = 'unknown'
    if (fileType.includes('pdf')) {
      normalizedFileType = 'pdf'
    } else if (
      fileType.includes('image') ||
      fileType.includes('jpg') ||
      fileType.includes('jpeg') ||
      fileType.includes('png')
    ) {
      normalizedFileType = 'image'
    } else if (fileType.includes('csv')) {
      normalizedFileType = 'csv'
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      normalizedFileType = 'xlsx'
    }

    // Determine if we should use AI based on file type and API availability
    const shouldUseAI =
      useAI &&
      isGeminiConfigured() &&
      (normalizedFileType === 'pdf' || normalizedFileType === 'image')

    let parseResult
    let processingMethod = 'traditional'

    if (shouldUseAI) {
      // Use AI for unstructured files (PDF, images)
      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const aiResult = await parseFileWithAI(buffer, normalizedFileType, fileName)

        parseResult = {
          transactions: aiResult.transactions.map(t => ({
            date: t.date,
            description: t.description,
            amount: t.amount,
            balance: t.balance,
            origin: t.origin || origin,
            bank: t.bank || 'Unknown',
          })),
          bank: aiResult.metadata.detectedFormat,
          errors: aiResult.metadata.processingNotes,
        }

        processingMethod = 'ai'
      } catch (aiError) {
        console.error('[AI Parse] AI parsing failed:', aiError)

        const errorMessage = aiError instanceof Error ? aiError.message : 'Unknown error'
        const isApiKeyError =
          errorMessage.includes('API key') || errorMessage.includes('not configured')
        const isRateLimitError =
          errorMessage.includes('rate limit') || errorMessage.includes('quota')

        if (normalizedFileType === 'pdf') {
          // PDF requires AI - no fallback parser available
          const fallbackError = isApiKeyError
            ? 'AI service unavailable: Gemini API key not configured. Please configure GEMINI_API_KEY or use supported file formats (CSV, XLSX).'
            : isRateLimitError
              ? 'AI service temporarily unavailable: Rate limit exceeded. Please try again later or use supported file formats (CSV, XLSX).'
              : `PDF parsing failed: ${errorMessage}. Please use CSV or XLSX format instead.`

          throw new Error(fallbackError)
        } else {
          console.log('[AI Parse] Attempting fallback to traditional parser...')
          parseResult = await parseFile(file, origin)
          processingMethod = 'traditional-fallback'

          // Add warning about AI failure
          if (!parseResult.errors) parseResult.errors = []
          parseResult.errors.push(
            isApiKeyError
              ? 'AI categorization unavailable: API key not configured'
              : isRateLimitError
                ? 'AI categorization unavailable: Rate limit exceeded'
                : 'AI categorization failed, manual review recommended'
          )
        }
      }
    } else {
      // Use traditional parsing for CSV/XLSX
      if (normalizedFileType === 'pdf') {
        // PDF files need AI for parsing
        if (!isGeminiConfigured()) {
          throw new Error(
            'PDF parsing requires AI. Please configure GEMINI_API_KEY or use CSV/XLSX format.'
          )
        }
        throw new Error(
          'PDF parsing requires AI. Please enable the AI option or use CSV/XLSX format.'
        )
      } else {
        parseResult = await parseFile(file, origin)
      }
    }

    return NextResponse.json({
      success: true,
      transactions: parseResult.transactions,
      bank: parseResult.bank,
      errors: parseResult.errors,
      processingMethod,
      metadata: {
        fileName,
        fileSize,
        transactionsFound: parseResult.transactions.length,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to parse file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
