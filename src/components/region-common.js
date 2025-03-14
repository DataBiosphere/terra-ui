import _ from 'lodash/fp';
import { defaultComputeRegion } from 'src/analysis/utils/runtime-utils';
import * as Utils from 'src/libs/utils';

// Get a { flag: ..., countryName: ... } object representing a google locationType/location input.
// 'flag' will always be defined (even if it's a question mark).
// 'regionDescription' is the same as location when locationType is 'multi-region', or a country name when locationType is 'region'.
// computeZone is generally the 'a' zone for each region, except for those regions where it is not available.
// The choice to use the 'a' zone is arbitrary, choosing 'b' zone would also work.
// The region choice for multi-region locations is arbitrary as well.

// When updating region list, please also update the list in
// https://github.com/DataBiosphere/leonardo/blob/develop/http/src/main/resources/reference.conf
const unknownRegionFlag = '❓';
export const getRegionInfo = (location, locationType) => {
  const regionDescription =
    // TODO: Remove nested ternary to align with style guide
    // eslint-disable-next-line no-nested-ternary
    locationType === locationTypes.multiRegion ? `${location} (${locationTypes.multiRegion})` : location ? location.toLowerCase() : 'UNKNOWN';
  return Utils.switchCase(
    locationType,
    [
      'multi-region',
      () =>
        Utils.switchCase(
          location,
          ['US', () => ({ flag: '🇺🇸', regionDescription, computeZone: 'US-CENTRAL1-A', computeRegion: 'US-CENTRAL1' })],
          ['EU', () => ({ flag: '🇪🇺', regionDescription, computeZone: 'EUROPE-NORTH1-A', computeRegion: 'EUROPE-NORTH1' })],
          ['ASIA', () => ({ flag: '🌏', regionDescription, computeZone: 'ASIA-EAST1-A', computeRegion: 'ASIA-EAST1' })],
          [Utils.DEFAULT, () => ({ flag: unknownRegionFlag, regionDescription, computeZone: 'UNKNOWN', computeRegion: 'UNKNOWN' })]
        ),
    ],
    [
      'region',
      () =>
        Utils.switchCase(
          location,
          [
            'ASIA-EAST1',
            () => ({ flag: '🇹🇼', regionDescription: `${regionDescription} (Taiwan)`, computeZone: 'ASIA-EAST1-A', computeRegion: location }),
          ],
          [
            'ASIA-EAST2',
            () => ({ flag: '🇭🇰', regionDescription: `${regionDescription} (Hong Kong)`, computeZone: 'ASIA-EAST2-A', computeRegion: location }),
          ],
          [
            'ASIA-NORTHEAST1',
            () => ({ flag: '🇯🇵', regionDescription: `${regionDescription} (Tokyo)`, computeZone: 'ASIA-NORTHEAST1-A', computeRegion: location }),
          ],
          [
            'ASIA-NORTHEAST2',
            () => ({ flag: '🇯🇵', regionDescription: `${regionDescription} (Osaka)`, computeZone: 'ASIA-NORTHEAST2-A', computeRegion: location }),
          ],
          [
            'ASIA-NORTHEAST3',
            () => ({ flag: '🇰🇷', regionDescription: `${regionDescription} (Seoul)`, computeZone: 'ASIA-NORTHEAST3-A', computeRegion: location }),
          ],
          [
            'ASIA-SOUTH1',
            () => ({ flag: '🇮🇳', regionDescription: `${regionDescription} (Mumbai)`, computeZone: 'ASIA-SOUTH1-A', computeRegion: location }),
          ],
          [
            'ASIA-SOUTHEAST1',
            () => ({ flag: '🇸🇬', regionDescription: `${regionDescription} (Singapore)`, computeZone: 'ASIA-SOUTHEAST1-A', computeRegion: location }),
          ],
          [
            'ASIA-SOUTHEAST2',
            () => ({ flag: '🇮🇩', regionDescription: `${regionDescription} (Jakarta)`, computeZone: 'ASIA-SOUTHEAST2-A', computeRegion: location }),
          ],
          [
            'AUSTRALIA-SOUTHEAST1',
            () => ({
              flag: '🇦🇺',
              regionDescription: `${regionDescription} (Sydney)`,
              computeZone: 'AUSTRALIA-SOUTHEAST1-A',
              computeRegion: location,
            }),
          ],
          [
            'EUROPE-CENTRAL2',
            () => ({ flag: '🇵🇱', regionDescription: `${regionDescription} (Warsaw)`, computeZone: 'EUROPE-CENTRAL2-A', computeRegion: location }),
          ],
          [
            'EUROPE-NORTH1',
            () => ({ flag: '🇫🇮', regionDescription: `${regionDescription} (Finland)`, computeZone: 'EUROPE-NORTH1-A', computeRegion: location }),
          ],
          [
            'EUROPE-WEST1',
            () => ({ flag: '🇧🇪', regionDescription: `${regionDescription} (Belgium)`, computeZone: 'EUROPE-WEST1-B', computeRegion: location }),
          ],
          [
            'EUROPE-WEST2',
            () => ({ flag: '🇬🇧', regionDescription: `${regionDescription} (London)`, computeZone: 'EUROPE-WEST2-A', computeRegion: location }),
          ],
          [
            'EUROPE-WEST3',
            () => ({ flag: '🇩🇪', regionDescription: `${regionDescription} (Frankfurt)`, computeZone: 'EUROPE-WEST3-A', computeRegion: location }),
          ],
          [
            'EUROPE-WEST4',
            () => ({ flag: '🇳🇱', regionDescription: `${regionDescription} (Netherlands)`, computeZone: 'EUROPE-WEST4-A', computeRegion: location }),
          ],
          [
            'EUROPE-WEST6',
            () => ({ flag: '🇨🇭', regionDescription: `${regionDescription} (Zurich)`, computeZone: 'EUROPE-WEST6-A', computeRegion: location }),
          ],
          [
            'NORTHAMERICA-NORTHEAST1',
            () => ({
              flag: '🇨🇦',
              regionDescription: `${regionDescription} (Montreal)`,
              computeZone: 'NORTHAMERICA-NORTHEAST1-A',
              computeRegion: location,
            }),
          ],
          [
            'NORTHAMERICA-NORTHEAST2',
            () => ({
              flag: '🇨🇦',
              regionDescription: `${regionDescription} (Toronto)`,
              computeZone: 'NORTHAMERICA-NORTHEAST2-A',
              computeRegion: location,
            }),
          ],
          [
            'SOUTHAMERICA-EAST1',
            () => ({
              flag: '🇧🇷',
              regionDescription: `${regionDescription} (Sao Paulo)`,
              computeZone: 'SOUTHAMERICA-EAST1-A',
              computeRegion: location,
            }),
          ],
          [
            'US-CENTRAL1',
            () => ({ flag: '🇺🇸', regionDescription: `${regionDescription} (Iowa)`, computeZone: 'US-CENTRAL1-A', computeRegion: location }),
          ],
          [
            'US-EAST1',
            () => ({ flag: '🇺🇸', regionDescription: `${regionDescription} (South Carolina)`, computeZone: 'US-EAST1-B', computeRegion: location }),
          ],
          [
            'US-EAST4',
            () => ({ flag: '🇺🇸', regionDescription: `${regionDescription} (Northern Virginia)`, computeZone: 'US-EAST4-A', computeRegion: location }),
          ],
          [
            'US-WEST1',
            () => ({ flag: '🇺🇸', regionDescription: `${regionDescription} (Oregon)`, computeZone: 'US-WEST1-A', computeRegion: location }),
          ],
          [
            'US-WEST2',
            () => ({ flag: '🇺🇸', regionDescription: `${regionDescription} (Los Angeles)`, computeZone: 'US-WEST2-A', computeRegion: location }),
          ],
          [
            'US-WEST3',
            () => ({ flag: '🇺🇸', regionDescription: `${regionDescription} (Salt Lake City)`, computeZone: 'US-WEST3-A', computeRegion: location }),
          ],
          [
            'US-WEST4',
            () => ({ flag: '🇺🇸', regionDescription: `${regionDescription} (Las Vegas)`, computeZone: 'US-WEST4-A', computeRegion: location }),
          ],
          [Utils.DEFAULT, () => ({ flag: unknownRegionFlag, regionDescription, computeZone: 'UNKNOWN', computeRegion: 'UNKNOWN' })]
        ),
    ],
    [Utils.DEFAULT, () => ({ flag: unknownRegionFlag, regionDescription, computeZone: 'UNKNOWN', computeRegion: 'UNKNOWN' })]
  );
};

