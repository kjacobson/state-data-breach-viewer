import path from 'path'
import { fileURLToPath } from 'url';
import Fastify from 'fastify'
import fstatic from '@fastify/static'
import helmet from '@fastify/helmet'
import urlData from '@fastify/url-data'
import etag from '@fastify/etag'
import rateLimit from '@fastify/rate-limit'
import earlyHints from '@fastify/early-hints'
import { json2csv } from 'json-2-csv';
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
  indexPage,
  statePage,
  aboutPage,
  hipaaPage,
} from './templates.mjs'
import {
  staticFileName,
  staticHost,
} from './template-utils.mjs'

Array.prototype.do = function(fn) {
  fn(this)
  return this
}

const addPaginationData = (req, offset, limit) => (arr) => {
  const max = Math.min(offset + limit, arr.length)
  req.range = `entries ${offset + 1}-${max} of ${arr.length}`
  if (arr.length > offset + limit) {
    req.hasMore = true
  }
  if (offset > 0) {
    req.hasPrev = true
  }
}
const addPaginationResponseHeaders = (resp, offset, limit) => (arr) => {
  const max = Math.min(offset + limit, arr.length)
  resp.header('Content-Range', `entries ${offset + 1}-${max}/${arr.length}`)
}

let db
let lastUpdate
if (process.env.NODE_ENV === 'production') {
  const streamToString = (stream) => new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
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
  lastUpdate = new Date(dbFilesSorted[0].LastModified)
    .toLocaleString('en-US', { timeZone: 'America/New_York'})
  console.log("Last update was " + lastUpdate)

  console.log("Getting latest db file")
  const dbFile = await client.send(openDBCommand)
  console.log("Reading latest db file into memory")
  const dbFileStream = dbFile.Body
  const dbJSON = await streamToString(dbFileStream)
  const dbData = JSON.parse(dbJSON)

  console.log("Initializing memory DB")
  db = new Low(new Memory(), dbData)
} else {
  const { JSONFile } = await import('lowdb/node')
  const fileName = "20230429233241.json"
  db = new Low(new JSONFile(`./${fileName}`), {})
  lastUpdate = new Date(`${fileName.substring(4,6)}-${fileName.substring(6,8)}-${fileName.substring(0,4)}`)
    .toLocaleDateString('en-US', { timeZone: 'America/New_York'})
  console.log("Last update was " + lastUpdate)
}
process.env.LAST_UPDATE = lastUpdate
await db.read()

console.log("Starting fastify")
const fastify = Fastify({
  logger: true,
  ignoreTrailingSlash: true
})

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute'
})
fastify.register(helmet, {
  enableCSPNonces: true,
  contentSecurityPolicy: {
    directives: {
      "img-src": ["'self'", "*.topwords.me"],
      "style-src": ["'self'", "*.topwords.me"],
      "script-src": ["'self'", "*.topwords.me"],
    },
  }
})
fastify.register(earlyHints, {
  warn: true // default: false
})
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
fastify.get('/api/archive', async (req, reply) => {
  return dbFilesSorted
})
fastify.get('/about', async (req, reply) => {
  reply.type('text/html')
  reply.send(aboutPage(req, reply))
})
// http://localhost:3000/?limit=10&sort=number_affected&desc&number_affected=gt:5000[AND]lt:8000
// http://localhost:3000/?limit=10&sort=number_affected&desc&reported_date=gt:01/01/2023[AND]lt:04/01/2023
// http://localhost:3000/?limit=20&sort=number_affected&desc&reported_date=gt:01/01/2022&state=eq:DE
// http://localhost:3000/?limit=20&sort=number_affected&desc&exclude=business_address,business_city,business_state,business_zip
// http://localhost:3000/?limit=20&sort=number_affected&exclude=breach_dates&desc=&offset=0&state=eq:WA[OR]eq:DE&entity_name=like:yum
fastify.get('/', async (req, reply) => {
  reply.type('text/html')
  if (process.env.NODE_ENV !== 'production') {
    await reply.writeEarlyHints([
      { name: 'Content-Security-Policy', value: "img-src 'self' *.topwords.me;style-src 'self' *.topwords.me;script-src 'self' *.topwords.me;default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';object-src 'none';script-src-attr 'none';upgrade-insecure-requests" },
      { name: 'Link', value: `<${staticHost}/public/${staticFileName('normalize_css')}>; rel=preload; as=style` },
      { name: 'Link', value: `<${staticHost}/public/${staticFileName('index_css')}>; rel=preload; as=style` },
    ])
  }
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
    .do(addPaginationData(req, offset, limit))
    .sort(DATE_FIELDS.includes(sort) ? sortByDate(sort, desc) : sortBy(sort, desc))
    .slice(offset, offset + limit)
    .map(obj => exclude && exclude.length ? omit(obj, exclude) : obj)
    .map(obj => omit(obj, ['business_address', 'business_state', 'business_city', 'business_zip', 'notice_methods', 'dba']))

  reply.send(indexPage(req, reply, data, filters))
})
fastify.get('/breach-data.csv', async (req, reply) => {
  reply.type('text/csv')
  const {
    sort,
    desc,
    filters,
    exclude,
  } = extractQueryVars(req.query)
  const filterFn = applyFilters(filters)

  const data = db.data.breaches
    .filter(filterFn)
    .sort(DATE_FIELDS.includes(sort) ? sortByDate(sort, desc) : sortBy(sort, desc))
    .map(obj => exclude && exclude.length ? omit(obj, exclude) : obj)
  const csv = await json2csv(data, { emptyFieldValue: '' })
  reply.send(csv)
})
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
    .do(addPaginationResponseHeaders(reply, offset, limit))
    .sort(DATE_FIELDS.includes(sort) ? sortByDate(sort, desc) : sortBy(sort, desc))
    .slice(offset, offset + limit)
    .map(obj => exclude && exclude.length ? omit(obj, exclude) : obj)
})

