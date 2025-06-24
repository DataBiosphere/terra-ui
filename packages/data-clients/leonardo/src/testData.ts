import { cloudProviderTypes } from './core-models';
import { RawListDiskItem } from './disk-models';

export const azureDisk: RawListDiskItem = {
  id: 16902,
  cloudContext: {
    cloudProvider: 'AZURE',
    cloudResource: 'testCloudResource',
  },
  zone: 'eastus',
  name: 'testAzurePD',
  status: 'Ready',
  auditInfo: {
    creator: 'test.user@gmail.com',
    createdDate: '2023-02-01T20:40:50.428281Z',
    destroyedDate: null,
    dateAccessed: '2023-02-01T20:41:00.357Z',
  },
  size: 50,
  diskType: 'pd-standard',
  blockSize: 4096,
  labels: {
    saturnWorkspaceNamespace: 'test-azure-ws-namespace',
    saturnWorkspaceName: 'test-azure-ws-name',
  },
};

export const galaxyDisk: RawListDiskItem = {
  auditInfo: {
    creator: 'cahrens@gmail.com',
    createdDate: '2021-11-29T20:19:13.162484Z',
    destroyedDate: null,
    dateAccessed: '2021-11-29T20:19:14.114Z',
  },
  blockSize: 4096,
  diskType: 'pd-standard',
  cloudContext: {
    cloudProvider: cloudProviderTypes.GCP,
    cloudResource: 'terra-test-e4000484',
  },
  id: 10,
  labels: { saturnApplication: 'galaxy', saturnWorkspaceName: 'test-workspace' }, // Note 'galaxy' vs. 'GALAXY', to represent our older naming scheme
  name: 'saturn-pd-026594ac-d829-423d-a8df-76fe96f5b4e7',
  size: 500,
  status: 'Ready',
  zone: 'us-central1-a',
};
