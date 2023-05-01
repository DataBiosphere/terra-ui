// name must be name from Data Explorer dataset.json
// authDomain must be authorization_domain from Data Explorer dataset.json
const datasets = [
  {
    name: '1000 Genomes',
    origin: 'https://test-data-explorer.appspot.com',
  },
  {
    name: 'AMP PD - 2020_v2release_1218',
    origin: 'https://data-explorer.amp-pd.org',
    authDomain: 'amp-pd-researchers',
    partner: 'AMP PD',
  },
  {
    name: 'AMP PD Clinical - 2020_v2release_1218',
    origin: 'https://clinical-data-explorer.amp-pd.org',
    authDomain: 'amp-pd-clinical-access',
    partner: 'AMP PD',
  },
  {
    name: 'Baseline Health Study',
    origin: 'https://baseline-explorer.appspot.com',
    authDomain: 'baseline-researchers-v1',
    partner: 'baseline',
  },
  {
    name: 'Framingham Heart Study Teaching Dataset',
    origin: 'https://time-series-data-explorer.appspot.com',
  },
];

export default datasets;
