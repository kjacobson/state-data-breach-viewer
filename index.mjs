import Fastify from 'fastify'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
const fastify = Fastify({ logger: true })

const db = new Low(new JSONFile('./4202023213037.json'), {})
await db.read()

const DATE_FIELDS = ['start_date', 'end_date', 'reported_date', 'published_date']
const COLUMNS = [
  'state',
  'entity_name',
  'dba',
  'business_address',
  'business_city',
  'business_state',
  'business_zip',
  'start_date',
  'end_date',
  'breach_dates',
  'reported_date',
  'number_affected',
  'data_accessed',
  'notice_methods',
  'breach_type',
  'letter_url',
  'url',
]

const pick = (obj, keys) => (
  keys.reduce((acc, key) => {
     if (obj && obj.hasOwnProperty(key)) {
        acc[key] = obj[key]
     }
     return acc
  }, {})
)

const sortBy = (key, desc) => {
  return (a, b) => {
    return desc ? (
      (a[key] < b[key])
        ? 1
        : (
          (b[key] < a[key]) ? -1 : 0
        )
    ) : (
      (a[key] > b[key])
        ? 1
        : (
          (b[key] > a[key]) ? -1 : 0
        )
    )
  }
}
const sortByDate = (key, desc) => {
  return (a, b) => {
    const c = new Date(a[key])
    const d = new Date(b[key])
    return desc ? (
      (c < d)
        ? 1
        : (
          (d < c) ? -1 : 0
        )
    ) : (
      (c > d)
        ? 1
        : (
          (d > c) ? -1 : 0
        )
    )
  }
}

const applyFilter = (val, filterString, isDate) => {
  // TODO: handle array types
  if (isDate) {
    val = new Date(val)
  }
  let and = false
  let or = false
  let parts = filterString.split('AND')
  if (parts.length > 1) {
    and = true
  } else {
    parts = filterString.split('OR')
    if (parts.length > 1) {
      or = true
    }
  }
  let match = false
  for (const part of parts) {
    const [comparison, target] = part.split(':')
    if (or) {
      if (
        (comparison === 'eq' && val === target) ||
        (comparison === 'gt' && val > target) ||
        (comparison === 'lt' && val < target) ||
        (!isDate && comparison === 'like' && val.indexOf(target) > -1)
      ) {
        match = true
        break
      }
    } else {
      match = (
        (comparison === 'eq' && val === target) ||
        (comparison === 'gt' && val > target) ||
        (comparison === 'lt' && val < target) ||
        (!isDate && comparison === 'like' && val.indexOf(target) > -1)
      )
    }
  }
  return match
}

fastify.get('/', async (req, reply) => {
  return db.data.breaches.slice(0, 10)
})

fastify.get('/states/:code', async (req, reply) => {
  let {
    limit,
    offset,
    sort,
    desc,
    ...rest
  } = req.query
  const { code: stateCode } = req.params
  limit = parseInt(limit, 10)
  if (isNaN(limit)) {
    limit = 10
  }
  offset = parseInt(offset, 10)
  if (isNaN(offset)) {
    offset = 0
  }
  sort = sort || 'reported_date'
  desc = desc !== undefined

  const filters = Object.entries(pick(rest, COLUMNS))
  return db.data.breaches
    .filter((breach) => (
      breach.state === stateCode &&
      filters.reduce((match, [key, val]) => {
        return match && applyFilter(breach[key], val, DATE_FIELDS.includes(key))
      }, true)
    ))
    .sort(DATE_FIELDS.includes(sort) ? sortByDate(sort, desc) : sortBy(sort, desc))
    .slice(offset, offset + limit)
})

const start = async () => {
  try {
    await fastify.listen({ port: 3000 })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()
