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
        case 'ASIA-EAST1':
          return { flag: '🇹🇼', regionDescription: `${locationType}: ${location} (Taiwan)` }
        case 'ASIA-EAST2':
          return { flag: '🇭🇰', regionDescription: `${locationType}: ${location} (Hong Kong)` }
        case 'ASIA-NORTHEAST1':
          return { flag: '🇯🇵', regionDescription: `${locationType}: ${location} (Tokyo)` }
        case 'ASIA-NORTHEAST2':
          return { flag: '🇯🇵', regionDescription: `${locationType}: ${location} (Osaka)` }
        case 'ASIA-NORTHEAST3':
          return { flag: '🇰🇷', regionDescription: `${locationType}: ${location} (Seoul)` }
        case 'ASIA-SOUTH1':
          return { flag: '🇮🇳', regionDescription: `${locationType}: ${location} (Mumbai)` }
        case 'ASIA-SOUTHEAST1':
          return { flag: '🇸🇬', regionDescription: `${locationType}: ${location} (Singapore)` }
        case 'ASIA-SOUTHEAST2':
          return { flag: '🇮🇩', regionDescription: `${locationType}: ${location} (Jakarta)` }
        case 'AUSTRALIA-SOUTHEAST1':
          return { flag: '🇦🇺', regionDescription: `${locationType}: ${location} (Sydney)` }
        case 'EUROPE-NORTH1':
          return { flag: '🇫🇮', regionDescription: `${locationType}: ${location} (Finland)` }
        case 'EUROPE-WEST1':
          return { flag: '🇧🇪', regionDescription: `${locationType}: ${location} (Belgium)` }
        case 'EUROPE-WEST2':
          return { flag: '🇬🇧', regionDescription: `${locationType}: ${location} (London)` }
        case 'EUROPE-WEST3':
          return { flag: '🇩🇪', regionDescription: `${locationType}: ${location} (Frankfurt)` }
        case 'EUROPE-WEST4':
          return { flag: '🇳🇱', regionDescription: `${locationType}: ${location} (Netherlands)` }
        case 'EUROPE-WEST6':
          return { flag: '🇨🇭', regionDescription: `${locationType}: ${location} (Zurich)` }
        case 'NORTHAMERICA-NORTHEAST1':
          return { flag: '🇨🇦', regionDescription: `${locationType}: ${location} (Montreal)` }
        case 'SOUTHAMERICA-EAST1':
          return { flag: '🇧🇷', regionDescription: `${locationType}: ${location} (Sao Paulo)` }
        case 'US-CENTRAL1':
        case 'US-EAST1':
        case 'US-EAST4':
        case 'US-WEST1':
        case 'US-WEST2':
        case 'US-WEST3':
        case 'US-WEST4':
          return { flag: '🇺🇸', regionDescription: `${locationType}: ${location}` }
        default:
          return { flag: unknownRegionFlag, regionDescription: `${locationType}: ${location}` }
      }
    default:
      return { flag: unknownRegionFlag, regionDescription: `${locationType}: ${location}` }
  }
}
