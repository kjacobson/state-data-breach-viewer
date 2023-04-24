import {
  AND_COLUMNS,
  COLUMNS,
} from './columns.mjs'

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
export const filterRow = (column, statement, query) => {
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
    const clearURLBase = new URLSearchParams(query);
    clearURLBase.delete(column)
    return `
      <select name="filter_column">
        <option ${!column ? 'selected' : ''} value="">Select a column</option>
        ${COLUMNS.map(col => (
          `<option value="${col}" ${col === column ? 'selected' : ''}>${col}</option>`
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
      <input name="filter_value" type="text" value="${value}" placeholder="Enter a value" />
      ${ column !== '' && value === '' ? (
        `<a href="/?${clearURLBase.toString()}" title="Clear filters for this column">Clear</a>`
      ) : ''}
    `
  }).join(ANDorOR);
}
export const filtersSection = (query, appliedFilters) => {
  return `
    <form method="GET" action="/">
      ${ ['limit', 'offset', 'sort', 'desc'].map(param => (
        query[param] !== undefined
          ? `<input type="hidden" name="${param}" value="${query[param]}" />`
          : ''
      )).join('') }
      ${ appliedFilters.map((filter) => (
        filterRow(filter[0], filter[1], query)
      )).join('<br /><hr />') }
      <br /><hr />
      ${filterRow('', '')}
      <br />
      <button type="submit">Apply filters</button>
    </form>
    <form method="GET" action="/">
      ${ ['limit', 'offset', 'sort', 'desc'].map(param => (
        query[param] !== undefined
          ? `<input type="hidden" name="${param}" value="${query[param]}" />`
          : ''
      )).join('') }
      <button type="submit">Clear filters</button>
    </form>
  `
}
export const indexPage = (data, query, filters) => {
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
      <nav>
      ${filtersSection(query, filters)}
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
            <a href="/?${prevPageQuery(query)}">Previous page</a>
            |
            <a href="/?${nextPageQuery(query)}">Next page</a>
          </tfoot>
        </table>`
      ) : (
        `<p>No data found that matches your query</p>`
      ) }
    </body>

    </html>
  `
}
