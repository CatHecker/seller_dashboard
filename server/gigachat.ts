import { randomUUID } from 'crypto'
import https from 'https'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AccessTokenResponse {
  access_token: string
  expires_at: number // Unix timestamp in milliseconds
}

interface ItemDataForAI {
  title: string
  category: 'auto' | 'real_estate' | 'electronics'
  characteristics: Record<string, any>
  currentDescription?: string
}

interface GigaChatRequestBody {
  model: string
  messages: Array<{
    role: 'system' | 'user'
    content: string
  }>
  temperature: number
  max_tokens: number
}

// ---------------------------------------------------------------------------
// Environment Variables
// ---------------------------------------------------------------------------

const GIGACHAT_AUTH_KEY = process.env.AUTHORIZTION_KEY

const GIGACHAT_OAUTH_URL = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth'
const GIGACHAT_COMPLETIONS_URL =
  'https://gigachat.devices.sberbank.ru/api/v1/chat/completions'

// Для отладки: отключение строгой проверки SSL
// ВНИМАНИЕ: Используйте только для разработки! Для продакшена используйте правильные сертификаты.
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === 'production',
})

// ---------------------------------------------------------------------------
// Access Token Management
// ---------------------------------------------------------------------------

let currentAccessToken: AccessTokenResponse | null = null

export async function getAccessToken(): Promise<string> {
  // Check if token is still valid (with 1 minute buffer)
  if (currentAccessToken && Date.now() < currentAccessToken.expires_at) {
    console.log('[GigaChat] Using cached access token')
    return currentAccessToken.access_token
  }

  console.log('[GigaChat] Fetching new access token...')
  const rquid = randomUUID()

  try {
    const response = await fetch(GIGACHAT_OAUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        RqUID: rquid,
        Authorization: `Basic ${GIGACHAT_AUTH_KEY}`,
      },
      body: 'scope=GIGACHAT_API_PERS',
      agent: httpsAgent,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[GigaChat] OAuth error response:', errorText)
      throw new Error(
        `Failed to fetch GigaChat access token: ${response.status} ${response.statusText}`,
      )
    }

    const data = await response.json()

    if (!data.access_token) {
      console.error('[GigaChat] No access_token in response:', data)
      throw new Error('GigaChat OAuth response does not contain access_token')
    }

    const expiresIn = data.expires_at || 1800 // Default to 30 minutes
    currentAccessToken = {
      access_token: data.access_token,
      expires_at: Date.now() + expiresIn * 1000 - 60 * 1000, // Refresh 1 minute before expiry
    }

    console.log('[GigaChat] Successfully obtained new access token')
    return currentAccessToken.access_token
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[GigaChat] Failed to obtain access token:', errorMessage)
    throw new Error(`Failed to obtain GigaChat access token: ${errorMessage}`)
  }
}

// ---------------------------------------------------------------------------
// GigaChat API Call
// ---------------------------------------------------------------------------

async function callGigaChatAPI(prompt: string): Promise<string> {
  try {
    const accessToken = await getAccessToken()

    const requestBody: GigaChatRequestBody = {
      model: 'GigaChat',
      messages: [
        {
          role: 'system',
          content:
            'Ты – ассистент, который помогает улучшать описания товаров и оценивать их рыночную стоимость.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }

    console.log('[GigaChat] Calling GigaChat API...')
    const response = await fetch(GIGACHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      agent: httpsAgent,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[GigaChat] API error response:', errorText)
      throw new Error(
        `GigaChat API error: ${response.status} ${response.statusText}`,
      )
    }

    const data = await response.json()

    if (data.choices && data.choices.length > 0) {
      const content = data.choices[0].message.content
      console.log('[GigaChat] Successfully received response from GigaChat API')
      return content
    } else {
      console.error('[GigaChat] No choices in response:', data)
      throw new Error('GigaChat API returned no choices.')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[GigaChat] API call failed:', errorMessage)
    throw new Error(`GigaChat API call failed: ${errorMessage}`)
  }
}

// ---------------------------------------------------------------------------
// Public Functions
// ---------------------------------------------------------------------------

export async function generateDescription(
  data: ItemDataForAI,
): Promise<string> {
  const categoryMap: Record<string, string> = {
    auto: 'Автомобиль',
    real_estate: 'Недвижимость',
    electronics: 'Электроника',
  }

  const prompt = `Ты – эксперт по написанию продающих описаний для товаров и услуг.
На основе предоставленных данных составь привлекательное, грамотное описание.
Используй факты из характеристик, избегай шаблонных фраз.
Описание должно быть на русском языке, лаконичным и информативным (до 500 символов).

Данные:
Название: ${data.title}
Категория: ${categoryMap[data.category]}
Характеристики: ${JSON.stringify(data.characteristics)}
${data.currentDescription ? `Текущее описание: ${data.currentDescription}` : ''}

Сгенерируй только текст описания без лишних комментариев.`

  return callGigaChatAPI(prompt)
}

export async function suggestPrice(
  data: Omit<ItemDataForAI, 'currentDescription'>,
): Promise<number | null> {
  const categoryMap: Record<string, string> = {
    auto: 'Автомобиль',
    real_estate: 'Недвижимость',
    electronics: 'Электроника',
  }

  const prompt = `Ты – аналитик рынка. Определи актуальную рыночную цену на товар/услугу по описанию.
Ответь только числом в рублях, без лишних слов.
Если невозможно определить – ответь "null".

Название: ${data.title}
Категория: ${categoryMap[data.category]}
Характеристики: ${JSON.stringify(data.characteristics)}`

  try {
    const rawResponse = await callGigaChatAPI(prompt)
    const priceMatch = rawResponse.match(/\d+/)

    if (priceMatch) {
      const price = parseInt(priceMatch[0], 10)
      console.log('[GigaChat] Suggested price:', price)
      return price
    } else if (rawResponse.toLowerCase().includes('null')) {
      console.log('[GigaChat] Could not determine price')
      return null
    } else {
      console.warn(
        '[GigaChat] Could not parse price from response:',
        rawResponse,
      )
      return null
    }
  } catch (error) {
    console.error('[GigaChat] Error suggesting price:', error)
    return null
  }
}
