import { enrichTheme } from '@terra-ui-packages/components';
import { BROAD_ON_MANIFOLD_ENTERPRISE_FEATURE_ID } from 'src/enterprise-features/features';
import { isTerra } from 'src/libs/brand-utils';
import { brands } from 'src/libs/brands';
import { getConfig } from 'src/libs/config';
import { useStore } from 'src/libs/react-utils';
import { authStore, userStore } from 'src/libs/state';

/**
 * Base URL of the Broad Institute's Manifold instance ("Broad on Manifold"), or undefined when the
 * Broad on Manifold entry points are switched off. They are on only for the Terra brand, in environments
 * whose config sets `broadOnManifoldUrl`.
 */
export const getBroadOnManifoldUrl = (): string | undefined => {
  const url = getConfig().broadOnManifoldUrl;
  return isTerra() && url ? url : undefined;
};

export const isBroadOnManifoldEnabled = (): boolean => !!getBroadOnManifoldUrl();

/**
 * Whether to show Broad on Manifold to the current user: the feature is enabled, and Sam grants the user the
 * `broad-on-manifold` enterprise feature. The allowlist is a Sam group in that feature's `user` policy, so it changes
 * without a release. Undefined while a signed-in user's Sam state is still loading, so callers can wait rather than
 * flash a "no"; false for signed-out visitors.
 */
export const useIsBroadOnManifoldUser = (): boolean | undefined => {
  const { signInStatus } = useStore(authStore);
  const { enterpriseFeatures } = useStore(userStore);
  if (!isBroadOnManifoldEnabled()) {
    return false;
  }
  if (signInStatus === 'authenticated') {
    return undefined;
  }
  return signInStatus === 'userLoaded' && enterpriseFeatures.includes(BROAD_ON_MANIFOLD_ENTERPRISE_FEATURE_ID);
};

/** Manifold's projects page. Signed-out users are sent to Manifold's own login first. */
export const getBroadOnManifoldSignInUrl = (): string => `${getBroadOnManifoldUrl()}/nova/projects`;

export const broadCostObjectRequestUrl = 'https://broad.io/billingaccountrequest';

/** Color mixing functions for the Manifold theme, the Manifold equivalent of `src/libs/colors`. */
export const manifoldColors = enrichTheme(brands.manifold.theme).colors;
