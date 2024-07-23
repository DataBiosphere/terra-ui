import _ from 'lodash/fp';
import { OAuth2, OidcConfig } from 'src/libs/ajax/OAuth2';
import { oidcStore } from 'src/libs/state';

// This is the first thing that happens on app load.
export const initializeClientId = _.memoize(async (): Promise<void> => {
  const oidcConfig: OidcConfig = await OAuth2().getConfiguration();
  oidcStore.update((state) => ({ ...state, config: oidcConfig }));
});
