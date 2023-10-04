import { getConfig } from 'src/libs/config';

const terraDeploymentEnv = getConfig().terraDeploymentEnv;

const anvil =
  terraDeploymentEnv === 'prod' ? [{ key: 'anvil', name: 'NHGRI AnVIL Data Commons Framework Services', expiresAfter: 30, short: 'NHGRI' }] : [];

const allProviders = [
  { key: 'fence', name: 'NHLBI BioData Catalyst Framework Services', expiresAfter: 30, short: 'NHLBI' },
  { key: 'dcf-fence', name: 'NCI CRDC Framework Services', expiresAfter: 15, short: 'NCI' },
  ...anvil,
  { key: 'kids-first', name: 'Kids First DRC Framework Services', expiresAfter: 30, short: 'KidsFirst' },
];

export default allProviders;
