// Get a { flag: ..., countryName: ... } object representing a google locationType/location input.
// 'flag' will always be defined (even if it's a question mark.
// 'regionDescription' is the same as location when locationType is 'multi-region', or a country name when locationType is 'region'.
export const unknownRegionFlag = '❓'
export const regionInfo = (location, locationType) => {
  switch (locationType) {
    case 'multi-region':
      switch (location) {
        case 'US':
          return { flag: '🇺🇸', regionDescription: `${locationType}: ${location}` }
        case 'EU':
          return { flag: '🇪🇺', regionDescription: `${locationType}: ${location}` }
        case 'ASIA':
          return { flag: '🌏', regionDescription: `${locationType}: ${location}` }
        default:
          return { flag: unknownRegionFlag, regionDescription: `${locationType}: ${location}` }
      }
    case 'region':
      switch (location) {
        case 'EUROPE-NORTH1':
          return { flag: '🇫🇮', regionDescription: `${locationType}: ${location} (Finland)` }
        default:
          return { flag: unknownRegionFlag, regionDescription: `${locationType}: ${location}` }
      }
    default:
      return { flag: unknownRegionFlag, regionDescription: `${locationType}: ${location}` }
  }
}
export const allRegions = [
  { value: '', label: 'US multi-regional (default)' },
  { value: 'northamerica-northeast1', label: 'northamerica-northeast1 (Montreal)' },
  { value: 'southamerica-east1', label: 'southamerica-east1 (Sao Paulo)' },
  { value: 'us-central1', label: 'us-central1 (Iowa)' },
  { value: 'us-east1', label: 'us-east1 (South Carolina)' },
  { value: 'us-east4', label: 'us-east4 (Northern Virginia)' },
  { value: 'us-west1', label: 'us-west1 (Oregon)' },
  { value: 'us-west2', label: 'us-west2 (Los Angeles)' },
  { value: 'us-west3', label: 'us-west3 (Salt Lake City)' },
  { value: 'us-west4', label: 'us-west4 (Las Vegas)' },
  { value: 'europe-central2', label: 'europe-central2 (Warsaw)' },
  { value: 'europe-north1', label: 'europe-north1 (Finland)' },
  { value: 'europe-west1', label: 'europe-west1 (Belgium)' },
  { value: 'europe-west2', label: 'europe-west2 (London)' },
  { value: 'europe-west3', label: 'europe-west3 (Frankfurt)' },
  { value: 'europe-west4', label: 'europe-west4 (Netherlands)' },
  { value: 'europe-west6', label: 'europe-west6 (Zurich)' },
  { value: 'asia-east1', label: 'asia-east1 (Taiwan)' },
  { value: 'asia-east2', label: 'asia-east2 (Hong Kong)' },
  { value: 'asia-northeast1', label: 'asia-northeast1 (Tokyo)' },
  { value: 'asia-northeast2', label: 'asia-northeast2 (Osaka)' },
  { value: 'asia-northeast3', label: 'asia-northeast3 (Seoul)' },
  { value: 'asia-south1', label: 'asia-south1 (Mumbai)' },
  { value: 'asia-southeast1', label: 'asia-southeast1 (Singapore)' },
  { value: 'asia-southeast2', label: 'asia-southeast2 (Jakarta)' },
  { value: 'australia-southeast1', label: 'australia-southeast1 (Sydney)' }
]
