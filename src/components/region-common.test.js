import {
  availableBucketRegions,
  getLocationType,
  getRegionInfo,
  isLocationMultiRegion,
  isSupportedBucketLocation,
  locationTypes,
} from 'src/components/region-common';

const usCentral = {
  label: 'us-central1 (Iowa) (default)',
  locationType: 'region',
  value: 'US-CENTRAL1',
};

const montreal = {
  label: 'northamerica-northeast1 (Montreal)',
  locationType: 'region',
  value: 'NORTHAMERICA-NORTHEAST1',
};

const mockAvailableBucketRegions = [usCentral, montreal];

describe('getRegionInfo', () => {
  it('gets a { flag: ..., countryName: ... } object representing a google locationType/location input.', () => {
    expect(getRegionInfo('US-CENTRAL1', locationTypes.region)).toStrictEqual({
      flag: '🇺🇸',
      regionDescription: 'us-central1 (Iowa)',
      computeZone: 'US-CENTRAL1-A',
      computeRegion: 'US-CENTRAL1',
    });
  });
  it('gets a object with UNKNOWNS when region is bad.', () => {
    expect(getRegionInfo('BAD_REGION', locationTypes.multiRegion)).toStrictEqual({
      flag: '❓',
      regionDescription: 'BAD_REGION (multi-region)',
      computeZone: 'UNKNOWN',
      computeRegion: 'UNKNOWN',
    });
  });
  it('gets a object with UNKNOWNS when locationType is bad is bad.', () => {
    expect(getRegionInfo('BAD_REGION', 'BAD_LOCATION_TYPE')).toStrictEqual({
      flag: '❓',
      regionDescription: 'bad_region',
      computeZone: 'UNKNOWN',
      computeRegion: 'UNKNOWN',
    });
  });
});

describe('availableBucketRegions', () => {
  it('For current phased release of regionality only supporting US-CENTRAL1 and NORTHAMERICA-NORTHEAST1 buckets.', () => {
    expect(availableBucketRegions).toStrictEqual(mockAvailableBucketRegions);
  });
});

describe('isSupportedBucketLocation', () => {
  it('Montreal is supported as a bucket location', () => {
    expect(isSupportedBucketLocation(montreal.value)).toBeTruthy();
  });
  it('Australia is NOT yet supported as a bucket location', () => {
    expect(isSupportedBucketLocation('AUSTRALIA-SOUTHEAST1')).toBeFalsy();
  });
});

describe('isLocationMultiRegion', () => {
  it('return false for a single region location', () => {
    expect(isLocationMultiRegion('US-CENTRAL1')).toBeFalsy();
  });
});

describe('getLocationType', () => {
  it('return location information', () => {
    expect(getLocationType('US-CENTRAL1')).toStrictEqual(locationTypes.region);
  });
});
