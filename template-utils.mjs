export const STATES = {
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

export const replaceSort = (query, sort) => {
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
export const FILTER_VALUE_WIDTHS = {
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
export const nextPageQuery = (query) => {
  const newQuery= Object.assign({}, query)
  newQuery.offset = parseInt(query.offset, 10) || 0
  newQuery.limit = parseInt(query.limit, 10) || 20
  newQuery.offset += newQuery.limit
  return new URLSearchParams(newQuery).toString()
}
export const prevPageQuery = (query) => {
  const newQuery= Object.assign({}, query)
  newQuery.offset = parseInt(query.offset, 10) || 0
  newQuery.limit = parseInt(query.limit, 10) || 20
  if (newQuery.offset !== 0) {
    newQuery.offset -= newQuery.limit
  }
  return new URLSearchParams(newQuery).toString()
}
export const csvURL = (path, query) => {
  if (["", "/"].includes(path)) {
    path = "/breach-data.csv"
  } else {
    path += ".csv"
  }
  const qString = new URLSearchParams(query)
  qString.delete('offset')
  qString.delete('limit')
  return `${path}?${qString.toString()}`
}
