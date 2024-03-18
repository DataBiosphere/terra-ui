import React, { ReactNode } from 'react';
import { PageBox, PageBoxVariants } from 'src/components/PageBox';
import { getConfig } from 'src/libs/config';
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
      {getConfig().externalCreds?.providers.map((providerKey) => (
        <OAuth2Link
          key={`oauth2link-${providerKey}`}
          queryParams={queryParams}
          provider={oauth2Provider(providerKey)}
        />
      ))}
    </PageBox>
  );
};
