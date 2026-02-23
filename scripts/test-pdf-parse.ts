import { config } from 'dotenv'
config()

async function testPdfParse() {
  console.log('Testing pdf-parse module structure...\n')

  try {
    const pdfParse = require('pdf-parse')
    console.log('Module type:', typeof pdfParse)
    console.log('Module keys:', Object.keys(pdfParse))
    console.log('Module.default type:', typeof pdfParse.default)
    console.log('Module:', pdfParse)
  } catch (error: any) {
    console.error('Error:', error.message)
  }
}

testPdfParse()
