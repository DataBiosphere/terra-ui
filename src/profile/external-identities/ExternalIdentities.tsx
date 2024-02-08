import _ from 'lodash/fp';
import React from 'react';
import { PageBox, PageBoxVariants } from 'src/components/PageBox';
import { getConfig } from 'src/libs/config';
import allProviders from 'src/libs/providers';
import { FenceAccount } from 'src/profile/external-identities/FenceAccount';
import { NihAccount } from 'src/profile/external-identities/NihAccount';
import { OAuth2Link } from 'src/profile/external-identities/OAuth2Link';
import { PassportLinker } from 'src/profile/external-identities/PassportLinker';

type ExternalIdentitiesProps = {
  queryParams: { [key: string]: string };
};

export const ExternalIdentities = (props: ExternalIdentitiesProps) => {
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
      {getConfig().externalCredsUrlRoot && <PassportLinker queryParams={queryParams} provider="ras" prettyName="RAS" />}
      <OAuth2Link queryParams={queryParams} provider="github" prettyName="GitHub" />
    </PageBox>
  );
};
