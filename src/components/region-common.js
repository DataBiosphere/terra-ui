// Get a { flag: ..., countryName: ... } object representing a google locationType/location input.
// 'flag' will always be defined (even if it's a question mark.
// 'regionDescription' is the same as location when locationType is 'multi-region', or a country name when locationType is 'region'.
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
          return { flag: '❓', regionDescription: `${locationType}: ${location}` }
      }
    case 'region':
      switch (location) {
        case 'EUROPE-NORTH1':
          return { flag: '🇫🇮', regionDescription: `${locationType}: ${location} (Finland)` }
        default:
          return { flag: '❓', regionDescription: `${locationType}: ${location}` }
      }
    default:
      return { flag: '❓', regionDescription: `${locationType}: ${location}` }
  }
}
