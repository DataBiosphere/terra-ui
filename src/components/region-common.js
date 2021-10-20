import * as Utils from 'src/libs/utils'

// Get a { flag: ..., countryName: ... } object representing a google locationType/location input.
// 'flag' will always be defined (even if it's a question mark).
// 'regionDescription' is the same as location when locationType is 'multi-region', or a country name when locationType is 'region'.
// computeZone is generally the 'a' zone for each region, except for those regions where it is not available.
// The choice to use the 'a' zone is arbitrary, choosing 'b' zone would also work.
// The region choice for multi-region locations is arbitrary as well.

// When updating region list, please also update the list in
// https://github.com/DataBiosphere/leonardo/blob/develop/http/src/main/resources/reference.conf
export const unknownRegionFlag = '❓'
export const getRegionInfo = (location, locationType) => {
  const regionDescription = `${locationType}: ${location}`.toLowerCase()
  return Utils.switchCase(locationType,
    ['multi-region', () => Utils.switchCase(location,
      ['US', () => ({ flag: '🇺🇸', regionDescription, computeZone: 'US-CENTRAL1-A', computeRegion: 'US-CENTRAL1' })],
      ['EU', () => ({ flag: '🇪🇺', regionDescription, computeZone: 'EUROPE-CENTRAL2-A', computeRegion: 'EUROPE-CENTRAL2' })],
      ['ASIA', () => ({ flag: '🌏', regionDescription, computeZone: 'ASIA-EAST1-A', computeRegion: 'ASIA-EAST1' })],
      [Utils.DEFAULT, () => ({ flag: unknownRegionFlag, regionDescription, computeZone: 'UNKNOWN', computeRegion: 'UNKNOWN' })]
    )],
    ['region', () => Utils.switchCase(location,
      ['ASIA-EAST1', () => ({ flag: '🇹🇼', regionDescription: `${regionDescription} (Taiwan)`, computeZone: 'ASIA-EAST1-A', computeRegion: 'ASIA-EAST1' })],
      ['ASIA-EAST2', () => ({ flag: '🇭🇰', regionDescription: `${regionDescription} (Hong Kong)`, computeZone: 'ASIA-EAST2-A', computeRegion: 'ASIA-EAST2' })],
      ['ASIA-NORTHEAST1', () => ({ flag: '🇯🇵', regionDescription: `${regionDescription} (Tokyo)`, computeZone: 'ASIA-NORTHEAST1-A', computeRegion: 'ASIA-NORTHEAST1' })],
      ['ASIA-NORTHEAST2', () => ({ flag: '🇯🇵', regionDescription: `${regionDescription} (Osaka)`, computeZone: 'ASIA-NORTHEAST2-A', computeRegion: 'ASIA-NORTHEAST2' })],
      ['ASIA-NORTHEAST3', () => ({ flag: '🇰🇷', regionDescription: `${regionDescription} (Seoul)`, computeZone: 'ASIA-NORTHEAST3-A', computeRegion: 'ASIA-NORTHEAST3' })],
      ['ASIA-SOUTH1', () => ({ flag: '🇮🇳', regionDescription: `${regionDescription} (Mumbai)`, computeZone: 'ASIA-SOUTH1-A', computeRegion: 'ASIA-SOUTH1' })],
      ['ASIA-SOUTHEAST1', () => ({ flag: '🇸🇬', regionDescription: `${regionDescription} (Singapore)`, computeZone: 'ASIA-SOUTHEAST1-A', computeRegion: 'ASIA-SOUTHEAST1' })],
      ['ASIA-SOUTHEAST2', () => ({ flag: '🇮🇩', regionDescription: `${regionDescription} (Jakarta)`, computeZone: 'ASIA-SOUTHEAST2-A', computeRegion: 'ASIA-SOUTHEAST2' })],
      ['AUSTRALIA-SOUTHEAST1', () => ({ flag: '🇦🇺', regionDescription: `${regionDescription} (Sydney)`, computeZone: 'AUSTRALIA-SOUTHEAST1-A', computeRegion: 'AUSTRALIA-SOUTHEAST1' })],
      ['EUROPE-CENTRAL2', () => ({ flag: '🇵🇱', regionDescription: `${regionDescription} (Warsaw)`, computeZone: 'EUROPE-CENTRAL2-A', computeRegion: 'EUROPE-CENTRAL2' })],
      ['EUROPE-NORTH1', () => ({ flag: '🇫🇮', regionDescription: `${regionDescription} (Finland)`, computeZone: 'EUROPE-NORTH1-A', computeRegion: 'EUROPE-NORTH1' })],
      ['EUROPE-WEST1', () => ({ flag: '🇧🇪', regionDescription: `${regionDescription} (Belgium)`, computeZone: 'EUROPE-WEST1-B', computeRegion: 'EUROPE-WEST1' })],
      ['EUROPE-WEST2', () => ({ flag: '🇬🇧', regionDescription: `${regionDescription} (London)`, computeZone: 'EUROPE-WEST2-A', computeRegion: 'EUROPE-WEST2' })],
      ['EUROPE-WEST3', () => ({ flag: '🇩🇪', regionDescription: `${regionDescription} (Frankfurt)`, computeZone: 'EUROPE-WEST3-A', computeRegion: 'EUROPE-WEST3' })],
      ['EUROPE-WEST4', () => ({ flag: '🇳🇱', regionDescription: `${regionDescription} (Netherlands)`, computeZone: 'EUROPE-WEST4-A', computeRegion: 'EUROPE-WEST4' })],
      ['EUROPE-WEST6', () => ({ flag: '🇨🇭', regionDescription: `${regionDescription} (Zurich)`, computeZone: 'EUROPE-WEST6-A', computeRegion: 'EUROPE-WEST6' })],
      ['NORTHAMERICA-NORTHEAST1', () => ({ flag: '🇨🇦', regionDescription: `${regionDescription} (Montreal)`, computeZone: 'NORTHAMERICA-NORTHEAST1-A', computeRegion: 'NORTHAMERICA-NORTHEAST1' })],
      ['NORTHAMERICA-NORTHEAST2', () => ({ flag: '🇨🇦', regionDescription: `${regionDescription} (Toronto)`, computeZone: 'NORTHAMERICA-NORTHEAST2-A', computeRegion: 'NORTHAMERICA-NORTHEAST2' })],
      ['SOUTHAMERICA-EAST1', () => ({ flag: '🇧🇷', regionDescription: `${regionDescription} (Sao Paulo)`, computeZone: 'SOUTHAMERICA-EAST1-A', computeRegion: 'SOUTHAMERICA-EAST1' })],
      ['US-CENTRAL1', () => ({ flag: '🇺🇸', regionDescription: `${regionDescription} (Iowa)`, computeZone: 'US-CENTRAL1-A', computeRegion: 'US-CENTRAL1' })],
      ['US-EAST1', () => ({ flag: '🇺🇸', regionDescription: `${regionDescription} (South Carolina)`, computeZone: 'US-EAST1-B', computeRegion: 'US-EAST1' })],
      ['US-EAST4', () => ({ flag: '🇺🇸', regionDescription: `${regionDescription} (Northern Virginia)`, computeZone: 'US-EAST4-A', computeRegion: 'US-EAST4' })],
      ['US-WEST1', () => ({ flag: '🇺🇸', regionDescription: `${regionDescription} (Oregon)`, computeZone: 'US-WEST1-A', computeRegion: 'US-WEST1' })],
      ['US-WEST2', () => ({ flag: '🇺🇸', regionDescription: `${regionDescription} (Los Angeles)`, computeZone: 'US-WEST2-A', computeRegion: 'US-WEST2' })],
      ['US-WEST3', () => ({ flag: '🇺🇸', regionDescription: `${regionDescription} (Salt Lake City)`, computeZone: 'US-WEST3-A', computeRegion: 'US-WEST3' })],
      ['US-WEST4', () => ({ flag: '🇺🇸', regionDescription: `${regionDescription} (Las Vegas)`, computeZone: 'US-WEST4-A', computeRegion: 'US-WEST4' })],
      [Utils.DEFAULT, () => ({ flag: unknownRegionFlag, regionDescription, computeZone: 'UNKNOWN', computeRegion: 'UNKNOWN' })]
    )],
    [Utils.DEFAULT, () => ({ flag: unknownRegionFlag, regionDescription, computeZone: 'UNKNOWN', computeRegion: 'UNKNOWN' })]
  )
}

