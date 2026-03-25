import Fastify from 'fastify'
import cors from '@fastify/cors'
import formBody from '@fastify/formbody'
import { ZodError } from 'zod'
import { treeifyError } from 'zod'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import items from 'data/items.json' with { type: 'json' }

import { Item } from '../shared/types/types.ts'
import { ItemsGetInQuerySchema, ItemUpdateInSchema } from 'src/validation.ts'
import { doesItemNeedRevision } from './src/utils.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../.env') })

const ITEMS = items as Item[]

const fastify = Fastify({ logger: true })

// ----------------------------------------------------------------------
// CORS и парсеры
await fastify.register(cors, {
  origin: '*',
  methods: ['GET', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})
await fastify.register(formBody)


// ----------------------------------------------------------------------
// Маршруты для работы с объявлениями (остаются без изменений)
interface ItemGetRequest extends Fastify.RequestGenericInterface {
  Params: { id: string }
}

fastify.get<ItemGetRequest>('/items/:id', (request, reply) => {
  const itemId = Number(request.params.id)
  if (!Number.isFinite(itemId)) {
    return reply
      .status(400)
      .send({ success: false, error: 'Item ID path param should be a number' })
  }
  const item = ITEMS.find((item) => item.id === itemId)
  if (!item) {
    return reply
      .status(404)
      .send({ success: false, error: "Item with requested id doesn't exist" })
  }
  return {
    ...item,
    needsRevision: doesItemNeedRevision(item),
  }
})

interface ItemsGetRequest extends Fastify.RequestGenericInterface {
  Querystring: {
    q?: string
    limit?: string
    skip?: string
    categories?: string
    needsRevision?: string
  }
}

fastify.get<ItemsGetRequest>('/items', (request) => {
  const {
    q,
    limit,
    skip,
    needsRevision,
    categories,
    sortColumn,
    sortDirection,
  } = ItemsGetInQuerySchema.parse(request.query)

  const filteredItems = ITEMS.filter((item) => {
    return (
      item.title.toLowerCase().includes(q.toLowerCase()) &&
      (!needsRevision || doesItemNeedRevision(item)) &&
      (!categories?.length || categories.some((cat) => item.category === cat))
    )
  })

  return {
    items: filteredItems
      .toSorted((a, b) => {
        if (!sortDirection) return 0
        let comparison = 0
        if (sortColumn === 'title') {
          comparison = a.title.localeCompare(b.title)
        } else if (sortColumn === 'createdAt') {
          comparison =
            new Date(a.createdAt).valueOf() - new Date(b.createdAt).valueOf()
        }
        return (sortDirection === 'desc' ? -1 : 1) * comparison
      })
      .slice(skip, skip + limit)
      .map((item) => ({
        id: item.id,
        category: item.category,
        title: item.title,
        price: item.price,
        needsRevision: doesItemNeedRevision(item),
      })),
    total: filteredItems.length,
  }
})

interface ItemUpdateRequest extends Fastify.RequestGenericInterface {
  Params: { id: string }
}

fastify.put<ItemUpdateRequest>('/items/:id', (request, reply) => {
  const itemId = Number(request.params.id)
  if (!Number.isFinite(itemId)) {
    return reply
      .status(400)
      .send({ success: false, error: 'Item ID path param should be a number' })
  }
  const itemIndex = ITEMS.findIndex((item) => item.id === itemId)
  if (itemIndex === -1) {
    return reply
      .status(404)
      .send({ success: false, error: "Item with requested id doesn't exist" })
  }

  try {
    const parsedData = ItemUpdateInSchema.parse({
      category: ITEMS[itemIndex].category,
      ...(request.body as object),
    })

    ITEMS[itemIndex] = {
      id: ITEMS[itemIndex].id,
      createdAt: ITEMS[itemIndex].createdAt,
      updatedAt: new Date().toISOString(),
      ...parsedData,
    }

    return { success: true }
  } catch (error) {
    if (error instanceof ZodError) {
      return reply
        .status(400)
        .send({ success: false, error: treeifyError(error) })
    }
    throw error
  }
})

// ----------------------------------------------------------------------
// Запуск сервера
const port = Number(process.env.PORT) || 8080
fastify.listen({ port }, (err) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  fastify.log.debug(`Server is listening on port ${port}`)
})
