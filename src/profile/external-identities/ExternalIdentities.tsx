import React, { ReactNode } from 'react';
import { PageBox, PageBoxVariants } from 'src/components/PageBox';
import { userHasAccessToEnterpriseFeature } from 'src/enterprise-features/features';
import { getConfig } from 'src/libs/config';
import { NihAccount } from 'src/profile/external-identities/NihAccount';
import { OAuth2Account } from 'src/profile/external-identities/OAuth2Account';
import { oauth2Provider, OAuth2ProviderKey } from 'src/profile/external-identities/OAuth2Providers';

type ExternalIdentitiesProps = {
  queryParams: { [key: string]: string };
};

export const ExternalIdentities = (props: ExternalIdentitiesProps): ReactNode => {
  const { queryParams } = props;

  return (
    <PageBox role="main" style={{ flexGrow: 1 }} variant={PageBoxVariants.light}>
      <NihAccount nihToken={queryParams?.['nih-username-token']} />
      {getConfig()
        .externalCreds?.providers.filter((p) => p !== 'github')
        .map((providerKey: OAuth2ProviderKey) => (
          <OAuth2Account
            key={`oauth2link-${providerKey}`}
            queryParams={queryParams}
            provider={oauth2Provider(providerKey)}
          />
        ))}
      {getConfig().externalCreds?.providers.includes('github') &&
        userHasAccessToEnterpriseFeature('github-account-linking') && (
          <OAuth2Account key="oauth2link-github}" queryParams={queryParams} provider={oauth2Provider('github')} />
        )}
    </PageBox>
  );
};