export const locationTypes = {
  region: 'region',
  multiRegion: 'multi-region',
  default: 'multi-region'
}

export const allRegions = [
  // In this list, us-east*, us-west*, northamerica-northeast2 and asia-northeast2 have purposefully been removed.
  // This is to avoid creating within-country silos of life sciences community data.
  // So for US, Canada and Japan, we are restricting to one region.
  // For more information, see https://docs.google.com/document/d/1RMu8bxXAyP2q_85UHkPARW1Xpt_G_662pRi0LCML4yA/edit#heading=h.53j9ueoid5vt
  // TODO(wnojopra): Replace the above link with the Terra support article link once published
  { value: 'US', label: 'US multi-regional (default)', locationType: locationTypes.multiRegion },
  { value: 'US-CENTRAL1', label: 'us-central1 (Iowa)', locationType: locationTypes.region }
  // Initially releasing regionality with just US-CENTRAL1 region. Overtime, will introduce more regions.
  // { value: 'NORTHAMERICA-NORTHEAST1', label: 'northamerica-northeast1 (Montreal)', locationType: 'region' },
  // { value: 'SOUTHAMERICA-EAST1', label: 'southamerica-east1 (Sao Paulo)', locationType: 'region' },
  // { value: 'EUROPE-CENTRAL2', label: 'europe-central2 (Warsaw)', locationType: 'region' },
  // { value: 'EUROPE-NORTH1', label: 'europe-north1 (Finland)', locationType: 'region' },
  // { value: 'EUROPE-WEST1', label: 'europe-west1 (Belgium)', locationType: 'region' },
  // { value: 'EUROPE-WEST2', label: 'europe-west2 (London)', locationType: 'region' },
  // { value: 'EUROPE-WEST3', label: 'europe-west3 (Frankfurt)', locationType: 'region' },
  // { value: 'EUROPE-WEST4', label: 'europe-west4 (Netherlands)', locationType: 'region' },
  // { value: 'EUROPE-WEST6', label: 'europe-west6 (Zurich)', locationType: 'region' },
  // { value: 'ASIA-EAST1', label: 'asia-east1 (Taiwan)', locationType: 'region' },
  // { value: 'ASIA-EAST2', label: 'asia-east2 (Hong Kong)', locationType: 'region' },
  // { value: 'ASIA-NORTHEAST1', label: 'asia-northeast1 (Tokyo)', locationType: 'region' },
  // { value: 'ASIA-NORTHEAST3', label: 'asia-northeast3 (Seoul)', locationType: 'region' },
  // { value: 'ASIA-SOUTH1', label: 'asia-south1 (Mumbai)', locationType: 'region' },
  // { value: 'ASIA-SOUTHEAST1', label: 'asia-southeast1 (Singapore)', locationType: 'region' },
  // { value: 'ASIA-SOUTHEAST2', label: 'asia-southeast2 (Jakarta)', locationType: 'region' },
  // { value: 'AUSTRALIA-SOUTHEAST1', label: 'australia-southeast1 (Sydney)', locationType: 'region' }
]
