import React, { ReactNode } from 'react';
import { PageBox, PageBoxVariants } from 'src/components/PageBox';
import { userHasAccessToEnterpriseFeature } from 'src/enterprise-features/features';
import { getConfig } from 'src/libs/config';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import { SAGE_ACCOUNT_LINKING } from 'src/libs/feature-previews-config';
import { NihAccount } from 'src/profile/external-identities/NihAccount';
import { OAuth2Account } from 'src/profile/external-identities/OAuth2Account';
import { oauth2Provider, OAuth2ProviderKey } from 'src/profile/external-identities/OAuth2Providers';

type ExternalIdentitiesProps = {
  queryParams: { [key: string]: string };
};

export const ExternalIdentities = (props: ExternalIdentitiesProps): ReactNode => {
  const { queryParams } = props;
  const providers = (getConfig().externalCreds?.providers || []) as OAuth2ProviderKey[];
  const filteredProviders = providers.filter(
    (p: any) =>
      (p !== 'github' && p !== 'sage') ||
      (p === 'github' && userHasAccessToEnterpriseFeature('github-account-linking')) ||
      (p === 'sage' && isFeaturePreviewEnabled(SAGE_ACCOUNT_LINKING))
  );

  return (
    <PageBox role='main' style={{ flexGrow: 1 }} variant={PageBoxVariants.light}>
      <NihAccount nihToken={queryParams?.['nih-username-token']} />
      {filteredProviders.map((providerKey: OAuth2ProviderKey) => (
        <OAuth2Account
          key={`oauth2link-${providerKey}`}
          queryParams={queryParams}
          provider={oauth2Provider(providerKey)}
        />
      ))}
    </PageBox>
  );
};
