// Get a { flag: ..., countryName: ... } object representing a google locationType/location input.
// 'flag' will always be defined (even if it's a question mark.
// 'regionDescription' is the same as location when locationType is 'multi-region', or a country name when locationType is 'region'.
// computeZone is generally the 'a' zone for each region, except for those regions where it is not available.
// The choice to use the 'a' zone is arbitrary, choosing 'b' zone would also work.
export const unknownRegionFlag = '❓'
export const regionInfo = (location, locationType) => {
  switch (locationType) {
    case 'multi-region':
      switch (location) {
        case 'US':
          return { flag: '🇺🇸', regionDescription: `${locationType}: ${location}`, computeZone: 'us-central1-a', clusterRegion: 'us-central1' }
        case 'EU':
          return { flag: '🇪🇺', regionDescription: `${locationType}: ${location}`, computeZone: 'europe-central2-a', clusterRegion: 'europe-central2' }
        case 'ASIA':
          return { flag: '🌏', regionDescription: `${locationType}: ${location}`, computeZone: 'asia-east1-a', clusterRegion: 'asia-east1' }
        default:
          return { flag: unknownRegionFlag, regionDescription: `${locationType}: ${location}`, computeZone: 'UNKNOWN', clusterRegion: 'UNKNOWN' }
      }
    case 'region':
      switch (location) {
        case 'ASIA-EAST1':
          return { flag: '🇹🇼', regionDescription: `${locationType}: ${location} (Taiwan)`, computeZone: 'asia-east1-a', clusterRegion: 'asia-east1' }
        case 'ASIA-EAST2':
          return { flag: '🇭🇰', regionDescription: `${locationType}: ${location} (Hong Kong)`, computeZone: 'asia-east2-a', clusterRegion: 'asia-east2' }
        case 'ASIA-NORTHEAST1':
          return { flag: '🇯🇵', regionDescription: `${locationType}: ${location} (Tokyo)`, computeZone: 'asia-northeast1-a', clusterRegion: 'asia-northeast1' }
        case 'ASIA-NORTHEAST2':
          return { flag: '🇯🇵', regionDescription: `${locationType}: ${location} (Osaka)`, computeZone: 'asia-northeast2-a', clusterRegion: 'asia-northeast2' }
        case 'ASIA-NORTHEAST3':
          return { flag: '🇰🇷', regionDescription: `${locationType}: ${location} (Seoul)`, computeZone: 'asia-northeast3-a', clusterRegion: 'asia-northeast3' }
        case 'ASIA-SOUTH1':
          return { flag: '🇮🇳', regionDescription: `${locationType}: ${location} (Mumbai)`, computeZone: 'asia-south1-a', clusterRegion: 'asia-south1' }
        case 'ASIA-SOUTHEAST1':
          return { flag: '🇸🇬', regionDescription: `${locationType}: ${location} (Singapore)`, computeZone: 'asia-southeast1-a', clusterRegion: 'asia-southeast1' }
        case 'ASIA-SOUTHEAST2':
          return { flag: '🇮🇩', regionDescription: `${locationType}: ${location} (Jakarta)`, computeZone: 'asia-southeast2-a', clusterRegion: 'asia-southeast2' }
        case 'AUSTRALIA-SOUTHEAST1':
          return { flag: '🇦🇺', regionDescription: `${locationType}: ${location} (Sydney)`, computeZone: 'australia-southeast1-a', clusterRegion: 'australia-southeast1' }
        case 'EUROPE-NORTH1':
          return { flag: '🇫🇮', regionDescription: `${locationType}: ${location} (Finland)`, computeZone: 'europe-north1-a', clusterRegion: 'europe-north1' }
        case 'EUROPE-WEST1':
          return { flag: '🇧🇪', regionDescription: `${locationType}: ${location} (Belgium)`, computeZone: 'europe-west1-b', clusterRegion: 'europe-west1' }
        case 'EUROPE-WEST2':
          return { flag: '🇬🇧', regionDescription: `${locationType}: ${location} (London)`, computeZone: 'europe-west2-a', clusterRegion: 'europe-west2' }
        case 'EUROPE-WEST3':
          return { flag: '🇩🇪', regionDescription: `${locationType}: ${location} (Frankfurt)`, computeZone: 'europe-west3-a', clusterRegion: 'europe-west3' }
        case 'EUROPE-WEST4':
          return { flag: '🇳🇱', regionDescription: `${locationType}: ${location} (Netherlands)`, computeZone: 'europe-west4-a', clusterRegion: 'europe-west4' }
        case 'EUROPE-WEST6':
          return { flag: '🇨🇭', regionDescription: `${locationType}: ${location} (Zurich)`, computeZone: 'europe-west6-a', clusterRegion: 'europe-west6' }
        case 'NORTHAMERICA-NORTHEAST1':
          return { flag: '🇨🇦', regionDescription: `${locationType}: ${location} (Montreal)`, computeZone: 'northamerica-northeast1-a', clusterRegion: 'northamerica-northeast1' }
        case 'SOUTHAMERICA-EAST1':
          return { flag: '🇧🇷', regionDescription: `${locationType}: ${location} (Sao Paulo)`, computeZone: 'southamerica-east1-a', clusterRegion: 'southamerica-east1' }
        case 'US-CENTRAL1':
          return { flag: '🇺🇸', regionDescription: `${locationType}: ${location} (Iowa)`, computeZone: 'us-central1-a', clusterRegion: 'us-central1' }
        case 'US-EAST1':
          return { flag: '🇺🇸', regionDescription: `${locationType}: ${location} (South Carolina)`, computeZone: 'us-east1-b', clusterRegion: 'us-east1' }
        case 'US-EAST4':
          return { flag: '🇺🇸', regionDescription: `${locationType}: ${location} (Northern Virginia)`, computeZone: 'us-east4-a', clusterRegion: 'us-east4' }
        case 'US-WEST1':
          return { flag: '🇺🇸', regionDescription: `${locationType}: ${location} (Oregon)`, computeZone: 'us-west1-a', clusterRegion: 'us-west1' }
        case 'US-WEST2':
          return { flag: '🇺🇸', regionDescription: `${locationType}: ${location} (Los Angeles)`, computeZone: 'us-west2-a', clusterRegion: 'us-west2' }
        case 'US-WEST3':
          return { flag: '🇺🇸', regionDescription: `${locationType}: ${location} (Salt Lake City)`, computeZone: 'us-west3-a', clusterRegion: 'us-west3' }
        case 'US-WEST4':
          return { flag: '🇺🇸', regionDescription: `${locationType}: ${location} (Las Vegas)`, computeZone: 'us-west4-a', clusterRegion: 'us-west4' }
        default:
          return { flag: unknownRegionFlag, regionDescription: `${locationType}: ${location}`, computeZone: 'UNKNOWN', clusterRegion: 'UNKNOWN' }
      }
    default:
      return { flag: unknownRegionFlag, regionDescription: `${locationType}: ${location}`, computeZone: 'UNKNOWN', clusterRegion: 'UNKNOWN' }
  }
}
