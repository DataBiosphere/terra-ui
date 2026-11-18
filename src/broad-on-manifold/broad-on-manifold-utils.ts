import { enrichTheme } from '@terra-ui-packages/components';
import { isTerra } from 'src/libs/brand-utils';
import { brands } from 'src/libs/brands';
import { getConfig } from 'src/libs/config';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import { BROAD_ON_MANIFOLD_FEATURE_ID } from 'src/libs/feature-previews-config';
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

/** Broad on Manifold is only for Broad Institute accounts, which are the only ones that can sign in to it. */
export const isBroadInstituteEmail = (email: string | undefined): boolean =>
  !!email && email.toLowerCase().endsWith('@broadinstitute.org');

/**
 * Whether to show Broad on Manifold to the current user: the feature is enabled, and the user is signed in with a
 * Broad Institute email. Signed-out and non-Broad users never see any mention of Manifold. The email comes from the
 * sign-in token, which is stored before the user counts as signed in, so this does not flicker while Sam loads.
 */
export const useIsBroadOnManifoldUser = (): boolean => {
  const { signInStatus } = useStore(authStore);
  const { terraUser } = useStore(userStore);
  const isSignedIn = signInStatus === 'authenticated' || signInStatus === 'userLoaded';
  return isBroadOnManifoldEnabled() && isSignedIn && isBroadInstituteEmail(terraUser.email);
};

/** Manifold's projects page. Signed-out users are sent to Manifold's own login first. */
export const getBroadOnManifoldSignInUrl = (): string => `${getBroadOnManifoldUrl()}/nova/projects`;

export const broadCostObjectRequestUrl = 'https://broad.io/billingaccountrequest';

/** Color mixing functions for the Manifold theme, the Manifold equivalent of `src/libs/colors`. */
export const manifoldColors = enrichTheme(brands.manifold.theme).colors;

/**
 * Whether to show the Terra and Manifold cards on the landing page: the user is a Broad on Manifold user and has
 * turned on the hidden "Broad on Manifold" feature preview. The two Broad on Manifold pages need only the former.
 */
export const useShowBroadOnManifoldCards = (): boolean => {
  const isBroadOnManifoldUser = useIsBroadOnManifoldUser();
  return isBroadOnManifoldUser && isFeaturePreviewEnabled(BROAD_ON_MANIFOLD_FEATURE_ID);
};
