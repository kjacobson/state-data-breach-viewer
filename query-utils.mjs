import {
  DATE_FIELDS,
  COLUMNS,
} from './columns.mjs'

export const pick = (obj, keys) => (
  keys.reduce((acc, key) => {
     if (obj && obj.hasOwnProperty(key)) {
        acc[key] = obj[key]
     }
     return acc
  }, {})
)

export const omit = (obj, keys) => {
  const exclude = new Set(keys)
  return Object.fromEntries(
    Object.entries(obj).filter(e => !exclude.has(e[0]))
  )
}

export const sortBy = (key, desc) => {
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
export const sortByDate = (key, desc) => {
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
  } else
  if (Array.isArray(val)) {
    val = val.join(",")
  }
  if (val.toLowerCase) {
    val = val.toLowerCase()
  }
  let and = false
  let or = false
  let parts = filterString.split('[AND]')
  if (parts.length > 1) {
    and = true
  } else {
    parts = filterString.split('[OR]')
    if (parts.length > 1) {
      or = true
    }
  }
  let match = false
  for (const part of parts) {
    let [comparison, target] = part.split(':')
    if (isDate) {
      target = new Date(target)
    } else {
      target = target.toLowerCase()
    }
    if (or) {
      if (
        (comparison === 'eq' && val === target) ||
        (comparison === 'gt' && !isNaN(val) && val > target) ||
        (comparison === 'gte' && !isNaN(val) && val >= target) ||
        (comparison === 'lt' && !isNaN(val) && val < target) ||
        (comparison === 'lte' && !isNaN(val) && val <= target) ||
        (!isDate && comparison === 'like' && val.indexOf(target) > -1)
      ) {
        match = true
        continue
      }
    } else {
      match = (
        (comparison === 'eq' && val === target) ||
        (comparison === 'gt' && !isNaN(val) && val > target) ||
        (comparison === 'gte' && !isNaN(val) && val >= target) ||
        (comparison === 'lt' && !isNaN(val) && val < target) ||
        (comparison === 'lte' && !isNaN(val) && val <= target) ||
        (!isDate && comparison === 'like' && val.indexOf(target) > -1)
      )
      if (!match) {
        break
      }
    }
  }
  return match
}

export const extractQueryVars = (query) => {
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
    limit = 20
  }
  offset = parseInt(offset, 10)
  if (isNaN(offset)) {
    offset = 0
  }
  desc = desc !== undefined
  if (!sort) {
    sort = 'reported_date'
    desc = true
  }
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
export const applyFilters = (filters) => (item) => (
  filters.reduce((match, [key, val]) => {
    return match && applyFilter(item[key], val, DATE_FIELDS.includes(key))
  }, true)
)
