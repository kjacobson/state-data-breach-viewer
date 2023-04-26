import STATIC_FILES from './static-files.json' assert { type: "json" }
import {
  AND_COLUMNS,
  COLUMNS,
  COLUMN_DISPLAY_NAMES,
} from './columns.mjs'

const isProd = process.env.NODE_ENV === "production"
const staticFileName = (key) => {
  const { name, hash, ext } = STATIC_FILES[key]
  return `${name}${isProd ? '!' + hash : ''}.${ext}`
}
const staticHost = isProd ? 'https://breach-assets.topwords.me' : ''

const STATES = {
  CA: 'California',
  DE: 'Delaware',
  HI: 'Hawaii',
  IA: 'Iowa',
  ME: 'Maine',
  MD: 'Maryland',
  MT: 'Montana',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  ND: 'North Dakota',
  TX: 'Texas',
  WA: 'Washington',
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
export const nextPageQuery = (query) => {
  const newQuery= Object.assign({}, query)
  newQuery.offset = parseInt(query.offset, 10) || 0
  newQuery.limit = parseInt(query.limit, 10) || 20
  newQuery.offset += newQuery.limit
  return new URLSearchParams(newQuery).toString()
}
const prevPageQuery = (query) => {
  const newQuery= Object.assign({}, query)
  newQuery.offset = parseInt(query.offset, 10) || 0
  newQuery.limit = parseInt(query.limit, 10) || 20
  if (newQuery.offset !== 0) {
    newQuery.offset -= newQuery.limit
  }
  return new URLSearchParams(newQuery).toString()
}
const FILTER_VALUE_WIDTHS = {
  state: 2,
  business_state: 2,
  business_zip: 5,
  state_date: 10,
  end_date: 10,
  reported_date: 10,
  published_date: 10,
  entity_name: 20,
  dba: 20,
}
export const filterRow = (column, statement, req) => {
  const ANDorOR = (statement.includes("AND")
    ? "AND"
    : ( statement.includes("OR")
      ? "OR" : (
        AND_COLUMNS.includes(column) ? "AND" : "OR"
      )
    )
  )
  const clauses = statement.split(/\[(?:AND|OR)\]/)
  if (column !== '') {
    clauses.push('eq:')
  }
  return `
    <div class="table-filter">
      ${ clauses.map((clause) => {
        const [comparison, value] = clause ? clause.split(":") : ['', '']
        const clearURLBase = new URLSearchParams(req.query);
        clearURLBase.delete(column)
        return `
          <label>
            Column
            <br />
            <select name="filter_column">
              <option ${!column ? 'selected' : ''} value="">---</option>
              ${COLUMNS.map(col => (
                `<option value="${col}" ${col === column ? 'selected' : ''}>${COLUMN_DISPLAY_NAMES[col]}</option>`
              )).join('')}
            </select>
          </label>
          <label>
            Filter type
            <br />
            <select name="filter_comp">
              <option value="eq" ${comparison === 'eq' ? 'selected' : ''}>=</option>
              <option value="like" ${comparison === 'like' ? 'selected' : ''}>contains</option>
              <option value="gt" ${comparison === 'gt' ? 'selected' : ''}>&gt;</option>
              <option value="gte" ${comparison === 'gte' ? 'selected' : ''}>&gt;=</option>
              <option value="lt" ${comparison === 'lt' ? 'selected' : ''}>&lt;</option>
              <option value="lte" ${comparison === 'lte' ? 'selected' : ''}>&lt;=</option>
            </select>
          </label>
          <label>
            Value
            <br />
            <input name="filter_value" type="text" value="${value}" placeholder="${column ? '???' : 'Enter a value'}" size="${FILTER_VALUE_WIDTHS[column] || 18}" />
          </label>
          ${ column !== '' && value === '' ? (
            `<a href="${req.urlData().path}?${clearURLBase.toString()}" title="Clear filters for this column">Clear</a>`
          ) : ''}
        `
      }).join(ANDorOR) }
    </div>
  `
}
export const filtersSection = (req, appliedFilters) => {
  const query = req.query
  const {
    limit,
    offset,
    sort,
    desc,
  } = query
  const clearQuery = new URLSearchParams()
  if (limit) { clearQuery.set('limit', limit) }
  if (offset) { clearQuery.set('offset', offset) }
  if (sort) { clearQuery.set('sort', sort) }
  if (desc !== undefined) { clearQuery.set('desc', '') }
  return `
    <form method="GET" action="/">
      <fieldset>
        <legend>Filter results</legend>
      ${ ['limit', 'offset', 'sort', 'desc'].map(param => (
        query[param] !== undefined
          ? `<input type="hidden" name="${param}" value="${query[param]}" />`
          : ''
      )).join('') }
      ${ appliedFilters.map((filter) => (
        filterRow(filter[0], filter[1], req)
      )).join('') }
      ${filterRow('', '', req)}
      <button type="submit">Apply filters</button>
      <a href="${req.urlData().path}?${clearQuery.toString()}">Clear all filters</a>
      </fieldset>
    </form>
  `
}

const tableCell = (key, val) => {
  if (Array.isArray(val)) {
    val = val.join(', ')
  }
  if (key === 'letter_url' && val !== 'N/A') {
    return `<a href="${val}">View letter</a>`
  } else
  if (key === 'url' && val) {
    return `<a href="${val}">Details</a>`
  } else {
    return val
  }
}
const wrapper = (title, bodyContent) => {
  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Data breach browser - ${title}</title>
        <meta name="description" content="">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/icon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="icon.png">

        <link rel="stylesheet" href="${staticHost}/public/${staticFileName('normalize_css')}">
        <link rel="stylesheet" href="${staticHost}/public/${staticFileName('index_css')}">
      </head>
      <body>
        ${bodyContent}
      </body>
    </html>
  `
}
const stateMenu = (currentState) => {
  return `
    <nav>
      <ol>
        <li>
          ${ !currentState ? '<strong>' : '' }
          <a href="/">All states</a>
          ${ !currentState ? '</strong>' : '' }
        </li>
        ${` | `}
        ${Object.entries(STATES).map(([code, displayName]) => (
          `<li>
            ${ currentState === code ? '<strong>' : '' }
            <a href="/states/${code}">${displayName}</a>
            ${ currentState === code ? '</strong>' : '' }
          </li>`
        )).join(" | ") }
      </ol>
    </nav>
  `
}

const pagination = (req) => {
  return `
    <div class="pagination">
      <a href="${req.urlData().path}?${prevPageQuery(req.query)}">Previous page</a>
      |
      <a href="${req.urlData().path}?${nextPageQuery(req.query)}">Next page</a>
    </div>
  `
}

const dataTable = (data, req, filters) => {
  const keys = data.length ? Object.keys(data[0]) : undefined
  const hasData = data.length > 0
  return ` 
    ${filtersSection(req, filters)}
    ${ hasData ? (
      `
      ${pagination(req)}
      <div class="table-container">
        <table>
          <thead>
            <tr>
              ${keys.map(key => (
                `<th>
                  <a href="${req.urlData().path}?${replaceSort(req.query, key)}" title="Sort by ${COLUMN_DISPLAY_NAMES[key]}${req.query.desc === 'undefined' ? ' ( descending )' : ''}">
                    ${COLUMN_DISPLAY_NAMES[key]}
                  </a>
                </th>`
              )).join('') }
            </tr>
          </thead>
          <tbody>
            ${ data.map(entry => (
              `<tr>
                ${keys.map(key => (
                  `<td>
                    ${tableCell(key, entry[key])}
                  </td>`
                )).join('') }
              </tr>`
            )).join('') }
          </tbody>
        </table>
      </div>
      `
    ) : (
      `<p>No data found that matches your query</p>`
    ) }
    ${pagination(req)}
  `
}
export const indexPage = (data, req, filters) => {
  return wrapper('Home', `
    <header>
      ${stateMenu()}
      <h1>Data breach information for all states</h1>
    </header>
    <main>
      ${dataTable(data, req, filters)}
    </main>
  `)
}
export const statePage = (data, req, filters, state) => {
  return wrapper(state, `
    <header>
      ${stateMenu(state)}
      <h1>Viewing data for ${STATES[state]}</h1>
    </header>
    <main>
      ${dataTable(data, req, filters)}
    </main>
  `)
}
