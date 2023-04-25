import path from 'path'
import { fileURLToPath } from 'url';
import Fastify from 'fastify'
import fstatic from '@fastify/static'
import helmet from '@fastify/helmet'
import urlData from '@fastify/url-data'
import etag from '@fastify/etag'
import rateLimit from '@fastify/rate-limit'
import { Low, Memory } from 'lowdb'
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3"
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

let db
if (process.env.NODE_ENV === 'production') {
  const client = new S3Client({ region: 'us-east-1' })
  let listDBCommand = new ListObjectsV2Command({
    Bucket: "ksj-lambda-zips",
    Delimiter: "",
    EncodingType: "url",
    MaxKeys: 100,
    Prefix: "database/",
  })
  console.log("Getting db files from S3")
  const allDBFiles = await client.send(listDBCommand)
  const dbFilesSorted = allDBFiles.Contents.sort(sortBy("LastModified")).reverse()
  let openDBCommand = new GetObjectCommand({
    Bucket: "ksj-lambda-zips",
    Key: dbFilesSorted[0].Key,
  })
  console.log("Getting latest db file")
  const dbFile = await client.send(openDBCommand)
  console.log("Reading latest db file into memory")
  const dbFileStream = dbFile.Body
  let dbData = ""
  for await (const chunk of dbFileStream) {
    dbData += chunk.toString('utf-8')
  }
  dbData = JSON.parse(dbData)

  console.log("Initializing memory DB")
  db = new Low(new Memory(), dbData)
} else {
  const { JSONFile } = await import('lowdb/node')
  db = new Low(new JSONFile('./20230424190949.json'), {})
}
await db.read()

console.log("Starting fastify")
const fastify = Fastify({ logger: true })

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute'
})
fastify.register(helmet)
if (process.env.NODE_ENV !== 'production') {
  fastify.register(fstatic, {
    root: path.join(__dirname, 'public'),
    prefix: '/public/', // optional: default '/'
  })
}
fastify.register(urlData)
fastify.register(etag, {
  algorithm: 'fnv1a'
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
    const redirectPath = request.urlData().path + '?' + new URLSearchParams(newQuery).toString()
    console.log("Redirecting to: " + redirectPath)
    reply.redirect(302, redirectPath)
    done()
  }
  done()
})
fastify.get('/archive', async (req, reply) => {
  return dbFilesSorted
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
    .map(obj => omit(obj, ['business_address', 'business_state', 'business_city', 'business_zip']))

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

const teardown = () => {
  return new Promise((resolve, reject) => {
    fastify.log.info('Tearing down server')
    fastify.close().then(() => {
      fastify.log.info('Successfully closed server connection')
      process.exit(0)
    }, (err) => {
      fastify.log.error('Error closing server connection')
      process.exit(1)
    })
  })
}
const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3000 })
    process.send('ready')
    process.on('SIGINT', async () => {
      /**
       * We might see this signal in prod if pm2 restarts a process
       * due to high memory usage, but we'll rely on other monitoring
       * for this.
       *
       * If a process fails we won't see this.
       */
      fastify.log.info('SIGINT')
      await teardown()
    })
    process.on('SIGTERM', async () => {
      fastify.log.info('SIGTERM')
      await teardown()
    })
    process.on('message', async (msg) => {
      if (msg == 'shutdown') {
        await teardown()
      }
    })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()
