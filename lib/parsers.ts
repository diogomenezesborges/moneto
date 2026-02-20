import ExcelJS from 'exceljs'
import Papa from 'papaparse'

export interface ParsedTransaction {
  date: Date
  description: string
  amount: number
  balance?: number
  origin: string
  bank: string
}

export interface ParseResult {
  transactions: ParsedTransaction[]
  errors: string[]
  bank: string
}

// Parse amount handling both European (1.234,56) and American (1,234.56) formats
function parseAmount(value: any): number {
  if (typeof value === 'number') return value

  let str = String(value).trim()
  if (!str) return 0

  // Remove currency symbols and spaces
  str = str.replace(/[€$£¥\s]/g, '')

  // Detect format by checking which separator appears last
  const lastComma = str.lastIndexOf(',')
  const lastPeriod = str.lastIndexOf('.')

  // European format: 1.234,56 or 1234,56 (comma is decimal separator)
  if (lastComma > lastPeriod) {
    str = str.replace(/\./g, '') // Remove thousand separators (periods)
    str = str.replace(',', '.') // Convert decimal separator to period
  }
  // American format: 1,234.56 or 1234.56 (period is decimal separator)
  else {
    str = str.replace(/,/g, '') // Remove thousand separators (commas)
  }

  const parsed = parseFloat(str)
  return isNaN(parsed) ? 0 : parsed
}

// Auto-detect file type and parse
export async function parseFile(
  file: File,
  origin: string,
  bankHint?: string
): Promise<ParseResult> {
  const fileName = file.name.toLowerCase()

  if (fileName.includes('.json')) {
    return parseJSON(file, origin, bankHint)
  } else if (fileName.includes('.xlsx') || fileName.includes('.xls')) {
    return parseExcel(file, origin, bankHint)
  } else if (fileName.includes('.csv')) {
    return parseCSV(file, origin, bankHint)
  } else if (fileName.includes('.pdf')) {
    return parsePDF(file, origin)
  } else {
    throw new Error('Unsupported file format. Please use .xlsx, .xls, .csv, .json or .pdf files.')
  }
}

async function parsePDF(file: File, origin: string): Promise<ParseResult> {
  // PDF parsing is handled server-side via AI API
  // This function should not be called directly for PDFs
  throw new Error('PDF files should be processed through the AI parsing endpoint')
}

export async function parseJSON(
  file: File,
  origin: string,
  bankHint?: string
): Promise<ParseResult> {
  const text = await file.text()

  try {
    const data = JSON.parse(text)

    // Handle array of transaction objects
    if (Array.isArray(data)) {
      const transactions: ParsedTransaction[] = []
      const errors: string[] = []

      for (let i = 0; i < data.length; i++) {
        try {
          const item = data[i]
          const date = parseDate(item.date || item.Date || item.rawDate)
          const description =
            item.description || item.Description || item.label || item.rawDescription || ''
          const amount = parseAmount(item.amount ?? item.Amount ?? item.rawAmount ?? 0)
          const balance = item.balance != null ? parseAmount(item.balance) : undefined

          transactions.push({
            date,
            description: String(description).trim(),
            amount,
            balance,
            origin,
            bank: bankHint || item.bank || 'Import',
          })
        } catch (error) {
          errors.push(`Error parsing item ${i + 1}: ${error}`)
        }
      }

      return { transactions, errors, bank: bankHint || 'Import' }
    }

    throw new Error('Unsupported JSON format. Expected an array of transaction objects.')
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON file. Please check the file format.')
    }
    throw error
  }
}

export async function parseExcel(
  file: File,
  origin: string,
  bankHint?: string
): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(arrayBuffer)

  const worksheet = workbook.worksheets[0]
  if (!worksheet) {
    throw new Error('No worksheet found in Excel file')
  }

  // Convert worksheet to 2D array (compatible with existing code)
  const data: (string | number)[][] = []
  worksheet.eachRow(row => {
    const rowValues: (string | number)[] = []
    row.eachCell({ includeEmpty: true }, cell => {
      const value = cell.value
      // Convert cell value to string or number
      if (typeof value === 'string' || typeof value === 'number') {
        rowValues.push(value)
      } else {
        rowValues.push(String(value ?? ''))
      }
    })
    data.push(rowValues)
  })

  return parseGeneric(data, origin, bankHint || 'Import')
}

export async function parseCSV(
  file: File,
  origin: string,
  bankHint?: string
): Promise<ParseResult> {
  return new Promise(resolve => {
    Papa.parse(file, {
      complete: results => {
        const data = results.data as any[][]
        const result = parseGeneric(data, origin, bankHint || 'CSV')
        resolve(result)
      },
      skipEmptyLines: true,
    })
  })
}

export function parseGeneric(data: any[][], origin: string, bankName: string): ParseResult {
  const transactions: ParsedTransaction[] = []
  const errors: string[] = []

  // Try to find date, description, amount columns
  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length < 3) continue

    try {
      const date = parseDate(row[0])
      const description = String(row[1] || '').trim()
      const amount = parseAmount(row[2])
      const balance = row[3] ? parseAmount(row[3]) : undefined

      transactions.push({
        date,
        description,
        amount,
        balance,
        origin,
        bank: bankName,
      })
    } catch (error) {
      errors.push(`Error parsing row ${i + 1}: ${error}`)
    }
  }

  return { transactions, errors, bank: bankName }
}

function parseDate(dateInput: any): Date {
  if (dateInput instanceof Date) return dateInput

  const dateStr = String(dateInput).trim()

  // Try different date formats
  const formats = [
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
    /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/, // DD/MM/YYYY or DD-MM-YYYY
    /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2})$/, // DD/MM/YY or DD-MM-YY
  ]

  for (const format of formats) {
    const match = dateStr.match(format)
    if (match) {
      if (format === formats[0]) {
        // YYYY-MM-DD
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
      } else {
        // DD/MM/YYYY or DD/MM/YY
        let year = parseInt(match[3])
        if (year < 50) year += 2000 // Assume 21st century for 2-digit years
        if (year < 100) year += 1900

        return new Date(year, parseInt(match[2]) - 1, parseInt(match[1]))
      }
    }
  }

  // Excel date number format
  if (!isNaN(Number(dateInput))) {
    const excelDate = new Date((Number(dateInput) - 25569) * 86400 * 1000)
    if (excelDate.getFullYear() > 1900 && excelDate.getFullYear() < 2100) {
      return excelDate
    }
  }

  throw new Error(`Unable to parse date: ${dateStr}`)
}

// Export to CSV for Google Sheets format
export function exportToCSV(transactions: any[]): string {
  const headers = [
    'Date',
    'Origin',
    'Bank',
    'In/Out',
    'Major Category',
    'Category',
    'SubCategory',
    'Description',
    'Incomes',
    'Outgoings',
    'Notes',
    'M',
    'Month',
    'Year',
  ]

  const rows = transactions.map(t => {
    const date = new Date(t.rawDate)
    const isIncome = t.rawAmount > 0

    return [
      date.toLocaleDateString('pt-PT'),
      t.origin,
      t.bank,
      isIncome ? 'In' : 'Out',
      t.majorCategory || '',
      t.category || '',
      t.subCategory || '',
      t.rawDescription,
      isIncome ? Math.abs(t.rawAmount).toFixed(2) : '',
      !isIncome ? Math.abs(t.rawAmount).toFixed(2) : '',
      t.notes || '',
      date.getMonth() + 1,
      date.getFullYear() < 10 ? `0${date.getFullYear()}` : date.getFullYear(),
      date.getFullYear(),
    ]
  })

  return [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
}
