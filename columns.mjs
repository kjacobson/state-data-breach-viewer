export const DATE_FIELDS = ['start_date', 'end_date', 'reported_date', 'published_date']
export const AND_COLUMNS = [...DATE_FIELDS, 'number_affected']
export const COLUMNS = [
  'state',
  'entity_name',
  'dba',
  'business_address',
  'business_city',
  'business_state',
  'business_zip',
  'start_date',
  'end_date',
  'breach_dates',
  'reported_date',
  'number_affected',
  'data_accessed',
  'notice_methods',
  'published_date',
  'breach_type',
  'letter_url',
  'url',
]
export const COLS_BY_STATE = {
  CA: ['entity_name', 'breach_dates', 'reported_date'],
  DE: ['entity_name', 'start_date', 'end_date', 'breach_dates', 'reported_date', 'number_affected'],
  HI: ['entity_name', 'reported_date', 'number_affected', 'breach_type', 'letter_url'],
  IA: ['entity_name', 'reported_date', 'letter_url'],
  MD: ['entity_name', 'reported_date', 'number_affected', 'date_types', 'breach_type'],
  ME: ['entity_name', 'reported_date', 'url'],
  MT: ['entity_name', 'letter_url', 'start_date', 'end_date', 'reported_date', 'number_affected'],
  ND: ['entity_name', 'dba', 'letter_url', 'breach_dates', 'start_date', 'end_date', 'reported_date', 'number_affected'],
  NH: ['entity_name', 'reported_date', 'url'],
  NJ: ['entity_name', 'reported_date', 'url'],
  TX: [
    'entity_name', 'business_address', 'business_city', 'business_state', 'business_zip',
    'published_date', 'number_affected', 'data_accessed', 'notice_methods'
  ],
  WA: ['entity_name', 'start_date', 'reported_date', 'number_affected', 'data_accessed', 'letter_url']
}
