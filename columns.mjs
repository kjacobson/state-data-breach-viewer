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
export const COLUMN_DISPLAY_NAMES = {
  state: 'State',
  entity_name: 'Entity name',
  dba: 'd.b.a.',
  business_address: 'Biz address',
  business_city: 'Biz city',
  business_state: 'Biz state',
  business_zip: 'Biz ZIP',
  start_date: 'Start date',
  end_date: 'End date',
  breach_dates: 'Breach dates',
  reported_date: 'Reported date',
  number_affected: '# affected',
  data_accessed: 'Data accessed',
  notice_methods: 'Notices given',
  published_date: 'Publish date',
  breach_type: 'Type of breach',
  letter_url: 'Notification',
  url: 'URL',
}

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
