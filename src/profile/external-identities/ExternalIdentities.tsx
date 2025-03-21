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
  const providers = (getConfig().externalCreds?.providers || []) as OAuth2ProviderKey[];
  const hasRas = providers.includes('ras');
  const filteredProviders = providers.filter(
    (p: any) => p !== 'github' || userHasAccessToEnterpriseFeature('github-account-linking')
  );

  return (
    <PageBox role='main' style={{ flexGrow: 1 }} variant={PageBoxVariants.light}>
      {!hasRas && <NihAccount nihToken={queryParams?.['nih-username-token']} />}
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
