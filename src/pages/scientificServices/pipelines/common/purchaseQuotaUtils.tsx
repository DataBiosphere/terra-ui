import { getConfig } from 'src/libs/config';

type Environment = 'dev' | 'prod';
type PipelineName = 'array_imputation' | 'low_pass_imputation';

interface PipelineStripeUrls {
  academicRate: string;
  forProfitRate: string;
}

const TEASPOONS_STRIPE_PAYMENT_URLS: Record<Environment, Partial<Record<PipelineName, PipelineStripeUrls>>> = {
  dev: {
    array_imputation: {
      academicRate: 'https://buy.stripe.com/test_cNi14o8OqfpwdIT8z55wI01',
      forProfitRate: 'https://buy.stripe.com/test_eVq6oI1lYels6gr4iP5wI02',
    },
    // add other pipelines here as needed
  },
  prod: {},
};

export const getStripePaymentUrls = (pipelineName: string | undefined): PipelineStripeUrls | undefined => {
  if (!pipelineName) return undefined;

  const env: Environment = getConfig().isProd ? 'prod' : 'dev';
  return TEASPOONS_STRIPE_PAYMENT_URLS[env][pipelineName as PipelineName];
};

export const TEASPOONS_HUBSPOT_URL = 'https://2q9nc.share.hsforms.com/2lq7UlFtvSbiu-hoHEYXykQ';
