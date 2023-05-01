import STATIC_FILES from './static-files.json' assert { type: "json" }
import {
  AND_COLUMNS,
  COLUMNS,
  COLS_BY_STATE,
  COLUMN_DISPLAY_NAMES,
  COLUMN_DATA_DEFAULTS,
} from './columns.mjs'

const isProd = process.env.NODE_ENV === "production"
const staticFileName = (key) => {
  const { name, hash, ext } = STATIC_FILES[key]
  return `${name}${isProd ? '!' + hash : ''}.${ext}`
}
const staticHost = isProd ? 'https://breach-assets.topwords.me' : ''

const STATES = {
  AL: {
    name: 'Alabama',
  },
  AK: {
    name: 'Alaska',
  },
  AZ: {
    name: 'Arizona',
  },
  AR: {
    name: 'Arkansas',
  },
  CA: {
    name: 'California',
    site: 'https://oag.ca.gov/privacy/databreach/list',
  },
  CO: {
    name: 'Colorado',
  },
  CT: {
    name: 'Connecticut',
  },
  DE: {
    name: 'Delaware',
    site: 'https://attorneygeneral.delaware.gov/fraud/cpu/securitybreachnotification/database/',
  },
  DC: {
    name: 'District of Columbia',
  },
  FL: {
    name: 'Florida',
  },
  GA: {
    name: 'Georgia',
  },
  HI: {
    name: 'Hawaii',
    site: 'https://cca.hawaii.gov/ocp/notices/security-breach/',
  },
  ID: {
    name: 'Idaho',
  },
  IL: {
    name: 'Illinois',
  },
  IN: {
    name: 'Indiana',
  },
  IA: {
    name: 'Iowa',
    site: 'https://www.iowaattorneygeneral.gov/for-consumers/security-breach-notifications',
  },
  KS: {
    name: 'Kansas',
  },
  KY: {
    name: 'Kentucky',
  },
  LA: {
    name: 'Louisiana',
  },
  ME: {
    name: 'Maine',
    site: 'https://apps.web.maine.gov/online/aeviewer/ME/40/list.shtml',
  },
  MD: {
    name: 'Maryland',
    site: 'https://www.marylandattorneygeneral.gov/Pages/IdentityTheft/breachnotices.aspx',
  },
  MI: {
    name: 'Michigan',
  },
  MN: {
    name: 'Minnesota',
  },
  MS: {
    name: 'Mississippi',
  },
  MO: {
    name: 'Missouri',
  },
  MT: {
    name: 'Montana',
    site: 'https://dojmt.gov/consumer/databreach/',
  },
  NE: {
    name: 'Nebraska',
  },
  MV: {
    name: 'Nevada',
  },
  NH: {
    name: 'New Hampshire',
    site: 'https://www.doj.nh.gov/consumer/security-breaches/',
  },
  NJ: {
    name: 'New Jersey',
    site: 'https://www.cyber.nj.gov/threat-center/public-data-breaches/',
  },
  NM: {
    name: 'New Mexico',
  },
  NY: {
    name: 'New York',
  },
  NC: {
    name: 'North Carolina',
  },
  ND: {
    name: 'North Dakota',
    site: 'https://attorneygeneral.nd.gov/consumer-resources/data-breach-notices',
  },
  OH: {
    name: 'Ohio',
  },
  OK: {
    name: 'Oklahoma',
  },
  OR: {
    name: 'Oregon',
    site: 'https://justice.oregon.gov/consumer/DataBreach/',
  },
  PA: {
    name: 'Pennsylvania',
  },
  RI: {
    name: 'Rhode Island',
  },
  SC: {
    name: 'South Carolina',
  },
  SD: {
    name: 'South Dakota',
  },
  TN: {
    name: 'Tennessee',
  },
  TX: {
    name: 'Texas',
    site: 'https://oag.my.site.com/datasecuritybreachreport/apex/DataSecurityReportsPage',
  },
  UT: {
    name: 'Utah',
  },
  VT: {
    name: 'Vermont',
  },
  VA: {
    name: 'Virginia',
  },
  WA: {
    name: 'Washington',
    site: 'https://www.atg.wa.gov/data-breach-notifications',
  },
  WV: {
    name: 'West Virginia',
  },
  WI: {
    name: 'Wisconsin',
  },
  WY: {
    name: 'Wyoming',
  },
}


const replaceSort = (query, sort) => {
  const newQuery = Object.assign({}, query)
  newQuery.sort = sort
  if (sort !== newQuery.sort) {
    delete newQuery.desc
  } else {
    if (newQuery.desc !== undefined || !query.sort) {
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
  const cols = req.params.code ? COLS_BY_STATE[req.params.code] || COLS_BY_STATE.HIPAA : COLUMNS
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
const wrapper = (title, bodyContent) => {
  // <link rel="icon" href="/icon.svg" type="image/svg+xml">
  // <link rel="apple-touch-icon" href="icon.png">
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
        <link rel="stylesheet" href="${staticHost}/public/${staticFileName('normalize_css')}">
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
              ${keys.map(key => (
                `<th>
                  <a
                    href="${req.urlData().path}?${replaceSort(req.query, key)}"
                    title="Sort by ${COLUMN_DISPLAY_NAMES[key]}${req.query.desc === undefined ? ' ( descending )' : ''}"
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
      <h1>Viewing data for ${STATES[state].name}${COLS_BY_STATE[state] ? '' : '*'}</h1>
      ${COLS_BY_STATE[state] ? '' : '<p>* data from HHS (HIPAA) breach database only</p>'}
    </header>
    <main>
      ${dataTable(data, req, filters)}
    </main>
  `)
}
export const hipaaPage = (data, req, filters, state) => {
  return wrapper(state, `
    <header>
      ${stateMenu('HIPAA')}
      <h1>Data for all states from the HIPAA breach database</h1>
    </header>
    <main>
      ${dataTable(data, req, filters)}
    </main>
  `)
}
export const aboutPage = () => {
  return wrapper('About', `
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
          `<li>
            ${name}: <a href="${site}" target="new">${site}</a>
          </li>`
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
          const colNames = COLS_BY_STATE[code]
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
        Can I get this data in an CSV/XSL?
      </h2>
      <p>Not yet. Sorry.</p>
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
