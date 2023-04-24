import path from 'path'
import { fileURLToPath } from 'url';
import Fastify from 'fastify'
import fstatic from '@fastify/static'
import helmet from '@fastify/helmet'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import {
  DATE_FIELDS,
  AND_COLUMNS,
  COLUMNS,
  COLS_BY_STATE,
} from './columns.mjs'
import {
  extractQueryVars,
  applyFilters,
  sortBy,
  sortByDate,
  pick,
  omit,
} from './query-utils.mjs'
import {
  filterRow,
  filtersSection,
  indexPage,
  statePage,
} from './templates.mjs'


const fastify = Fastify({ logger: true })

const db = new Low(new JSONFile('./4202023213037.json'), {})
await db.read()


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
fastify.register(helmet)
fastify.register(fstatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/public/', // optional: default '/'
})
/**
 * It's hard to build compound queries for multiple fields using a form
 * without an extremely verbose querystirng.
 * We let the form build that verbose querystring, but then we redirect
 * to a URL that's easier to read and manipulate, but represents the same
 * filters.
 */
fastify.addHook('onRequest', (request, reply, done) => {
  let {
    filter_column,
    filter_comp,
    filter_value,
    ...rest
  } = request.query
  if (filter_column) {
    console.log("Received a form submission for: " + request.url)
    filter_column = Array.isArray(filter_column) ? filter_column : [ filter_column ]
    filter_comp = Array.isArray(filter_comp) ? filter_comp : [ filter_comp ]
    filter_value = Array.isArray(filter_value) ? filter_value : [ filter_value ]
    const newQuery = filter_column.reduce((acc, col, i) => {
      if (filter_value[i]) {
        if (acc[col]) {
          acc[col] += (AND_COLUMNS.includes(col) ? '[AND]' : '[OR]') + filter_comp[i] + ':' + filter_value[i]
        } else if (col) {
          acc[col] = filter_comp[i] + ':' + filter_value[i]
        }
      }
      return acc;
    }, Object.assign({}, rest))
    const redirectPath = request.routerPath + '?' + new URLSearchParams(newQuery).toString()
    console.log("Redirecting to: " + redirectPath)
    reply.redirect(302, redirectPath)
    done()
  }
  done()
})
fastify.get('/', async (req, reply) => {
  reply.type('text/html')
  const {
    offset,
    limit,
    sort,
    desc,
    filters,
    exclude,
  } = extractQueryVars(req.query)
  const filterFn = applyFilters(filters)

  const data = db.data.breaches
    .filter(filterFn)
    .sort(DATE_FIELDS.includes(sort) ? sortByDate(sort, desc) : sortBy(sort, desc))
    .slice(offset, offset + limit)
    .map(obj => exclude && exclude.length ? omit(obj, exclude) : obj)

  reply.send(indexPage(data, req, filters))
})
// http://localhost:3000/?limit=10&sort=number_affected&desc&number_affected=gt:5000[AND]lt:8000
// http://localhost:3000/?limit=10&sort=number_affected&desc&reported_date=gt:01/01/2023[AND]lt:04/01/2023
// http://localhost:3000/?limit=20&sort=number_affected&desc&reported_date=gt:01/01/2022&state=eq:DE
// http://localhost:3000/?limit=20&sort=number_affected&desc&exclude=business_address,business_city,business_state,business_zip
// http://localhost:3000/?limit=20&sort=number_affected&exclude=breach_dates&desc=&offset=0&state=eq:WA[OR]eq:DE&entity_name=like:yum
fastify.get('/api', async (req, reply) => {
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
// http://localhost:3000/states/WA?limit=10&sort=number_affected&desc&number_affected=gt:5000[AND]lt:8000
// http://localhost:3000/states/DE?limit=20&sort=number_affected&desc&reported_date=gt:01/01/2022
// http://localhost:3000/states/WA?limit=20&sort=number_affected&desc&exclude=business_address,business_city,business_state,business_zip
// http://localhost:3000/states/DE?limit=20&sort=number_affected&desc&exclude=breach_dates
fastify.get('/states/:code', async (req, reply) => {
  reply.type('text/html')
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
  const data = db.data.breaches
    .filter((breach) => (
      breach.state === stateCode &&
      filterFn(breach)
    ))
    .sort(DATE_FIELDS.includes(sort) ? sortByDate(sort, desc) : sortBy(sort, desc))
    .slice(offset, offset + limit)
    .map(obj => pick(obj, COLS_BY_STATE[stateCode]))
    .map(obj => exclude && exclude.length ? omit(obj, exclude) : obj)

  reply.send(statePage(data, req, filters, stateCode))
})
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
