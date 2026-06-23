import { getConfig } from 'src/libs/config';

import { getStripePaymentUrls } from './purchaseQuotaUtils';

jest.mock('src/libs/config');

const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>;

describe('purchaseQuotaUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStripePaymentUrls', () => {
    describe('in dev environment', () => {
      beforeEach(() => {
        mockGetConfig.mockReturnValue({ isProd: false } as any);
      });

      it('returns undefined when pipelineName is undefined', () => {
        expect(getStripePaymentUrls(undefined)).toBeUndefined();
      });

      it('returns undefined when pipelineName is empty string', () => {
        expect(getStripePaymentUrls('')).toBeUndefined();
      });

      it('returns correct Stripe URLs for array_imputation', () => {
        const result = getStripePaymentUrls('array_imputation');

        expect(result).toEqual({
          academicRate: 'https://buy.stripe.com/test_cNi14o8OqfpwdIT8z55wI01',
          forProfitRate: 'https://buy.stripe.com/test_eVq6oI1lYels6gr4iP5wI02',
        });
      });

      it('returns undefined for low_pass_imputation (not configured in dev)', () => {
        expect(getStripePaymentUrls('low_pass_imputation')).toBeUndefined();
      });

      it('returns undefined for unknown pipeline', () => {
        expect(getStripePaymentUrls('unknown_pipeline')).toBeUndefined();
      });
    });

    describe('in prod environment', () => {
      beforeEach(() => {
        mockGetConfig.mockReturnValue({ isProd: true } as any);
      });

      it('returns undefined when pipelineName is undefined', () => {
        expect(getStripePaymentUrls(undefined)).toBeUndefined();
      });

      it('returns undefined for array_imputation (not configured in prod)', () => {
        expect(getStripePaymentUrls('array_imputation')).toBeUndefined();
      });

      it('returns undefined for low_pass_imputation (not configured in prod)', () => {
        expect(getStripePaymentUrls('low_pass_imputation')).toBeUndefined();
      });

      it('returns undefined for unknown pipeline', () => {
        expect(getStripePaymentUrls('unknown_pipeline')).toBeUndefined();
      });
    });
  });
});
