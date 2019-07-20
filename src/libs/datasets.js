// name must be name from Data Explorer dataset.json
// authDomain must be authorization_domain from Data Explorer dataset.json
const datasets = [
  {
    name: '1000 Genomes',
    origin: 'https://test-data-explorer.appspot.com'
  },
  {
    name: 'AMP PD - 2019_v1beta_0220',
    origin: 'https://amp-pd-data-explorer.appspot.com',
    authDomain: 'amp-pd-researchers'
  },
  {
    name: 'Baseline Health Study',
    origin: 'https://baseline-baseline-explorer.appspot.com',
    authDomain: 'baseline-researchers'
  },
  {
    name: 'Nurses\' Health Study',
    origin: 'https://nhs-explorer.appspot.com',
    authDomain: 'nhs_saturn_users'
  },
  {
    name: 'UK Biobank',
    origin: 'https://biobank-explorer.appspot.com',
    authDomain: 'Kathiresan_UKBB'
  }
]

export default datasets
