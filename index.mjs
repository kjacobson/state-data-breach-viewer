import path from 'path'
import { fileURLToPath } from 'url';
import Fastify from 'fastify'
import fstatic from '@fastify/static'
import helmet from '@fastify/helmet'
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
  'published_date',
  'breach_type',
  'letter_url',
  'url',
]
const COLS_BY_STATE = {
  CA: ['entity_name', 'breach_dates', 'reported_date'],
  DE: ['entity_name', 'start_date', 'end_date', 'breach_dates', 'reported_date', 'number_affected'],
  HI: ['entity_name', 'reported_date', 'number_affected', 'breach_type', 'letter_url'],
  IA: ['entity_name', 'reported_date', 'letter_url'],
  MD: ['entity_name', 'reported_date', 'number_affected', 'date_types', 'breach_type'],
  ME: ['entity_name', 'reported_date', 'url'],
  MT: ['entity_name', 'letter_url', 'start_date', 'end_date', 'reported_date', 'number_affected'],
  ND: ['entity_name', 'dba', 'letter_url', 'breach_dates', 'start_date', 'end_date', 'reported_date', 'number_affected'],
  NH: ['entity_name', 'reported_date', 'url'],
  NJ: ['entity_name', 'reported_date', 'url'],
  TX: [
    'entity_name', 'business_address', 'business_city', 'business_state', 'business_zip',
    'published_date', 'number_affected', 'data_accessed', 'notice_methods'
  ],
  WA: ['entity_name', 'start_date', 'reported_date', 'number_affected', 'data_accessed', 'letter_url']
}

const replaceSort = (query, sort) => {
  const newQuery = Object.assign({}, query)
  newQuery.sort = sort
  if (sort !== newQuery.sort) {
    delete newQuery.desc
  } else {
    if (newQuery.desc !== undefined) {
      delete newQuery.desc
    } else {
      newQuery.desc = ''
    }
  }
  return new URLSearchParams(newQuery).toString()
}
const nextPage = (query) => {
  const newQuery= Object.assign({}, query)
  newQuery.offset = parseInt(query.offset, 10) || 0
  newQuery.limit = parseInt(query.limit, 10) || 20
  newQuery.offset += newQuery.limit
  return new URLSearchParams(newQuery).toString()
}
const prevPage = (query) => {
  const newQuery= Object.assign({}, query)
  newQuery.offset = parseInt(query.offset, 10) || 0
  newQuery.limit = parseInt(query.limit, 10) || 20
  if (newQuery.offset !== 0) {
    newQuery.offset -= newQuery.limit
  }
  return new URLSearchParams(newQuery).toString()
}
const indexPage = (data, query) => {
  const hasData = data.length > 0;
  const keys = data.length ? Object.keys(data[0]) : undefined;
  return `
    <!doctype html>
    <html lang="en">

    <head>
      <meta charset="utf-8">
      <title>Data breach browser</title>
      <meta name="description" content="">
      <meta name="viewport" content="width=device-width, initial-scale=1">

      <link rel="icon" href="/favicon.ico" sizes="any">
      <link rel="icon" href="/icon.svg" type="image/svg+xml">
      <link rel="apple-touch-icon" href="icon.png">

      <link rel="stylesheet" href="public/normalize.css">
      <link rel="stylesheet" href="public/index.css">

    </head>

    <body>
      <h1>Viewing all states</h1>
      ${ hasData ? (
        `<table>
          <thead>
            <tr>
              ${keys.map(key => (
                `<th>
                  <a href="/?${replaceSort(query, key)}">
                    ${key}
                  </a>
                </th>`
              )).join('') }
            </tr>
          </thead>
          <tbody>
            ${ data.map(entry => (
              `<tr>
                ${keys.map(key => (
                  `<td>${entry[key]}</td>`
                )).join('') }
              </tr>`
            )).join('') }
          </tbody>
          <tfoot>
            <a href="/?${prevPage(query)}">Previous page</a>
            |
            <a href="/?${nextPage(query)}">Next page</a>
          </tfoot>
        </table>`
      ) : (
        `<p>No data found that matches your query</p>`
      ) }
    </body>

    </html>
  `
}

const pick = (obj, keys) => (
  keys.reduce((acc, key) => {
     if (obj && obj.hasOwnProperty(key)) {
        acc[key] = obj[key]
     }
     return acc
  }, {})
)

