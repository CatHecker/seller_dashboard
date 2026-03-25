import {
  type Item,
  type ItemSortColumn,
  type SortDirection,
} from '../../shared/types/types.ts'

const API_BASE = 'http://localhost:8080'

export type Category = Item['category'] // 'auto' | 'real_estate' | 'electronics'

// Ответ GET /items
export interface ItemsResponse {
  items: (Item & { needsRevision: boolean })[]
  total: number
}

// Параметры запроса GET /items
export interface FetchItemsParams {
  q?: string
  limit?: number
  skip?: number
  needsRevision?: boolean
  categories?: Category[]
  sortColumn?: ItemSortColumn
  sortDirection?: SortDirection
}

// Тело PUT /items/:id
export type ItemUpdatePayload = {
  category: Category
  title: string
  description?: string
  price: number
  params: Item['params']
}

//   GET /items - список объявлений
export async function fetchItems(
  params: FetchItemsParams = {},
  signal?: AbortSignal,
): Promise<ItemsResponse> {
  const url = new URL(`${API_BASE}/items`)

  if (params.q) url.searchParams.set('q', params.q)
  if (params.limit !== undefined)
    url.searchParams.set('limit', String(params.limit))
  if (params.skip !== undefined)
    url.searchParams.set('skip', String(params.skip))
  if (params.needsRevision !== undefined)
    url.searchParams.set('needsRevision', String(params.needsRevision))
  if (params.categories?.length)
    url.searchParams.set('categories', params.categories.join(','))
  if (params.sortColumn) url.searchParams.set('sortColumn', params.sortColumn)
  if (params.sortDirection)
    url.searchParams.set('sortDirection', params.sortDirection)

  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`Ошибка загрузки объявлений: ${response.status}`)
  }
  return response.json()
}

//     GET /items/:id - одно объявление
export async function fetchItemById(
  id: string | number,
  signal?: AbortSignal,
): Promise<Item> {
  const response = await fetch(`${API_BASE}/items/${id}`, { signal })
  if (!response.ok) {
    throw new Error(`Объявление с id ${id} не найдено`)
  }
  return response.json()
}

//     PUT /items/:id - обновление объявления
export async function updateItem(
  id: string | number,
  data: ItemUpdatePayload,
): Promise<Item> {
  const response = await fetch(`${API_BASE}/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error(`Ошибка сохранения объявления: ${response.status}`)
  }
  return response.json()
}
