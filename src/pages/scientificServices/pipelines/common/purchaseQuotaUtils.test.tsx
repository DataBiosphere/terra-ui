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

      it('returns correct Stripe URLs for low_pass_imputation', () => {
        const result = getStripePaymentUrls('low_pass_imputation');

        expect(result).toEqual({
          academicRate: 'https://buy.stripe.com/test_6oU3cw6Gia5c5cn2aH5wI03',
          forProfitRate: 'https://buy.stripe.com/test_9B6dRa1lY4KS34f9D95wI04',
        });
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

      it('returns correct Stripe URLs for array_imputation', () => {
        const result = getStripePaymentUrls('array_imputation');

        expect(result).toEqual({
          academicRate: 'https://pay.broadclinicallabs.org/b/dRm4gBdrIfTu44j7iD8k801',
          forProfitRate: 'https://pay.broadclinicallabs.org/b/4gM14pevMePqasHeL58k800',
        });
      });

      it('returns correct Stripe URLs for array_imputation', () => {
        const result = getStripePaymentUrls('low_pass_imputation');

        expect(result).toEqual({
          academicRate: 'https://pay.broadclinicallabs.org/b/6oUfZjafw36IasHbyT8k802',
          forProfitRate: 'https://pay.broadclinicallabs.org/b/7sYbJ3evMePqeIX6ez8k803',
        });
      });

      it('returns undefined for unknown pipeline', () => {
        expect(getStripePaymentUrls('unknown_pipeline')).toBeUndefined();
      });
    });
  });
});
