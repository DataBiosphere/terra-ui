// name must be name from Data Explorer dataset.json
// authDomain must be authorization_domain from Data Explorer dataset.json
const datasets = [
  {
    name: '1000 Genomes',
    origin: 'https://test-data-explorer.appspot.com'
  },
  {
    name: 'AMP PD - 2019_v1release_1015',
    origin: 'https://amp-pd-data-explorers.appspot.com',
    authDomain: 'amp-pd-researchers'
  },
  {
    name: 'AMP PD Clinical - 2019_v1release_1015',
    origin: 'https://amp-pd-clinical-data-explorers.appspot.com',
    authDomain: 'amp-pd-clinical-access'
  },
  {
    name: 'Baseline Health Study',
    origin: 'https://baseline-explorer.appspot.com',
    authDomain: 'baseline-researchers-v1'
  },
  {
    name: 'Framingham Heart Study Teaching Dataset',
    origin: 'https://time-series-data-explorer.appspot.com'
  },
  {
    name: 'Nurses\' Health Study',
    origin: 'https://nhs-explorer.appspot.com',
    authDomain: 'nhs_saturn_users'
  },
  {
    name: 'UK Biobank',
    origin: 'https://biobank-explorer.appspot.com',
    authDomain: 'Kathiresan_UKBB',
    isUKB: true
  }
]

export default datasets
