const API_BASE = 'http://localhost:8080'

interface ItemDataForAI {
  title: string
  category: 'auto' | 'real_estate' | 'electronics'
  characteristics: Record<string, any>
  currentDescription?: string
}

export async function generateDescription(
  data: ItemDataForAI,
): Promise<string> {
  try {
    const response = await fetch(`${API_BASE}/api/gigachat/description`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: data.title,
        category: data.category,
        characteristics: data.characteristics,
        currentDescription: data.currentDescription,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(
        errorData.message ||
          `Failed to generate description: ${response.statusText}`,
      )
    }

    const result = await response.json()
    return result.description
  } catch (error) {
    throw new Error(
      `Error generating description: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

export async function suggestPrice(
  data: Omit<ItemDataForAI, 'currentDescription'>,
): Promise<number | null> {
  try {
    const response = await fetch(`${API_BASE}/api/gigachat/price`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: data.title,
        category: data.category,
        characteristics: data.characteristics,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(
        errorData.message || `Failed to suggest price: ${response.statusText}`,
      )
    }

    const result = await response.json()
    return result.price
  } catch (error) {
    console.error('Error suggesting price:', error)
    return null
  }
}
