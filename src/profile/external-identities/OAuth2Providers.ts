import { Link } from '@terra-ui-packages/components';
import React, { Fragment } from 'react';
import { h } from 'react-hyperscript-helpers';
import { getConfig } from 'src/libs/config';

export type OAuth2ProviderKey = 'github' | 'ras' | 'fence' | 'dcf-fence' | 'kids-first' | 'sage';
export type OAuth2Callback =
  | { name: 'oauth-callback'; link: 'oauth_callback' }
  | { name: 'ecm-callback'; link: 'ecm-callback' }
  | { name: 'fence-callback'; link: '#fence-callback' };

export type OAuth2Provider = {
  key: OAuth2ProviderKey;
  name: string;
  short: string;
  queryParams: {
    scopes?: string[];
    redirectUri: string;
  };
  supportsAccessToken: boolean;
  supportsIdToken: boolean;
  isFence: boolean;
  toolTip?: React.ReactElement;
};

const createRedirectUri = (callback: OAuth2Callback['link']) => {
  return `${window.location.origin}/${callback}`;
};

const toolTipLinkProps = {
  style: { textDecoration: 'underline' },
  target: '_blank',
};

export const oauth2Provider = (providerKey: OAuth2ProviderKey): OAuth2Provider => {
  switch (providerKey) {
    case 'github':
      return {
        key: providerKey,
        name: 'GitHub',
        short: 'GitHub',
        queryParams: {
          redirectUri: createRedirectUri('oauth_callback'),
        },
        supportsAccessToken: true,
        supportsIdToken: false,
        isFence: false,
      };
    case 'ras':
      return {
        key: providerKey,
        name: 'NIH Researcher Auth Service (RAS)',
        short: 'RAS',
        queryParams: {
          scopes: ['openid', 'email', 'ga4gh_passport_v1', 'federated_identities_ial2'],
          redirectUri: createRedirectUri('ecm-callback'),
        },
        supportsAccessToken: false,
        supportsIdToken: false, // turning off clipboard copying for now.
        isFence: false,
        toolTip: h(Fragment, [
          'Linking with RAS will allow Terra to automatically determine if you can access controlled datasets hosted in Terra based on your valid passport visas or your valid dbGaP applications via eRA Commons. Terra currently supports RAS authentication for AnVIL. Visit ',
          h(Link, { href: 'https://anvilproject.org/', ...toolTipLinkProps }, ['AnVIL Portal']),
          ' to see what datasets are available.',
        ]),
      };
    case 'fence':
      return {
        key: providerKey,
        name: 'NHLBI BioData Catalyst Framework Services',
        short: 'NHLBI',
        queryParams: {
          redirectUri: createRedirectUri('#fence-callback'),
        },
        supportsAccessToken: true,
        supportsIdToken: false,
        isFence: true,
        toolTip: h(Fragment, [
          'Linking with NHLBI BDC will allow Terra to automatically determine if you can access controlled datasets hosted on the Gen3 platform. Visit ',
          h(Link, { href: 'https://gen3.biodatacatalyst.nhlbi.nih.gov/', ...toolTipLinkProps }, [
            'NHLBI BioData Catalyst',
          ]),
          ' to see what datasets are available.',
        ]),
      };
    case 'dcf-fence':
      return {
        key: providerKey,
        name: 'NCI CRDC Framework Services',
        short: 'NCI',
        queryParams: {
          redirectUri: createRedirectUri('#fence-callback'),
        },
        supportsAccessToken: true,
        supportsIdToken: false,
        isFence: true,
        toolTip: h(Fragment, [
          'Linking with NCI CRDC will allow Terra to automatically determine if you can access controlled datasets hosted on the Gen3 platform. Visit ',
          h(Link, { href: 'https://nci-crdc.datacommons.io/', ...toolTipLinkProps }, [
            'NCI Data Commons Framework Services',
          ]),
          ' to see what datasets are available.',
        ]),
      };
    case 'kids-first':
      return {
        key: providerKey,
        name: 'Kids First DRC Framework Services',
        short: 'Kids First',
        queryParams: {
          redirectUri: createRedirectUri('#fence-callback'),
        },
        supportsAccessToken: true,
        supportsIdToken: false,
        isFence: true,
        toolTip: h(Fragment, [
          'Linking with Kids First DRC will allow Terra to automatically determine if you can access controlled datasets hosted on the Gen3 platform. Visit ',
          h(Link, { href: 'https://data.kidsfirstdrc.org/', ...toolTipLinkProps }, ['Kids First Data Catalog Portal']),
          ' to see what datasets are available.',
        ]),
      };
    case 'sage':
      return {
        key: providerKey,
        name: 'Sage Bionetworks',
        short: 'Sage',
        queryParams: {
          redirectUri: createRedirectUri('ecm-callback'),
        },
        supportsAccessToken: true,
        supportsIdToken: false,
        isFence: false,
        toolTip: h(Fragment, [
          'Linking with the Sage AD Knowledge Portal will allow Terra to automatically determine if you can access datasets hosted by Sage. Visit ',
          h(Link, { href: 'https://adknowledgeportal.synapse.org/', ...toolTipLinkProps }, ['AD Knowledge Portal']),
          ' to see what datasets are available.',
        ]),
      };
    default:
      throw new Error(`Unknown OAuth2 provider key: ${providerKey}`);
  }
};

const providers = (getConfig().externalCreds?.providers ?? []) as OAuth2ProviderKey[];

export const allOAuth2Providers: OAuth2Provider[] = providers.map((key) => oauth2Provider(key));
