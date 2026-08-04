import { getLocalStorage, getStatic, setStatic } from 'src/libs/browser-storage';
import { getConfig } from 'src/libs/config';

export interface InProgressPurchase {
  nonProfitActivities: boolean;
  nonProfitOrganization: boolean;
  pipeline: string;
}

const IN_PROGRESS_PURCHASE_KEY = 'inProgressPurchase';

export const getInProgressPurchase = (): InProgressPurchase | undefined =>
  getStatic(getLocalStorage(), IN_PROGRESS_PURCHASE_KEY) as InProgressPurchase | undefined;

export const storeInProgressPurchase = (inProgressPurchase: InProgressPurchase): void =>
  setStatic(getLocalStorage(), IN_PROGRESS_PURCHASE_KEY, inProgressPurchase);

export const clearInProgressPurchase = (): void => setStatic(getLocalStorage(), IN_PROGRESS_PURCHASE_KEY, undefined);

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
    low_pass_imputation: {
      academicRate: 'https://buy.stripe.com/test_6oU3cw6Gia5c5cn2aH5wI03',
      forProfitRate: 'https://buy.stripe.com/test_9B6dRa1lY4KS34f9D95wI04',
    },
    // add other pipelines here as needed
  },
  prod: {
    array_imputation: {
      academicRate: 'https://pay.broadclinicallabs.org/b/dRm4gBdrIfTu44j7iD8k801',
      forProfitRate: 'https://pay.broadclinicallabs.org/b/4gM14pevMePqasHeL58k800',
    },
    low_pass_imputation: {
      academicRate: 'https://pay.broadclinicallabs.org/b/6oUfZjafw36IasHbyT8k802',
      forProfitRate: 'https://pay.broadclinicallabs.org/b/7sYbJ3evMePqeIX6ez8k803',
    },
    // add other pipelines here as needed
  },
};

export const getStripePaymentUrls = (pipelineName: string | undefined): PipelineStripeUrls | undefined => {
  if (!pipelineName) return undefined;

  const env: Environment = getConfig().isProd ? 'prod' : 'dev';
  return TEASPOONS_STRIPE_PAYMENT_URLS[env][pipelineName as PipelineName];
};

export const TEASPOONS_HUBSPOT_URL = 'https://2q9nc.share.hsforms.com/2lq7UlFtvSbiu-hoHEYXykQ';
