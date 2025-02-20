import { Link } from '@terra-ui-packages/components';
import React, { Fragment } from 'react';
import { h } from 'react-hyperscript-helpers';

const linkProps = {
  style: { textDecoration: 'underline' },
  target: '_blank',
};

export const tooltipMessages: Record<string, React.ReactElement> = {
  ras: h(Fragment, [
    'Linking with RAS will allow Terra to automatically determine if you can access controlled datasets hosted in Terra based on your valid passport visas or your valid dbGaP applications via eRA Commons. Terra currently supports RAS authentication for AnVIL. Visit ',
    h(Link, { href: 'https://anvilproject.org/', ...linkProps }, ['AnVIL Portal']),
    ' to see what datasets are available.',
  ]),
  fence: h(Fragment, [
    'Linking with NHLBI BDC will allow Terra to automatically determine if you can access controlled datasets hosted on the Gen3 platform. Visit ',
    h(Link, { href: 'https://gen3.biodatacatalyst.nhlbi.nih.gov/', ...linkProps }, ['NHLBI BioData Catalyst']),
    ' to see what datasets are available.',
  ]),
  dcf_fence: h(Fragment, [
    'Linking with NCI CRDC will allow Terra to automatically determine if you can access controlled datasets hosted on the Gen3 platform. Visit ',
    h(Link, { href: 'https://nci-crdc.datacommons.io/', ...linkProps }, ['NCI Data Commons Framework Services']),
    ' to see what datasets are available.',
  ]),
  kids_first: h(Fragment, [
    'Linking with Kids First DRC will allow Terra to automatically determine if you can access controlled datasets hosted on the Gen3 platform. Visit ',
    h(Link, { href: 'https://data.kidsfirstdrc.org/', ...linkProps }, ['Kids First Data Catalog Portal']),
    ' to see what datasets are available.',
  ]),
};
