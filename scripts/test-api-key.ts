import { config } from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Load environment variables
config()

async function testApiKey() {
  console.log('🔑 Testing Gemini API Key...\n')

  const apiKey = process.env.GEMINI_API_KEY
  console.log(`API Key loaded: ${apiKey ? '✅ Yes' : '❌ No'}`)
  console.log(
    `API Key value: ${apiKey?.substring(0, 10)}...${apiKey?.substring(apiKey.length - 4)}\n`
  )

  if (!apiKey) {
    console.error('❌ No API key found in environment variables')
    return
  }

  console.log('🧪 Testing simple text generation...\n')

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const result = await model.generateContent('Hello, say "Hi" back in one word.')
    const response = await result.response
    const text = response.text()

    console.log('✅ API Key is VALID!')
    console.log(`Response: ${text}\n`)
  } catch (error: any) {
    console.error('❌ API Key test FAILED!')
    console.error(`Error: ${error.message}\n`)

    if (error.status === 403) {
      console.log('📝 Possible issues:')
      console.log('   1. API key may be invalid or expired')
      console.log('   2. Generative Language API not enabled in Google Cloud Console')
      console.log('   3. API key restrictions (IP/referrer) blocking requests')
      console.log('   4. Billing not enabled for the project')
      console.log('\n💡 Try regenerating the API key at:')
      console.log('   https://makersuite.google.com/app/apikey')
    }
  }
}

testApiKey()
