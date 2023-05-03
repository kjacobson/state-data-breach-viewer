import {
  AND_COLUMNS,
  COLUMNS,
  COLS_BY_STATE,
  COLUMN_DISPLAY_NAMES,
  COLUMN_DATA_DEFAULTS,
} from './columns.mjs'
import {
  STATES,
  FILTER_VALUE_WIDTHS,
  staticFileName,
  staticHost,
  replaceSort,
  nextPageQuery,
  prevPageQuery,
  csvURL,
} from './template-utils.mjs'

const normalizeCSS = (nonce) => (
    `<style nonce="${nonce}">html {line-height: 1.15;-webkit-text-size-adjust: 100%;}body {margin: 0;}main {display: block;}h1 {font-size: 2em;margin: 0.67em 0;}hr {box-sizing: content-box;height: 0;overflow: visible;}pre {font-family: monospace, monospace;font-size: 1em;}a {background-color: transparent;}abbr[title] {border-bottom: none;text-decoration: underline;text-decoration: underline dotted;}b, strong {font-weight: bolder;}code, kbd, samp {font-family: monospace, monospace;font-size: 1em;}small {font-size: 80%;}sub, sup {font-size: 75%;line-height: 0;position: relative;vertical-align: baseline;}sub {bottom: -0.25em;}sup {top: -0.5em;}img {border-style: none;}button, input, optgroup, select, textarea {font-family: inherit;font-size: 100%;line-height: 1.15;margin: 0;}button, input {overflow: visible;}button, select {text-transform: none;}button, [type="button"], [type="reset"], [type="submit"] {-webkit-appearance: button;}button::-moz-focus-inner, [type="button"]::-moz-focus-inner, [type="reset"]::-moz-focus-inner, [type="submit"]::-moz-focus-inner {border-style: none;padding: 0;}button:-moz-focusring, [type="button"]:-moz-focusring, [type="reset"]:-moz-focusring, [type="submit"]:-moz-focusring {outline: 1px dotted ButtonText;}fieldset {padding: 0.35em 0.75em 0.625em;}legend {box-sizing: border-box;color: inherit;display: table;max-width: 100%;padding: 0;white-space: normal;}progress {vertical-align: baseline;}textarea {overflow: auto;}[type="checkbox"], [type="radio"] {box-sizing: border-box;padding: 0;}[type="number"]::-webkit-inner-spin-button, [type="number"]::-webkit-outer-spin-button {height: auto;}[type="search"] {-webkit-appearance: textfield;outline-offset: -2px;}[type="search"]::-webkit-search-decoration {-webkit-appearance: none;}::-webkit-file-upload-button {-webkit-appearance: button;font: inherit;}details {display: block;}summary {display: list-item;}template {display: none;}[hidden] {display: none;}</style>`
)