export const locationTypes = {
  region: 'region',
  multiRegion: 'multi-region',
  default: 'region',
};

export const allRegions = [
  // For more information, see https://support.terra.bio/hc/en-us/articles/360060777272-US-regional-versus-Multi-regional-US-buckets-trade-offs
  { value: 'US-CENTRAL1', label: 'us-central1 (Iowa) (default)', locationType: locationTypes.region },
  { value: 'US', label: 'US multi-regional', locationType: locationTypes.multiRegion },
  { value: 'US-EAST1', label: 'us-east1 (South Carolina)', locationType: locationTypes.region },
  { value: 'US-EAST4', label: 'us-east4 (Virginia)', locationType: locationTypes.region },
  { value: 'US-WEST1', label: 'us-west1 (Oregon)', locationType: locationTypes.region },
  { value: 'US-WEST2', label: 'us-west2 (California)', locationType: locationTypes.region },
  { value: 'US-WEST3', label: 'us-west3 (Utah)', locationType: locationTypes.region },
  { value: 'US-WEST4', label: 'us-west4 (Nevada)', locationType: locationTypes.region },
  { value: 'NORTHAMERICA-NORTHEAST2', label: 'northamerica-northeast2 (Ontario)', locationType: locationTypes.region },
  { value: 'NORTHAMERICA-NORTHEAST1', label: 'northamerica-northeast1 (Montreal)', locationType: locationTypes.region },
  { value: 'SOUTHAMERICA-EAST1', label: 'southamerica-east1 (Sao Paulo)', locationType: locationTypes.region },
  { value: 'EUROPE-CENTRAL2', label: 'europe-central2 (Warsaw)', locationType: locationTypes.region },
  { value: 'EUROPE-NORTH1', label: 'europe-north1 (Finland)', locationType: locationTypes.region },
  { value: 'EUROPE-WEST1', label: 'europe-west1 (Belgium)', locationType: locationTypes.region },
  { value: 'EUROPE-WEST2', label: 'europe-west2 (London)', locationType: locationTypes.region },
  { value: 'EUROPE-WEST3', label: 'europe-west3 (Frankfurt)', locationType: locationTypes.region },
  { value: 'EUROPE-WEST4', label: 'europe-west4 (Netherlands)', locationType: locationTypes.region },
  { value: 'EUROPE-WEST6', label: 'europe-west6 (Zurich)', locationType: locationTypes.region },
  { value: 'ASIA-EAST1', label: 'asia-east1 (Taiwan)', locationType: locationTypes.region },
  { value: 'ASIA-EAST2', label: 'asia-east2 (Hong Kong)', locationType: locationTypes.region },
  { value: 'ASIA-NORTHEAST1', label: 'asia-northeast1 (Tokyo)', locationType: locationTypes.region },
  { value: 'ASIA-NORTHEAST3', label: 'asia-northeast3 (Seoul)', locationType: locationTypes.region },
  { value: 'ASIA-SOUTH1', label: 'asia-south1 (Mumbai)', locationType: locationTypes.region },
  { value: 'ASIA-SOUTHEAST1', label: 'asia-southeast1 (Singapore)', locationType: locationTypes.region },
  { value: 'ASIA-SOUTHEAST2', label: 'asia-southeast2 (Jakarta)', locationType: locationTypes.region },
  { value: 'AUSTRALIA-SOUTHEAST1', label: 'australia-southeast1 (Sydney)', locationType: locationTypes.region },
  { value: 'ASIA-NORTHEAST2', label: 'asia-northeast1 (Osaka)', locationType: locationTypes.region },
];

export const getLocationInfo = (location) => _.find({ value: location.toUpperCase() }, allRegions);
export const getLocationType = (location) => getLocationInfo(location).locationType;
export const isLocationMultiRegion = (location) => getLocationType(location) === locationTypes.multiRegion;

// For current phased release of regionality only supporting US-CENTRAL1 buckets.
const supportedBucketLocations = ['US-CENTRAL1'];
export const isSupportedBucketLocation = (location) => _.includes(location, supportedBucketLocations);
export const availableBucketRegions = _.filter(({ value }) => isSupportedBucketLocation(value), allRegions);

// For current phased release of regionality only supporting compute region in US-CENTRAL1
// and the same region as your workspace bucket.
export const getAvailableComputeRegions = (location) => {
  const usCentralRegion = _.find({ value: defaultComputeRegion }, allRegions);
  return isUSLocation(location) ? [usCentralRegion] : [_.find({ value: location }, allRegions), usCentralRegion];
};

export const isUSLocation = (location) => {
  return _.includes(location, ['US', defaultComputeRegion]);
};
