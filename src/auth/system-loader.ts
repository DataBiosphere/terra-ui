import { Ajax } from 'src/libs/ajax';
import { SamTermsOfServiceConfig } from 'src/libs/ajax/TermsOfService';
import { SystemState, systemStore } from 'src/libs/state';

export const initializeSystemProperties = async (): Promise<void> => {
  const termsOfServiceConfig: SamTermsOfServiceConfig = await Ajax().TermsOfService.getTermsOfServiceConfig();
  systemStore.update((state: SystemState) => ({
    ...state,
    termsOfServiceConfig,
  }));
};