const csvIcon = `
    <svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 5120 5120" preserveAspectRatio="xMidYMid meet">
      <g id="layer101" fill="rgb(17, 137, 13)" stroke="none">
        <path d="M2636 5068 c-14 -18 -69 -91 -122 -163 -118 -160 -117 -159 -199 -270 -37 -49 -78 -105 -93 -124 -15 -18 -31 -40 -36 -49 -5 -8 -14 -22 -22 -31 -7 -9 -45 -59 -83 -111 -39 -52 -82 -108 -96 -125 -28 -34 -40 -67 -31 -90 4 -12 33 -15 170 -15 136 0 167 -3 180 -16 14 -13 16 -58 16 -340 l0 -326 30 -29 29 -30 325 3 324 3 26 28 26 28 0 322 c0 185 4 328 10 337 7 12 43 16 182 20 167 5 173 6 176 26 2 15 -103 164 -349 495 -193 261 -357 477 -363 481 -6 4 -25 8 -43 8 -25 0 -38 -8 -57 -32z" />
        <path d="M1062 4567 l-22 -23 0 -592 0 -592 26 -10 c36 -14 148 -12 162 2 9 9 12 137 12 513 0 376 3 504 12 513 9 9 102 12 358 12 262 0 350 3 362 13 23 18 128 162 128 175 0 9 -129 12 -508 12 l-509 0 -21 -23z"/>
        <path d="M3290 4579 c0 -11 77 -116 118 -161 l26 -28 353 0 c339 0 353 -1 363 -20 7 -13 9 -550 8 -1710 -3 -1490 -5 -1692 -18 -1700 -9 -6 -156 -10 -348 -10 l-333 0 -24 -25 -25 -24 0 -335 c0 -321 -1 -336 -19 -346 -30 -16 -2123 -14 -2139 2 -9 9 -12 180 -12 710 0 679 -1 698 -19 708 -27 14 -154 13 -169 -2 -9 -9 -12 -199 -12 -794 0 -755 1 -783 19 -805 l19 -24 1229 -3 c815 -2 1240 1 1263 7 27 8 124 99 410 386 l375 375 0 1881 0 1881 -28 24 -28 24 -505 0 c-353 0 -504 -3 -504 -11z" />
        <path d="M802 3150 c-12 -5 -27 -21 -32 -35 -6 -16 -10 -255 -10 -621 0 -629 1 -641 45 -658 21 -8 2702 -8 2731 0 12 3 29 20 38 37 16 29 17 88 14 634 l-3 601 -24 26 -24 26 -1356 -1 c-790 0 -1365 -4 -1379 -9z m2160 -219 c54 -1 68 -4 72 -18 21 -74 193 -658 217 -733 16 -53 29 -99 29 -103 0 -4 -58 -7 -129 -7 l-128 0 -54 210 c-30 115 -57 206 -61 202 -4 -4 -25 -81 -48 -172 -23 -91 -45 -182 -51 -202 l-10 -38 -134 0 c-104 0 -135 3 -135 13 0 7 15 67 34 132 18 66 36 129 39 140 3 11 24 85 46 165 23 80 58 204 79 277 l37 132 35 3 c19 2 49 2 65 1 17 -1 60 -2 97 -2z m-1299 -29 c26 -11 47 -25 47 -29 -1 -6 -26 -128 -29 -140 -1 -2 -1 -13 -1 -25 0 -44 -11 -48 -70 -28 -97 34 -178 24 -232 -27 -36 -35 -51 -84 -51 -165 1 -76 28 -136 75 -171 38 -28 129 -34 188 -12 25 9 52 19 61 22 14 4 21 -12 39 -94 13 -54 23 -104 24 -111 1 -8 -21 -23 -49 -35 -41 -17 -71 -21 -170 -22 -115 0 -123 1 -187 32 -184 87 -270 284 -227 518 26 144 131 262 266 301 74 21 255 13 316 -14z m605 4 c50 -26 111 -85 135 -130 17 -32 21 -59 22 -126 0 -76 -3 -89 -27 -127 -41 -63 -75 -90 -165 -134 -96 -47 -109 -59 -93 -88 17 -34 101 -24 212 23 14 6 19 -1 28 -36 6 -23 15 -54 21 -68 5 -14 10 -43 12 -64 2 -39 2 -39 -58 -64 -51 -22 -76 -26 -170 -26 -92 -1 -118 3 -155 20 -138 64 -196 232 -125 362 35 64 73 96 183 151 69 35 82 45 82 66 0 30 -26 45 -80 45 -44 0 -148 -31 -186 -57 -13 -8 -24 -14 -24 -12 0 2 -7 42 -15 89 -8 47 -15 95 -15 107 0 29 34 51 118 74 86 24 249 22 300 -5z" />
      </g>
    </svg>
  `

