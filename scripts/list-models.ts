import { config } from 'dotenv'

// Load environment variables
config()

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    console.error('❌ No API key found')
    return
  }

  console.log('📋 Listing available Gemini models...\n')

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ HTTP ${response.status}: ${response.statusText}`)
      console.error(errorText)
      return
    }

    const data = await response.json()

    if (data.models && Array.isArray(data.models)) {
      console.log(`✅ Found ${data.models.length} models:\n`)

      data.models.forEach((model: any) => {
        console.log(`📦 ${model.name}`)
        console.log(`   Display Name: ${model.displayName}`)
        console.log(`   Description: ${model.description}`)
        console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ')}`)
        console.log(`   Input Token Limit: ${model.inputTokenLimit}`)
        console.log(`   Output Token Limit: ${model.outputTokenLimit}\n`)
      })
    } else {
      console.log('No models found')
    }
  } catch (error: any) {
    console.error('❌ Error listing models:', error.message)
  }
}

listModels()
