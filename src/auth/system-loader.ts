import { Ajax } from 'src/libs/ajax';
import { SamTermsOfServiceConfig } from 'src/libs/ajax/TermsOfService';
import { AuthState, authStore, SystemProperties } from 'src/libs/state';

export const initializeSystemProperties = async (): Promise<void> => {
  const termsOfServiceConfig: SamTermsOfServiceConfig = await Ajax().TermsOfService.getTermsOfServiceConfig();
  const system: SystemProperties = { termsOfServiceConfig };
  authStore.update((state: AuthState) => ({
    ...state,
    system,
  }));
};
