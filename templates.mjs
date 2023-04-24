import {
  AND_COLUMNS,
  COLUMNS,
  COLUMN_DISPLAY_NAMES,
} from './columns.mjs'

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
  return clauses.map((clause) => {
    const [comparison, value] = clause ? clause.split(":") : ['', '']
    const clearURLBase = new URLSearchParams(req.query);
    clearURLBase.delete(column)
    return `
      <select name="filter_column">
        <option ${!column ? 'selected' : ''} value="">Select a column</option>
        ${COLUMNS.map(col => (
          `<option value="${col}" ${col === column ? 'selected' : ''}>${COLUMN_DISPLAY_NAMES[col]}</option>`
        )).join('')}
      </select>
      <select name="filter_comp">
        <option value="eq" ${comparison === 'eq' ? 'selected' : ''}>=</option>
        <option value="like" ${comparison === 'like' ? 'selected' : ''}>contains</option>
        <option value="gt" ${comparison === 'gt' ? 'selected' : ''}>&gt;</option>
        <option value="gte" ${comparison === 'gte' ? 'selected' : ''}>&gt;=</option>
        <option value="lt" ${comparison === 'lt' ? 'selected' : ''}>&lt;</option>
        <option value="lte" ${comparison === 'lte' ? 'selected' : ''}>&lt;=</option>
      </select>
      <input name="filter_value" type="text" value="${value}" placeholder="Enter a value" size="18" />
      ${ column !== '' && value === '' ? (
        `<a href="${req.routerPath}?${clearURLBase.toString()}" title="Clear filters for this column">Clear</a>`
      ) : ''}
    `
  }).join(ANDorOR);
}
export const filtersSection = (req, appliedFilters) => {
  const query = req.query
  return `
    <form method="GET" action="/">
      ${ ['limit', 'offset', 'sort', 'desc'].map(param => (
        query[param] !== undefined
          ? `<input type="hidden" name="${param}" value="${query[param]}" />`
          : ''
      )).join('') }
      ${ appliedFilters.map((filter) => (
        filterRow(filter[0], filter[1], req)
      )).join('<br /><hr />') }
      <br /><hr />
      ${filterRow('', '', req)}
      <br />
      <button type="submit">Apply filters</button>
    </form>
    <form method="GET" action="${req.routerPath}">
      ${ ['limit', 'offset', 'sort', 'desc'].map(param => (
        query[param] !== undefined
          ? `<input type="hidden" name="${param}" value="${query[param]}" />`
          : ''
      )).join('') }
      <button type="submit">Clear filters</button>
    </form>
  `
}
const tableCell = (key, val) => {
  if (Array.isArray(val)) {
    val = val.join(', ')
  }
  if (key === 'letter_url') {
    return `<a href="${val}">View letter</a>`
  } else
  if (key === 'url') {
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

      <link rel="stylesheet" href="/public/normalize.css">
      <link rel="stylesheet" href="/public/index.css">

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
      <a href="${req.routerPath}?${prevPageQuery(req.query)}">Previous page</a>
      |
      <a href="${req.routerPath}?${nextPageQuery(req.query)}">Next page</a>
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
      <table>
        <thead>
          <tr>
            ${keys.map(key => (
              `<th>
                <a href="/?${replaceSort(req.query, key)}" title="Sort by ${COLUMN_DISPLAY_NAMES[key]}${req.query.desc === 'undefined' ? ' ( descending )' : ''}">
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
      </table>`
    ) : (
      `<p>No data found that matches your query</p>`
    ) }
    ${pagination(req)}
  `
}
export const indexPage = (data, req, filters) => {
  return wrapper('Home', `
    <header>
      <h1>Viewing data for all states</h1>
      ${stateMenu()}
    </header>
    <main>
      ${dataTable(data, req, filters)}
    </main>
  `)
}
export const statePage = (data, req, filters, state) => {
  return wrapper(state, `
    <header>
      <h1>Viewing data for ${STATES[state]}</h1>
      ${stateMenu()}
    </header>
    <main>
      ${dataTable(data, req, filters)}
    </main>
  `)
}
