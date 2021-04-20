import * as Utils from 'src/libs/utils'

// Get a { flag: ..., countryName: ... } object representing a google locationType/location input.
// 'flag' will always be defined (even if it's a question mark.
// 'regionDescription' is the same as location when locationType is 'multi-region', or a country name when locationType is 'region'.
// computeZone is generally the 'a' zone for each region, except for those regions where it is not available.
// The choice to use the 'a' zone is arbitrary, choosing 'b' zone would also work.
// The region choice for multi-region locations is arbitrary as well.
export const unknownRegionFlag = '❓'
export const regionInfo = (location, locationType) => {
  return Utils.switchCase(locationType,
    ['multi-region', () => Utils.switchCase(location,
      ['US', () => ({ flag: '🇺🇸', regionDescription: `${locationType}: ${location}`, computeZone: 'us-central1-a', computeRegion: 'us-central1' })],
      ['EU', () => ({ flag: '🇪🇺', regionDescription: `${locationType}: ${location}`, computeZone: 'europe-central2-a', computeRegion: 'europe-central2' })],
      ['ASIA', () => ({ flag: '🌏', regionDescription: `${locationType}: ${location}`, computeZone: 'asia-east1-a', computeRegion: 'asia-east1' })],
      [Utils.DEFAULT, () => ({ flag: unknownRegionFlag, regionDescription: `${locationType}: ${location}`, computeZone: 'UNKNOWN', computeRegion: 'UNKNOWN' })]
    )],
    ['region', () => Utils.switchCase(location,
      ['ASIA-EAST1', () => ({ flag: '🇹🇼', regionDescription: `${locationType}: ${location} (Taiwan)`, computeZone: 'asia-east1-a', computeRegion: 'asia-east1' })],
      ['ASIA-EAST2', () => ({ flag: '🇭🇰', regionDescription: `${locationType}: ${location} (Hong Kong)`, computeZone: 'asia-east2-a', computeRegion: 'asia-east2' })],
      ['ASIA-NORTHEAST1', () => ({ flag: '🇯🇵', regionDescription: `${locationType}: ${location} (Tokyo)`, computeZone: 'asia-northeast1-a', computeRegion: 'asia-northeast1' })],
      ['ASIA-NORTHEAST2', () => ({ flag: '🇯🇵', regionDescription: `${locationType}: ${location} (Osaka)`, computeZone: 'asia-northeast2-a', computeRegion: 'asia-northeast2' })],
      ['ASIA-NORTHEAST3', () => ({ flag: '🇰🇷', regionDescription: `${locationType}: ${location} (Seoul)`, computeZone: 'asia-northeast3-a', computeRegion: 'asia-northeast3' })],
      ['ASIA-SOUTH1', () => ({ flag: '🇮🇳', regionDescription: `${locationType}: ${location} (Mumbai)`, computeZone: 'asia-south1-a', computeRegion: 'asia-south1' })],
      ['ASIA-SOUTHEAST1', () => ({ flag: '🇸🇬', regionDescription: `${locationType}: ${location} (Singapore)`, computeZone: 'asia-southeast1-a', computeRegion: 'asia-southeast1' })],
      ['ASIA-SOUTHEAST2', () => ({ flag: '🇮🇩', regionDescription: `${locationType}: ${location} (Jakarta)`, computeZone: 'asia-southeast2-a', computeRegion: 'asia-southeast2' })],
      ['AUSTRALIA-SOUTHEAST1', () => ({ flag: '🇦🇺', regionDescription: `${locationType}: ${location} (Sydney)`, computeZone: 'australia-southeast1-a', computeRegion: 'australia-southeast1' })],
      ['EUROPE-NORTH1', () => ({ flag: '🇫🇮', regionDescription: `${locationType}: ${location} (Finland)`, computeZone: 'europe-north1-a', computeRegion: 'europe-north1' })],
      ['EUROPE-WEST1', () => ({ flag: '🇧🇪', regionDescription: `${locationType}: ${location} (Belgium)`, computeZone: 'europe-west1-b', computeRegion: 'europe-west1' })],
      ['EUROPE-WEST2', () => ({ flag: '🇬🇧', regionDescription: `${locationType}: ${location} (London)`, computeZone: 'europe-west2-a', computeRegion: 'europe-west2' })],
      ['EUROPE-WEST3', () => ({ flag: '🇩🇪', regionDescription: `${locationType}: ${location} (Frankfurt)`, computeZone: 'europe-west3-a', computeRegion: 'europe-west3' })],
      ['EUROPE-WEST4', () => ({ flag: '🇳🇱', regionDescription: `${locationType}: ${location} (Netherlands)`, computeZone: 'europe-west4-a', computeRegion: 'europe-west4' })],
      ['EUROPE-WEST6', () => ({ flag: '🇨🇭', regionDescription: `${locationType}: ${location} (Zurich)`, computeZone: 'europe-west6-a', computeRegion: 'europe-west6' })],
      ['NORTHAMERICA-NORTHEAST1', () => ({ flag: '🇨🇦', regionDescription: `${locationType}: ${location} (Montreal)`, computeZone: 'northamerica-northeast1-a', computeRegion: 'northamerica-northeast1' })],
      ['SOUTHAMERICA-EAST1', () => ({ flag: '🇧🇷', regionDescription: `${locationType}: ${location} (Sao Paulo)`, computeZone: 'southamerica-east1-a', computeRegion: 'southamerica-east1' })],
      ['US-CENTRAL1', () => ({ flag: '🇺🇸', regionDescription: `${locationType}: ${location} (Iowa)`, computeZone: 'us-central1-a', computeRegion: 'us-central1' })],
      ['US-EAST1', () => ({ flag: '🇺🇸', regionDescription: `${locationType}: ${location} (South Carolina)`, computeZone: 'us-east1-b', computeRegion: 'us-east1' })],
      ['US-EAST4', () => ({ flag: '🇺🇸', regionDescription: `${locationType}: ${location} (Northern Virginia)`, computeZone: 'us-east4-a', computeRegion: 'us-east4' })],
      ['US-WEST1', () => ({ flag: '🇺🇸', regionDescription: `${locationType}: ${location} (Oregon)`, computeZone: 'us-west1-a', computeRegion: 'us-west1' })],
      ['US-WEST2', () => ({ flag: '🇺🇸', regionDescription: `${locationType}: ${location} (Los Angeles)`, computeZone: 'us-west2-a', computeRegion: 'us-west2' })],
      ['US-WEST3', () => ({ flag: '🇺🇸', regionDescription: `${locationType}: ${location} (Salt Lake City)`, computeZone: 'us-west3-a', computeRegion: 'us-west3' })],
      ['US-WEST4', () => ({ flag: '🇺🇸', regionDescription: `${locationType}: ${location} (Las Vegas)`, computeZone: 'us-west4-a', computeRegion: 'us-west4' })],
      [Utils.DEFAULT, () => ({ flag: unknownRegionFlag, regionDescription: `${locationType}: ${location}`, computeZone: 'UNKNOWN', computeRegion: 'UNKNOWN' })]
    )],
    [Utils.DEFAULT, () => ({ flag: unknownRegionFlag, regionDescription: `${locationType}: ${location}`, computeZone: 'UNKNOWN', computeRegion: 'UNKNOWN' })]
  )
}