const omit = (obj, keys) => {
  const exclude = new Set(keys)
  return Object.fromEntries(
    Object.entries(obj).filter(e => !exclude.has(e[0]))
  )
}

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
    let [comparison, target] = part.split(':')
    if (isDate) {
      target = new Date(target)
    }
    if (or) {
      if (
        (comparison === 'eq' && val === target) ||
        (comparison === 'gt' && !isNaN(val) && val > target) ||
        (comparison === 'lt' && !isNaN(val) && val < target) ||
        (!isDate && comparison === 'like' && val.indexOf(target) > -1)
      ) {
        match = true
        continue
      }
    } else {
      match = (
        (comparison === 'eq' && val === target) ||
        (comparison === 'gt' && !isNaN(val) && val > target) ||
        (comparison === 'lt' && !isNaN(val) && val < target) ||
        (!isDate && comparison === 'like' && val.indexOf(target) > -1)
      )
      if (!match) {
        break
      }
    }
  }
  return match
}

const extractQueryVars = (query) => {
  let {
    limit,
    offset,
    sort,
    desc,
    exclude,
    ...rest
  } = query
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
  if (exclude && exclude.length) { 
    exclude = exclude.split(',') 
  }
  const filters = Object.entries(pick(rest, COLUMNS))

  return {
    limit,
    offset,
    sort,
    desc,
    filters,
    exclude,
  }
}
const applyFilters = (filters) => (item) => (
  filters.reduce((match, [key, val]) => {
    return match && applyFilter(item[key], val, DATE_FIELDS.includes(key))
  }, true)
)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
fastify.register(helmet)
fastify.register(fstatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/public/', // optional: default '/'
})
fastify.get('/', async (req, reply) => {
  const {
    offset,
    limit,
    sort,
    desc,
    filters,
    exclude,
  } = extractQueryVars(req.query)
  const filterFn = applyFilters(filters)

  reply.type('text/html')
  const data = db.data.breaches
    .filter(filterFn)
    .sort(DATE_FIELDS.includes(sort) ? sortByDate(sort, desc) : sortBy(sort, desc))
    .slice(offset, offset + limit)
    .map(obj => exclude && exclude.length ? omit(obj, exclude) : obj)

  reply.send(indexPage(data, req.query))
})
// http://localhost:3000/?limit=10&sort=number_affected&desc&number_affected=gt:5000ANDlt:8000
// http://localhost:3000/?limit=10&sort=number_affected&desc&reported_date=gt:01/01/2023ANDlt:04/01/2023
// http://localhost:3000/?limit=20&sort=number_affected&desc&reported_date=gt:01/01/2022&state=eq:DE
// http://localhost:3000/?limit=20&sort=number_affected&desc&exclude=business_address,business_city,business_state,business_zip
fastify.get('/api/', async (req, reply) => {
  const {
    offset,
    limit,
    sort,
    desc,
    filters,
    exclude,
  } = extractQueryVars(req.query)
  const filterFn = applyFilters(filters)
  return db.data.breaches
    .filter(filterFn)
    .sort(DATE_FIELDS.includes(sort) ? sortByDate(sort, desc) : sortBy(sort, desc))
    .slice(offset, offset + limit)
    .map(obj => exclude && exclude.length ? omit(obj, exclude) : obj)
})

// http://localhost:3000/states/WA?limit=10&sort=number_affected&entity_name=like:Navigation&number_affected=lt:2200
// http://localhost:3000/states/WA?limit=10&sort=number_affected&desc&number_affected=gt:5000ANDlt:8000
// http://localhost:3000/states/DE?limit=20&sort=number_affected&desc&reported_date=gt:01/01/2022
// http://localhost:3000/states/WA?limit=20&sort=number_affected&desc&exclude=business_address,business_city,business_state,business_zip
// http://localhost:3000/states/DE?limit=20&sort=number_affected&desc&exclude=breach_dates
fastify.get('/api/states/:code', async (req, reply) => {
  const {
    offset,
    limit,
    sort,
    desc,
    filters,
    exclude,
  } = extractQueryVars(req.query)
  const { code: stateCode } = req.params

  const filterFn = applyFilters(filters)
  return db.data.breaches
    .filter((breach) => (
      breach.state === stateCode &&
      filterFn(breach)
    ))
    .sort(DATE_FIELDS.includes(sort) ? sortByDate(sort, desc) : sortBy(sort, desc))
    .slice(offset, offset + limit)
    .map(obj => pick(obj, COLS_BY_STATE[stateCode]))
    .map(obj => exclude && exclude.length ? omit(obj, exclude) : obj)
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
