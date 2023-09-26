// from https://developers.google.com/apis-explorer/#p/cloudbilling/v1/cloudbilling.services.skus.list?parent=services%252F95FF-2EF5-5EA1

export default {
  name: 'services/95FF-2EF5-5EA1/skus/22EB-AAE8-FBCD',
  skuId: '22EB-AAE8-FBCD',
  description: 'Download Worldwide Destinations (excluding Asia & Australia)',
  category: {
    serviceDisplayName: 'Cloud Storage',
    resourceFamily: 'Network',
    resourceGroup: 'PremiumInternetEgress',
    usageType: 'OnDemand',
  },
  serviceRegions: ['global'],
  pricingInfo: [
    {
      summary: '',
      pricingExpression: {
        usageUnit: 'GiBy',
        usageUnitDescription: 'gibibyte',
        baseUnit: 'By',
        baseUnitDescription: 'byte',
        baseUnitConversionFactor: 1073741824,
        displayQuantity: 1,
        tieredRates: [
          {
            startUsageAmount: 0,
            unitPrice: {
              currencyCode: 'USD',
              units: '0',
              nanos: 0,
            },
          },
          {
            startUsageAmount: 1,
            unitPrice: {
              currencyCode: 'USD',
              units: '0',
              nanos: 120000000,
            },
          },
          {
            startUsageAmount: 1024,
            unitPrice: {
              currencyCode: 'USD',
              units: '0',
              nanos: 110000000,
            },
          },
          {
            startUsageAmount: 10240,
            unitPrice: {
              currencyCode: 'USD',
              units: '0',
              nanos: 80000000,
            },
          },
        ],
      },
      aggregationInfo: {
        aggregationLevel: 'ACCOUNT',
        aggregationInterval: 'MONTHLY',
        aggregationCount: 1,
      },
      currencyConversionRate: 1,
      effectiveTime: '2018-07-13T17:17:33.677Z',
    },
  ],
  serviceProviderName: 'Google',
};