fastify.get('/hipaa', async (req, reply) => {
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
    // data_source is HIPAA-only and is how we identify these sources
    // TODO: HIPAA boolean
    .filter((entry) => entry.data_source)
    .filter(filterFn)
    .do(addPaginationData(req, offset, limit))
    .sort(DATE_FIELDS.includes(sort) ? sortByDate(sort, desc) : sortBy(sort, desc))
    .slice(offset, offset + limit)
    .map(obj => pick(obj, COLS_BY_STATE.HIPAA))
    .map(obj => exclude && exclude.length ? omit(obj, exclude) : obj)

  reply.send(hipaaPage(req, reply, data, filters))
})
fastify.get('/hipaa.csv', async (req, reply) => {
  reply.type('text/csv')
  const {
    sort,
    desc,
    filters,
    exclude,
  } = extractQueryVars(req.query)
  const filterFn = applyFilters(filters)

  const data = db.data.breaches
    // data_source is HIPAA-only and is how we identify these sources
    .filter((entry) => entry.data_source)
    .filter(filterFn)
    .sort(DATE_FIELDS.includes(sort) ? sortByDate(sort, desc) : sortBy(sort, desc))
    .map(obj => pick(obj, COLS_BY_STATE.HIPAA))
    .map(obj => exclude && exclude.length ? omit(obj, exclude) : obj)

  const csv = await json2csv(data, { emptyFieldValue: '' })
  reply.send(csv)
})
fastify.get('/api/hipaa', async (req, reply) => {
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
    // data_source is HIPAA-only and is how we identify these sources
    .filter((entry) => entry.data_source)
    .filter(filterFn)
    .do(addPaginationResponseHeaders(reply, offset, limit))
    .sort(DATE_FIELDS.includes(sort) ? sortByDate(sort, desc) : sortBy(sort, desc))
    .slice(offset, offset + limit)
    .map(obj => pick(obj, COLS_BY_STATE.HIPAA))
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
    .do(addPaginationData(req, offset, limit))
    .sort(DATE_FIELDS.includes(sort) ? sortByDate(sort, desc) : sortBy(sort, desc))
    .slice(offset, offset + limit)
    .map(obj => pick(obj, COLS_BY_STATE[stateCode] || COLS_BY_STATE.HIPAA))
    .map(obj => exclude && exclude.length ? omit(obj, exclude) : obj)

  reply.send(statePage(req, reply, data, filters, stateCode))
})
fastify.get('/states/:code.csv', async (req, reply) => {
  reply.type('text/csv')
  const {
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
    .map(obj => pick(obj, COLS_BY_STATE[stateCode] || COLS_BY_STATE.HIPAA))
    .map(obj => exclude && exclude.length ? omit(obj, exclude) : obj)

  const csv = await json2csv(data, { emptyFieldValue: '' })
  reply.send(csv)
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
    .do(addPaginationResponseHeaders(reply, offset, limit))
    .sort(DATE_FIELDS.includes(sort) ? sortByDate(sort, desc) : sortBy(sort, desc))
    .slice(offset, offset + limit)
    .map(obj => pick(obj, COLS_BY_STATE[stateCode] || COLS_BY_STATE.HIPAA))
    .map(obj => exclude && exclude.length ? omit(obj, exclude) : obj)
})

const teardown = () => {
  return new Promise((resolve, reject) => {
    fastify.log.info('Tearing down server')
    return fastify.close().then(() => {
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
    if (process.send) {
      process.send('ready')
    }
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