const filterRow = (column, statement, req) => {
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
  const cols = req.params.code ? COLS_BY_STATE[req.params.code] || COLS_BY_STATE.HIPAA.filter(col => col !== 'state') : COLUMNS
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
              ${cols.map(col => (
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
const filtersSection = (req, appliedFilters) => {
  const query = req.query
  const {
    limit,
    offset,
    sort,
    desc,
  } = query
  const clearQuery = new URLSearchParams()
  if (limit) { clearQuery.set('limit', limit) }
  if (offset) { clearQuery.set('offset', 0) }
  if (sort) { clearQuery.set('sort', sort) }
  if (desc !== undefined) { clearQuery.set('desc', '') }
  return `
    <form method="GET" action="${req.urlData().path}">
      <fieldset>
        <legend>Filter results</legend>
        <input type="hidden" name="offset" value="0" />
        ${ ['limit', 'sort', 'desc'].map(param => (
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
  } else
  if (!isNaN(val)) {
    val = val.toLocaleString("en-US")
  }
  if (key === 'letter_url' && val !== '') {
    return `<a href="${val}">View letter</a>`
  } else
  if (key === 'url' && val) {
    return `<a href="${val}">Details</a>`
  } else {
    return val || COLUMN_DATA_DEFAULTS[key]
  }
}
const wrapper = (req, resp, title, bodyContent) => {
  // <link rel="icon" href="/icon.svg" type="image/svg+xml">
  // <link rel="apple-touch-icon" href="icon.png">
  // <link rel="stylesheet" href="${staticHost}/public/${staticFileName('normalize_css')}">
  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>State data breach browser - ${title}</title>
        <meta name="description" content="">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <link rel="icon" href="${staticHost}/public/${staticFileName('favicon')}" sizes="any">
        <link rel="icon" type="image/png" sizes="16x16" href="${staticHost}/public/${staticFileName('favicon')}">
        <link rel="icon" type="image/png" sizes="32x32" href="${staticHost}/public/${staticFileName('favicon')}">
        <link rel="apple-touch-icon" sizes="180x180" href="${staticHost}/public/${staticFileName('favicon')}">
        ${normalizeCSS(resp.cspNonce.style)}
        <link rel="stylesheet" href="${staticHost}/public/${staticFileName('index_css')}">
      </head>
      <body>
        ${bodyContent}
        ${footer()}
      </body>
    </html>
  `
}
const stateMenu = (currentState, about = false) => {
  return `
    <nav>
      <ol>
        <li>
          ${ !currentState && !about ? '<strong>' : '' }
          <a href="/" title="View data for all states">All states</a>
          ${ !currentState && !about ? '</strong>' : '' }
        </li>
        ${` · `}
        <li>
          ${ currentState === "HIPAA" ? '<strong>' : '' }
          <a href="/hipaa">HIPAA</a>
          ${ currentState === "HIPAA" ? '</strong>' : '' }
        </li>
        ${` · `}
        ${Object.entries(STATES).map(([code, { name, site}]) => (
          `<li>
            ${ currentState === code ? '<strong>' : '' }
            <a href="/states/${code}" title="View data for ${name}">${code}</a>
            ${ currentState === code ? '</strong>' : '' }
          </li>`
        )).join(" · ") }
      </ol>
    </nav>
  `
}

const pagination = (req) => {
  const hasMore = !!req.hasMore
  const hasPrev = !!req.hasPrev
  return `
    <div class="pagination">
      <span class="pagination-range">Showing ${req.range}</span>
      <span class="pagination-links">
        ${hasPrev ? `<a href="${req.urlData().path}?${prevPageQuery(req.query)}">Previous page</a>` : ""}
        ${hasMore && hasPrev ? " | " : ""}
        ${hasMore ? `<a href="${req.urlData().path}?${nextPageQuery(req.query)}">Next page</a>` : "" }
      </span>
    </div>
  `
}

const footer = () => {
  return `
    <footer>
      <p>Data last updated at: ${process.env.LAST_UPDATE} (Eastern Time)</p>
      <nav>
        <a href="/about">About this site</a>
      </nav>
    </footer>
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
              <th colspan=${keys.length}>
                <a href="${csvURL(req.urlData().path, req.query)}" title="Download all pages as a CSV">
                  Download CSV
                  ${csvIcon}
                </a>
              </th>
            </tr>
            <tr>
              ${keys.map(key => (
                `<th>
                  <a
                    href="${req.urlData().path}?${replaceSort(req.query, key)}"
                    title="Sort by ${COLUMN_DISPLAY_NAMES[key]}${req.query.desc === undefined ? ' (descending)' : ''}"
                  >
                    ${COLUMN_DISPLAY_NAMES[key]}&nbsp;${ req.query.sort === key || (!req.query.sort && key === 'reported_date') ? (
                      req.query.desc === undefined && !(key === 'reported_date' && !req.query.sort)
                      ? "<span class='sorted-desc'>⬇</span>"
                      : "<span class='sorted-asc'>⬆</span>"
                    ) : "<span class='unsorted'>⬍</span>" }
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
      ${pagination(req)}
      `
    ) : (
      `<p>No data found that matches your query</p>`
    ) }
  `
}
export const indexPage = (req, resp, data, filters) => {
  return wrapper(req, resp, 'Home', `
    <header>
      ${stateMenu()}
      <h1>Data breach information for all states</h1>
    </header>
    <main>
      ${dataTable(data, req, filters)}
    </main>
  `)
}
export const statePage = (req, resp, data, filters, state) => {
  return wrapper(req, resp, state, `
    <header>
      ${stateMenu(state)}
      <h1>Viewing data for ${STATES[state].name}${COLS_BY_STATE[state] ? '' : '*'}</h1>
      ${COLS_BY_STATE[state] ? '' : '<p>* data from HHS (HIPAA) breach database only</p>'}
    </header>
    <main>
      ${dataTable(data, req, filters)}
    </main>
  `)
}
export const hipaaPage = (req, resp, data, filters) => {
  return wrapper(req, resp, 'HIPAA', `
    <header>
      ${stateMenu('HIPAA')}
      <h1>Data for all states from the HIPAA breach database</h1>
    </header>
    <main>
      ${dataTable(data, req, filters)}
    </main>
  `)
}
export const aboutPage = (req, resp) => {
  return wrapper(req, resp, 'About', `
    <header>
      ${stateMenu('', true)}
      <h1>About this site</h1>
    </header>
    <main>
      <h2>
        Why does this site exist?
      </h2>
      <p>
        There is no standard format for state data breach reporting and it's difficult to compare information on major
        data breaches across states. I'm hoping this site will help researchers, journalists, and curious people quickly
        look up data breach information. Instead of routinely visiting a dozen state AG websites, you can just bookmark this one.
      </p>
      <h2>
        Where does the data come from?
      </h2>
      <p>
        Many states have laws requiring private entities, and sometimes state government entities, to report 
        data breaches involving residents' identifying information (PII) to state authorities, usually attorneys general.
        Not all states have such laws and the specifics of such laws&mdash;such as the threshold of affected residents above which
        a breach must be reported, what constitutes PII, and what information must be reported to authorities&mdash;vary considerably. 
        Regardless, many state AGs (and other relevant authorities) maintain websites providing information about reported breaches,
        generally as a required by law. The data on this site is gleaned from those websites, which are, as follows, as well as the HIPAA
        data breach database:
      </p>
      <ul>
        ${ Object.entries(STATES).map(([code, { name, site }]) => (
          site ? `<li>
            ${name}: <a href="${site}" target="new">${site}</a>
          </li>` : ''
        )).join('') }
        <li>
            All other states: HIPAA database at
            <a href="https://ocrportal.hhs.gov/ocr/breach/breach_report.jsf" target="new">https://ocrportal.hhs.gov/ocr/breach/breach_report.jsf</a>
        </li>
      </ul>
      <h2>
        How is the data collected?
      </h2>
      <p>
        The data is collected using a technique commonly referred to as web "scraping". I've written code which automatically visits
        data breach websites with a web browser and parses <em>their</em> underlying HTML code to extract relevant data about each piece.
        As each site reports different data and formats that data differently, there is a separate script for each state. Some states, such as
        Indiana, Oklahoma, Vermont, and Wisconsin, have data breach websites but present data in a format that is difficult to parse automatically
        (actually, Vermont's site just seems to be broken). I have not written code to parse these sites yet, but hope to.
      </p>
      <p>
        I hope to improve the richness of the data I pull out for each site, e.g. distinguishing when the name reported for a business or entity
        includes a "d.b.a" or parsing PDFs of data breach notifications for information such as the number of state residents whose data was subject
        to the breach. There is also likely some "dirty" data, either because there are bugs or oversights in my parsing scripts or because
        there are errors in the data as it appears on the states' sites. For instance, New Hampshire has some mis-typed dates.
      </p>
      <h2>
        What data is collected?
      </h2>
      <p>
        The data made available and the data I'm able to extract automatically differ by state. Below are the pieces of information I'm generally
        able to extract from each state, but that does not mean I'm able to extract them for each entry in the database. The data varies widely.
      </p>
      <ul>
        ${ Object.entries(STATES).map(([code, _]) => {
          const colNames = COLS_BY_STATE[code] || COLS_BY_STATE.HIPAA
          const colDisplayNames = colNames.map((col) => (
            COLUMN_DISPLAY_NAMES[col]
          )).join(', ')
          return `<li>
            ${code}: ${colDisplayNames}
          </li>`
        }).join('') }
      </ul>
      <h2>
        How often is the data updated?
      </h2>
      <p>
        In general, the script to update data will run once a week, on Monday nights. And the site will be refreshed shortly after. More frequent
        updates are possible.
      </p>
      <h2>
        Can I get this data in an CSV/XLS?
      </h2>
      <p>Yes, there's a link at the top of each tale to download the results for your query as a CSV. XLS is not available for now, however.</p>
      <h2>
        API
      </h2>
      <p>
        Good news! There's a JSON API for the data on this site.
      </p>
      <h3>
        Available endpoints:
      </h3>
      <ul>
        <li>
          <code>/api/</code>: Data for all states, corresponding to the home page.
        </li>
        <li>
          <code>/api/states/:code</code>: Data for a single site, where <code>:code</code> is a two-letter state code. E.g.: <code>/api/states/TX</code>
        </li>
      </ul>
      <h3>
        Querystring parameters:
      </h3>
      <ul>
        <li>
          <code>sort</code>: accepts the name of a column, e.g. <code>/api/?sort=number_affected</code>. Options:
          <code>${COLUMNS.join(', ')}</code>
        </li>
        <li>
          <code>desc</code>: for use with <code>sort</code>. If present, results will be sorted in descending order. E.g.:
          <code>/api/states/WA?sort=number_affected&desc</code>
        </li>
        <li>
          Filters: a column name (one of <code>${COLUMNS.join(', ')}</code>), an operator (one of <code>eq, like, gt, gte, lt, lte</code>),
          and a value to filter for. Filters for a column can be combined with <code>[AND]</code> or <code>[OR]</code>. E.g.:
          <code>/api/?state=eq:WA&reported_date=gte:01/01/2020[AND]lte:12/31/2020</code> will return entries where the state is Washington,
          and the reported date is between January 1 and December 31, 2020 (inclusive).
        </li>
        <li>
          <code>exclude</code>: columns to exclude from the returned results, separated by columns. One of: <code>${COLUMNS.join(', ')}</code>. E.g.:
          <code>/api/?exclude=business_zip,dba</code>
        </li>
        <li>
          <code>limit</code>: number of results to display per page, e.g.: <code>/api/states/OR?limit=25&sort=number_affected&desc</code>
        </li>
        <li>
          <code>offset</code>: the result to start with. To be used with limit for pagination. This is zero-based, so the first
          result is at offset 0 and the twenty-first result is at offset 20. E.g.: 
          <code>/api/states/OR?limit=25&offset=25&sort=number_affected&desc</code>
        </li>
      </ul>
      <h3>
        Pagination headers:
      </h3>
      <p>
        Responses will include a <code>Content-Range</code> header with values in the following format: <br />
        <code>entries 0-20/136</code>, which indicates that you are viewing the first 20 out of a total of 136
        results for your query. This means that page 2 will start at offset 20, and there will be 7 pages total.
      </p>
    </main>
  `)
}
