import _ from 'lodash/fp';
import React, { ReactNode } from 'react';
import { PageBox, PageBoxVariants } from 'src/components/PageBox';
import { userHasAccessToEnterpriseFeature } from 'src/enterprise-features/features';
import { getConfig } from 'src/libs/config';
import allProviders from 'src/libs/providers';
import { FenceAccount } from 'src/profile/external-identities/FenceAccount';
import { NihAccount } from 'src/profile/external-identities/NihAccount';
import { OAuth2Link } from 'src/profile/external-identities/OAuth2Link';
import { oauth2Provider } from 'src/profile/external-identities/OAuth2Providers';

type ExternalIdentitiesProps = {
  queryParams: { [key: string]: string };
};

export const ExternalIdentities = (props: ExternalIdentitiesProps): ReactNode => {
  const { queryParams } = props;

  return (
    <PageBox role="main" style={{ flexGrow: 1 }} variant={PageBoxVariants.light}>
      <NihAccount nihToken={queryParams?.['nih-username-token']} />
      {_.map(
        (provider) => (
          <FenceAccount key={provider.key} provider={provider} />
        ),
        allProviders
      )}
      {getConfig().externalCreds?.providers.includes('ras') && (
        <OAuth2Link key="oauth2link-ras}" queryParams={queryParams} provider={oauth2Provider('ras')} />
      )}
      {getConfig().externalCreds?.providers.includes('github') &&
        userHasAccessToEnterpriseFeature('github-account-linking') && (
          <OAuth2Link key="oauth2link-github}" queryParams={queryParams} provider={oauth2Provider('github')} />
        )}
    </PageBox>
  );
};
