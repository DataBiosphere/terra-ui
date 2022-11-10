import { addDays, subDays } from 'date-fns'
import { getGoogleRuntime } from 'src/pages/workspaces/workspace/analysis/_testData/testData'
import {
  getAnalysesDisplayList, getCostDisplayForDisk, getCostDisplayForTool, getCurrentApp, getCurrentAppDataDisk, getCurrentAppIncludingDeleting,
  getCurrentRuntime, getDiskAppType, runtimeStatuses, workspaceHasMultipleApps, workspaceHasMultipleDisks
} from 'src/pages/workspaces/workspace/analysis/runtime-utils'
import { tools } from 'src/pages/workspaces/workspace/analysis/tool-utils'


jest.mock('src/data/machines', () => {
  const originalModule = jest.requireActual('src/data/machines')

  return {
    ...originalModule,
    regionToPrices: [
      {
        name: 'US-CENTRAL1', monthlyStandardDiskPrice: 0.04, monthlySSDDiskPrice: 0.17, monthlyBalancedDiskPrice: 0.1,
        n1HourlyGBRamPrice: 0.004237, n1HourlyCpuPrice: 0.031611, preemptibleN1HourlyGBRamPrice: 0.000892, preemptibleN1HourlyCpuPrice: 0.006655,
        t4HourlyPrice: 0.35, p4HourlyPrice: 0.6, k80HourlyPrice: 0.45, v100HourlyPrice: 2.48, p100HourlyPrice: 1.46,
        preemptibleT4HourlyPrice: 0.11, preemptibleP4HourlyPrice: 0.216, preemptibleK80HourlyPrice: 0.0375,
        preemptibleV100HourlyPrice: 0.74, preemptibleP100HourlyPrice: 0.43
      }
    ]
  }
})

const cromwellRunning = {
  appName: 'terra-app-83f46705-524c-4fc8-xcyc-97fdvcfby14f',
  appType: 'CROMWELL',
  auditInfo: {
    creator: 'cahrens@gmail.com', createdDate: '2021-11-28T20:28:01.998494Z', destroyedDate: null, dateAccessed: '2021-11-28T20:28:01.998494Z'
  },
  diskName: 'saturn-pd-693a9707-634d-4134-bb3a-xyz73cd5a8ce',
  errors: [],
  googleProject: 'terra-test-e4000484',
  kubernetesRuntimeConfig: { numNodes: 1, machineType: 'n1-highmem-8', autoscalingEnabled: false },
  labels: {},
  proxyUrls: { 'cromwell-service': 'https://leonardo-fiab.dsde-dev.broadinstitute.org/fd0cfbb14f/cromwell-service/swagger/cromwell.yaml' },
  status: 'RUNNING'
}

// Newer than cromwellRunning
const cromwellProvisioning = {
  appName: 'terra-app-73f46705-524c-4fc8-ac8c-07fd0cfbb14f',
  appType: 'CROMWELL',
  auditInfo: {
    creator: 'cahrens@gmail.com', createdDate: '2021-11-29T20:28:01.998494Z', destroyedDate: null, dateAccessed: '2021-11-29T20:28:01.998494Z'
  },
  diskName: 'saturn-pd-693a9707-634d-4134-bb3a-cbb73cd5a8ce',
  errors: [],
  googleProject: 'terra-test-e4000484',
  kubernetesRuntimeConfig: { numNodes: 1, machineType: 'n1-highmem-8', autoscalingEnabled: false },
  labels: {},
  proxyUrls: { 'cromwell-service': 'https://leonardo-fiab.dsde-dev.broadinstitute.org/fd0cfbb14f/cromwell-service/swagger/cromwell.yaml' },
  status: 'PROVISIONING'
}

const galaxyRunning = {
  appName: 'terra-app-69200c2f-89c3-47db-874c-b770d8de737f',
  appType: 'GALAXY',
  auditInfo: {
    creator: 'cahrens@gmail.com', createdDate: '2021-11-29T20:19:13.162484Z', destroyedDate: null, dateAccessed: '2021-11-29T20:19:13.162484Z'
  },
  diskName: 'saturn-pd-026594ac-d829-423d-a8df-76fe96f5b4e7',
  errors: [],
  googleProject: 'terra-test-e4000484',
  kubernetesRuntimeConfig: { numNodes: 1, machineType: 'n1-highmem-8', autoscalingEnabled: false },
  labels: {},
  proxyUrls: { galaxy: 'https://leonardo-fiab.dsde-dev.broadinstitute.org/a-app-69200c2f-89c3-47db-874c-b770d8de737f/galaxy' },
  status: 'RUNNING'
}

// Newer than galaxyRunning
const galaxyDeleting = {
  appName: 'terra-app-71200c2f-89c3-47db-874c-b770d8de22g',
  appType: 'GALAXY',
  auditInfo: {
    creator: 'cahrens@gmail.com', createdDate: '2021-11-30T20:19:13.162484Z', destroyedDate: null, dateAccessed: '2021-11-30T20:19:13.162484Z'
  },
  diskName: 'saturn-pd-1236594ac-d829-423d-a8df-76fe96f5897',
  errors: [],
  googleProject: 'terra-test-e4000484',
  kubernetesRuntimeConfig: { numNodes: 1, machineType: 'n1-highmem-8', autoscalingEnabled: false },
  labels: {},
  proxyUrls: { galaxy: 'https://leonardo-fiab.dsde-dev.broadinstitute.org/a-app-69200c2f-89c3-47db-874c-b770d8de737f/galaxy' },
  status: 'DELETING'
}

const mockApps = [cromwellProvisioning, cromwellRunning, galaxyRunning, galaxyDeleting]

const galaxy1Workspace1 = {
  appName: 'terra-app-69200c2f-89c3-47db-874c-b770d8de858g',
  appType: 'GALAXY',
  auditInfo: {
    creator: 'cahrens@gmail.com', createdDate: '2021-12-10T20:19:13.162484Z', destroyedDate: null, dateAccessed: '2021-12-11T20:19:13.162484Z'
  },
  diskName: 'saturn-pd-026594ac-d829-423d-a8df-87fe07f6b5e8', // galaxyDisk1Workspace1
  errors: [],
  googleProject: 'terra-test-e4000484',
  kubernetesRuntimeConfig: { numNodes: 1, machineType: 'n1-highmem-8', autoscalingEnabled: false },
  labels: { saturnWorkspaceName: 'test-workspace' },
  proxyUrls: { galaxy: 'https://leonardo-fiab.dsde-dev.broadinstitute.org/a-app-69200c2f-89c3-47db-874c-b770d8de737f/galaxy' },
  status: 'RUNNING'
}

const galaxy2Workspace1 = {
  appName: 'terra-app-69200c2f-89c3-47db-874c-b770d8de656t',
  appType: 'GALAXY',
  auditInfo: {
    creator: 'cahrens@gmail.com', createdDate: '2021-12-10T20:19:13.162484Z', destroyedDate: null, dateAccessed: '2021-12-11T20:19:13.162484Z'
  },
  diskName: 'saturn-pd-026594ac-d829-423d-a8df-98fe18f7b6e9', // galaxyDisk2Workspace1
  errors: [],
  googleProject: 'terra-test-e4000484',
  kubernetesRuntimeConfig: { numNodes: 1, machineType: 'n1-highmem-8', autoscalingEnabled: false },
  labels: { saturnWorkspaceName: 'test-workspace' },
  proxyUrls: { galaxy: 'https://leonardo-fiab.dsde-dev.broadinstitute.org/a-app-69200c2f-89c3-47db-874c-b770d8de737f/galaxy' },
  status: 'RUNNING'
}

const cromwell1Workspace1 = {
  appName: 'terra-app-69200c2f-89c3-47db-874c-b770d8de656t',
  appType: 'GALAXY',
  auditInfo: {
    creator: 'cahrens@gmail.com', createdDate: '2021-12-10T20:19:13.162484Z', destroyedDate: null, dateAccessed: '2021-12-11T20:19:13.162484Z'
  },
  diskName: 'saturn-pd-026594ac-d829-423d-a8df-55fe36f5b4e8', // cromwellDisk1Workspace1
  errors: [],
  googleProject: 'terra-test-e4000484',
  kubernetesRuntimeConfig: { numNodes: 1, machineType: 'n1-highmem-8', autoscalingEnabled: false },
  labels: { saturnWorkspaceName: 'test-workspace' },
  proxyUrls: { galaxy: 'https://leonardo-fiab.dsde-dev.broadinstitute.org/a-app-69200c2f-89c3-47db-874c-b770d8de737f/galaxy' },
  status: 'RUNNING'
}

const mockAppsSameWorkspace = [galaxy1Workspace1, galaxy2Workspace1, cromwell1Workspace1]

const galaxyDisk = {
  auditInfo: {
    creator: 'cahrens@gmail.com', createdDate: '2021-11-29T20:19:13.162484Z', destroyedDate: null, dateAccessed: '2021-11-29T20:19:14.114Z'
  },
  blockSize: 4096,
  diskType: 'pd-standard',
  googleProject: 'terra-test-e4000484',
  id: 10,
  labels: { saturnApplication: 'galaxy', saturnWorkspaceName: 'test-workspace' }, // Note 'galaxy' vs. 'GALAXY', to represent our older naming scheme
  name: 'saturn-pd-026594ac-d829-423d-a8df-76fe96f5b4e7',
  size: 500,
  status: 'Ready',
  zone: 'us-central1-a'
}

const galaxyDiskUpdatedPd = {
  auditInfo: {
    creator: 'cahrens@gmail.com', createdDate: '2021-11-29T20:19:13.162484Z', destroyedDate: null, dateAccessed: '2021-11-29T20:19:14.114Z'
  },
  blockSize: 4096,
  diskType: {
    displayName: 'Standard',
    label: 'pd-standard',
    regionToPricesName: 'monthlyStandardDiskPrice'
  },
  googleProject: 'terra-test-e4000484',
  id: 10,
  labels: { saturnApplication: 'galaxy', saturnWorkspaceName: 'test-workspace' }, // Note 'galaxy' vs. 'GALAXY', to represent our older naming scheme
  name: 'saturn-pd-026594ac-d829-423d-a8df-76fe96f5b4e7',
  size: 500,
  status: 'Ready',
  zone: 'us-central1-a'
}

// Newer than galaxyDisk, attached to galaxyDeleting app.
const galaxyDeletingDisk = {
  auditInfo: {
    creator: 'cahrens@gmail.com', createdDate: '2021-11-30T20:19:13.162484Z', destroyedDate: null, dateAccessed: '2021-11-30T20:19:14.114Z'
  },
  blockSize: 4096,
  diskType: 'pd-standard',
  googleProject: 'terra-test-e4000484',
  id: 10,
  labels: { saturnApplication: 'GALAXY', saturnWorkspaceName: 'test-workspace' },
  name: 'saturn-pd-1236594ac-d829-423d-a8df-76fe96f5897',
  size: 500,
  status: 'Deleting',
  zone: 'us-central1-a'
}

const galaxyDeletingDiskUpdatedPd = {
  auditInfo: {
    creator: 'cahrens@gmail.com', createdDate: '2021-11-30T20:19:13.162484Z', destroyedDate: null, dateAccessed: '2021-11-30T20:19:14.114Z'
  },
  blockSize: 4096,
  diskType: {
    displayName: 'Standard',
    label: 'pd-standard',
    regionToPricesName: 'monthlyStandardDiskPrice'
  },
  googleProject: 'terra-test-e4000484',
  id: 10,
  labels: { saturnApplication: 'GALAXY', saturnWorkspaceName: 'test-workspace' },
  name: 'saturn-pd-1236594ac-d829-423d-a8df-76fe96f5897',
  size: 500,
  status: 'Deleting',
  zone: 'us-central1-a'
}

const cromwellUnattachedDisk = {
  auditInfo: {
    creator: 'cahrens@gmail.com', createdDate: '2021-11-30T02:21:00.705505Z', destroyedDate: null, dateAccessed: '2021-11-30T02:21:00.705505Z'
  },
  blockSize: 4096,
  diskType: 'pd-standard',
  googleProject: 'terra-test-e4000484',
  id: 12,
  labels: { saturnApplication: 'CROMWELL', saturnWorkspaceName: 'test-workspace' },
  name: 'saturn-pd-7fc0c398-63fe-4441-aea5-1e794c961310',
  size: 500,
  status: 'Ready',
  zone: 'us-central1-a'
}

const cromwellUnattachedDiskUpdatedPd = {
  auditInfo: {
    creator: 'cahrens@gmail.com', createdDate: '2021-11-30T02:21:00.705505Z', destroyedDate: null, dateAccessed: '2021-11-30T02:21:00.705505Z'
  },
  blockSize: 4096,
  diskType: {
    displayName: 'Standard',
    label: 'pd-standard',
    regionToPricesName: 'monthlyStandardDiskPrice'
  },
  googleProject: 'terra-test-e4000484',
  id: 12,
  labels: { saturnApplication: 'CROMWELL', saturnWorkspaceName: 'test-workspace' },
  name: 'saturn-pd-7fc0c398-63fe-4441-aea5-1e794c961310',
  size: 500,
  status: 'Ready',
  zone: 'us-central1-a'
}

// Older than cromwellUnattachedDisk, attached to cromwellProvisioning app.
const cromwellProvisioningDisk = {
  auditInfo: {
    creator: 'cahrens@gmail.com', createdDate: '2021-11-29T20:28:01.998494Z', destroyedDate: null, dateAccessed: '2021-11-29T20:28:03.109Z'
  },
  blockSize: 4096,
  diskType: 'pd-standard',
  googleProject: 'terra-test-e4000484',
  id: 11,
  labels: { saturnApplication: 'CROMWELL', saturnWorkspaceName: 'test-workspace' },
  name: 'saturn-pd-693a9707-634d-4134-bb3a-cbb73cd5a8ce',
  size: 500,
  status: 'Creating',
  zone: 'us-central1-a'
}

const cromwellProvisioningDiskUpdatedPd = {
  auditInfo: {
    creator: 'cahrens@gmail.com', createdDate: '2021-11-29T20:28:01.998494Z', destroyedDate: null, dateAccessed: '2021-11-29T20:28:03.109Z'
  },
  blockSize: 4096,
  diskType: {
    displayName: 'Standard',
    label: 'pd-standard',
    regionToPricesName: 'monthlyStandardDiskPrice'
  },
  googleProject: 'terra-test-e4000484',
  id: 11,
  labels: { saturnApplication: 'CROMWELL', saturnWorkspaceName: 'test-workspace' },
  name: 'saturn-pd-693a9707-634d-4134-bb3a-cbb73cd5a8ce',
  size: 500,
  status: 'Creating',
  zone: 'us-central1-a'
}

const jupyter1 = {
  id: 75239,
  workspaceId: null,
  runtimeName: 'saturn-eae9168f-9b99-4910-945e-dbab66e04d91',
  googleProject: 'terra-dev-cf677740',
  cloudContext: {
    cloudProvider: 'GCP',
    cloudResource: 'terra-dev-cf677740'
  },
  auditInfo: {
    creator: 'testuser123@broad.com',
    createdDate: '2022-07-18T18:35:32.012698Z',
    destroyedDate: null,
    dateAccessed: '2022-07-18T21:44:17.565Z'
  },
  runtimeConfig: {
    machineType: 'n1-standard-1',
    persistentDiskId: 14692,
    cloudService: 'GCE',
    bootDiskSize: 120,
    zone: 'us-central1-a',
    gpuConfig: null
  },
  proxyUrl: 'https://leonardo.dsde-dev.broadinstitute.org/proxy/terra-dev-cf677740/saturn-eae9168f-9b99-4910-945e-dbab66e04d91/jupyter',
  status: 'Running',
  labels: {
    saturnWorkspaceNamespace: 'general-dev-billing-account',
    'saturn-iframe-extension': 'https://bvdp-saturn-dev.appspot.com/jupyter-iframe-extension.js',
    creator: 'testuser123@broad.com',
    clusterServiceAccount: 'pet-26534176105071279add1@terra-dev-cf677740.iam.gserviceaccount.com',
    saturnAutoCreated: 'true',
    clusterName: 'saturn-eae9168f-9b99-4910-945e-dbab66e04d91',
    saturnWorkspaceName: 'Broad Test Workspace',
    saturnVersion: '6',
    tool: 'Jupyter',
    runtimeName: 'saturn-eae9168f-9b99-4910-945e-dbab66e04d91',
    cloudContext: 'Gcp/terra-dev-cf677740',
    googleProject: 'terra-dev-cf677740'
  },
  patchInProgress: false
}

const jupyter1Disk = {
  id: 14692,
  googleProject: 'terra-dev-cf677740',
  cloudContext: {
    cloudProvider: 'GCP',
    cloudResource: 'terra-dev-cf677740'
  },
  zone: 'us-central1-a',
  name: 'saturn-pd-c4aea6ef-5618-47d3-b674-5d456c9dcf4f',
  status: 'Ready',
  auditInfo: {
    creator: 'testuser123@broad.com',
    createdDate: '2022-07-18T18:35:32.012698Z',
    destroyedDate: null,
    dateAccessed: '2022-07-18T20:34:56.092Z'
  },
  size: 50,
  diskType: {
    label: 'pd-standard',
    displayName: 'Standard',
    regionToPricesName: 'monthlyStandardDiskPrice'
  },
  blockSize: 4096,
  labels: {
    saturnWorkspaceNamespace: 'general-dev-billing-account',
    saturnWorkspaceName: 'Broad Test Workspace'
  }
}

const jupyterDisk = {
  auditInfo: {
    creator: 'cahrens@gmail.com', createdDate: '2021-12-02T16:38:13.777424Z', destroyedDate: null, dateAccessed: '2021-12-02T16:40:23.464Z'
  },
  blockSize: 4096,
  cloudContext: { cloudProvider: 'GCP', cloudResource: 'terra-test-f828b4cd' },
  diskType: 'pd-standard',
  googleProject: 'terra-test-f828b4cd',
  id: 29,
  labels: {},
  name: 'saturn-pd-bd0d0405-c048-4212-bccf-568435933081',
  size: 50,
  status: 'Ready',
  zone: 'us-central1-a'
}

const mockAppDisks = [galaxyDisk, galaxyDeletingDisk, cromwellProvisioningDisk, cromwellUnattachedDisk]

const galaxyDisk1Workspace1 = {
  auditInfo: {
    creator: 'cahrens@gmail.com', createdDate: '2021-11-30T20:19:13.162484Z', destroyedDate: null, dateAccessed: '2021-12-10T20:19:14.114Z'
  },
  blockSize: 4096,
  diskType: 'pd-standard',
  googleProject: 'terra-test-e4000484',
  id: 13,
  labels: { saturnApplication: 'GALAXY', saturnWorkspaceName: 'test-workspace' },
  name: 'saturn-pd-026594ac-d829-423d-a8df-87fe07f6b5e8',
  size: 500,
  status: 'Ready',
  zone: 'us-central1-a'
}

const galaxyDisk2Workspace1 = {
  auditInfo: {
    creator: 'cahrens@gmail.com', createdDate: '2021-11-28T20:19:13.162484Z', destroyedDate: null, dateAccessed: '2021-11-29T20:19:14.114Z'
  },
  blockSize: 4096,
  diskType: 'pd-standard',
  googleProject: 'terra-test-e4000484',
  id: 14,
  labels: { saturnApplication: 'GALAXY', saturnWorkspaceName: 'test-workspace' },
  name: 'saturn-pd-026594ac-d829-423d-a8df-98fe18f7b6e9',
  size: 500,
  status: 'Ready',
  zone: 'us-central1-a'
}

const galaxyDisk3Workspace2 = {
  auditInfo: {
    creator: 'cahrens@gmail.com', createdDate: '2021-11-26T20:19:13.162484Z', destroyedDate: null, dateAccessed: '2021-11-29T20:19:14.114Z'
  },
  blockSize: 4096,
  diskType: 'pd-standard',
  googleProject: 'terra-test-e4000484',
  id: 15,
  labels: { saturnApplication: 'GALAXY', saturnWorkspaceName: 'test-workspace-2' },
  name: 'saturn-pd-026594ac-d829-423d-a8df-33fe36f5b4e4',
  size: 500,
  status: 'Ready',
  zone: 'us-central1-a'
}

const cromwellDisk1Workspace1 = {
  auditInfo: {
    creator: 'cahrens@gmail.com', createdDate: '2021-11-26T20:19:13.162484Z', destroyedDate: null, dateAccessed: '2021-11-29T20:19:14.114Z'
  },
  blockSize: 4096,
  diskType: 'pd-standard',
  googleProject: 'terra-test-e4000484',
  id: 16,
  labels: { saturnApplication: 'CROMWELL', saturnWorkspaceName: 'test-workspace' },
  name: 'saturn-pd-026594ac-d829-423d-a8df-55fe36f5b4e8',
  size: 500,
  status: 'Ready',
  zone: 'us-central1-a'
}

const mockAppDisksSameWorkspace = [galaxyDisk1Workspace1, galaxyDisk2Workspace1, galaxyDisk3Workspace2, cromwellDisk1Workspace1]

const mockBucketAnalyses = [
  {
    kind: 'storage#object',
    id: 'fc-703dc22f-e644-4349-b613-87f20a385429/notebooks/testA.Rmd/1650041141891593',
    name: 'notebooks/testA.Rmd',
    bucket: 'fc-703dc22f-e644-4349-b613-87f20a385429',
    generation: '1650041141891593',
    contentType: 'application/octet-stream',
    storageClass: 'STANDARD',
    size: '830',
    md5Hash: 'oOU8DFHszwwo9BbLKxmOyw==',
    crc32c: '6sSeiw==',
    etag: 'CImkgqHClvcCEB0=',
    timeCreated: '2022-04-15T16:45:41.962Z',
    updated: '2022-04-15T17:03:58.139Z',
    timeStorageClassUpdated: '2022-04-15T16:45:41.962Z',
    customTime: '1970-01-01T00:00:00Z',
    metadata:
      {
        be789c74f6bc6d9df95b9f1b7ce07b4b8b6392c1a937f3a69e2de1b508d8690d: 'doNotSync',
        lastModifiedBy: '904998e4258c146e4f94e8bd9c4689b1f759ec384199e58067bfe7efbdd79d68'
      }
  },
  {
    kind: 'storage#object',
    id: 'fc-703dc22f-e644-4349-b613-87f20a385429/notebooks/testB.Rmd/1650042135115055',
    name: 'notebooks/testB.Rmd',
    bucket: 'fc-703dc22f-e644-4349-b613-87f20a385429',
    generation: '1650042135115055',
    contentType: 'application/octet-stream',
    storageClass: 'STANDARD',
    size: '825',
    md5Hash: 'BW6DMzy4jK74aB2FQikGxA==',
    crc32c: '2GXfVA==',
    etag: 'CK/qz/rFlvcCEAM=',
    timeCreated: '2022-04-15T17:02:15.185Z',
    updated: '2022-04-15T17:03:58.177Z',
    timeStorageClassUpdated: '2022-04-15T17:02:15.185Z',
    metadata:
      {
        be789c74f6bc6d9df95b9f1b7ce07b4b8b6392c1a937f3a69e2de1b508d8690d: 'doNotSync',
        lastModifiedBy: '904998e4258c146e4f94e8bd9c4689b1f759ec384199e58067bfe7efbdd79d68'
      }
  }
]

describe('getCurrentApp', () => {
  it('returns undefined if no instances of the app exist', () => {
    expect(getCurrentApp(tools.Galaxy.appType)([])).toBeUndefined()
    expect(getCurrentApp(tools.Cromwell.appType)([galaxyRunning])).toBeUndefined()
  })
  it('returns the most recent app for the given type (that is not deleting)', () => {
    expect(getCurrentApp(tools.Galaxy.appType)(mockApps)).toBe(galaxyRunning)
    expect(getCurrentApp(tools.Cromwell.appType)(mockApps)).toBe(cromwellProvisioning)
  })
})

describe('getCurrentAppIncludingDeleting', () => {
  it('does not filter out deleting', () => {
    expect(getCurrentAppIncludingDeleting(tools.Galaxy.appType)(mockApps)).toBe(galaxyDeleting)
    expect(getCurrentAppIncludingDeleting(tools.Cromwell.appType)(mockApps)).toBe(cromwellProvisioning)
  })
})

describe('getDiskAppType', () => {
  it('returns the appType for disks attached to apps', () => {
    expect(getDiskAppType(galaxyDeletingDisk)).toBe(tools.Galaxy.appType)
    expect(getDiskAppType(cromwellProvisioningDisk)).toBe(tools.Cromwell.appType)
  })
  it('returns undefined for runtime disks', () => {
    expect(getDiskAppType(jupyterDisk)).toBeUndefined()
  })
})

describe('getCurrentRuntime', () => {
  it('returns undefined if no runtimes exist', () => {
    expect(getCurrentRuntime([])).toBeUndefined()
  })
  it('returns a runtime if 1 exists', () => {
    const runtime1 = getGoogleRuntime()
    expect(getCurrentRuntime([runtime1])).toStrictEqual(runtime1)
  })
  it('returns no runtimes if only deleting runtimes exists', () => {
    const runtime1 = getGoogleRuntime({ status: runtimeStatuses.deleting.label })
    const runtime2 = getGoogleRuntime({ status: runtimeStatuses.deleting.label })
    expect(getCurrentRuntime([runtime1, runtime2])).toBeUndefined()
  })
  it('returns the most recent runtime in a list', () => {
    //chronologically, runtime1 is the middle, runtime2 the most recent, and runtime3 the oldest
    //getCurrentRuntime should return the most recent
    const runtime1 = getGoogleRuntime()
    const runtime2WithSameDate = getGoogleRuntime()
    const runtime3WithSameDate = getGoogleRuntime()

    const runtime2 = {
      ...runtime2WithSameDate,
      auditInfo: {
        ...runtime1.auditInfo,
        createdDate: addDays(new Date(runtime1.auditInfo.createdDate), 3).toString()
      }
    }

    const runtime3 = {
      ...runtime3WithSameDate,
      auditInfo: {
        ...runtime1.auditInfo,
        createdDate: subDays(new Date(runtime1.auditInfo.createdDate), 3).toString()
      }
    }

    expect(getCurrentRuntime([runtime1, runtime2, runtime3])).toStrictEqual(runtime2)
  })
})


describe('getCurrentAppDataDisk', () => {
  it('returns undefined if no disk exists for the given app type', () => {
    expect(getCurrentAppDataDisk(tools.Galaxy.appType, [cromwellProvisioning], [cromwellProvisioningDisk])).toBeUndefined()
  })
  it('returns the newest attached disk, even if app is deleting', () => {
    expect(getCurrentAppDataDisk(tools.Galaxy.appType, mockApps, mockAppDisks, 'test-workspace')).toStrictEqual(galaxyDeletingDiskUpdatedPd)
    expect(getCurrentAppDataDisk(tools.Cromwell.appType, mockApps, mockAppDisks, 'test-workspace')).toStrictEqual(cromwellProvisioningDiskUpdatedPd)
  })
  it('returns the newest unattached disk that is not deleting if no app instance exists', () => {
    expect(getCurrentAppDataDisk(tools.Galaxy.appType, [], mockAppDisks, 'test-workspace')).toStrictEqual(galaxyDiskUpdatedPd)
    expect(getCurrentAppDataDisk(tools.Cromwell.appType, [galaxyRunning], mockAppDisks, 'test-workspace')).toStrictEqual(cromwellUnattachedDiskUpdatedPd)
  })
  it('returns a galaxy disk only if it is in the same workspace as the previous app it was attached to', () => {
    expect(getCurrentAppDataDisk(tools.Galaxy.appType, [], mockAppDisks, 'test-workspace')).toStrictEqual(galaxyDiskUpdatedPd)
    expect(getCurrentAppDataDisk(tools.Galaxy.appType, [], mockAppDisks, 'incorrect-workspace')).toBeUndefined()
  })
})

describe('workspaceHasMultipleApps', () => {
  it('returns true when there are multiple galaxy apps in the same project and workspace', () => {
    expect(workspaceHasMultipleApps(mockAppsSameWorkspace, tools.Galaxy.appType)).toBe(true)
  })
  it('returns false when there is not multiple cromwell apps', () => {
    expect(workspaceHasMultipleApps(mockAppsSameWorkspace, tools.Cromwell.appType)).toBe(false)
  })
})

describe('workspaceHasMultipleDisks', () => {
  it('returns true when there are multiple galaxy disks in the same project and workspace', () => {
    expect(workspaceHasMultipleDisks(mockAppDisksSameWorkspace, tools.Galaxy.appType)).toBe(true)
  })
  it('returns false when there is not multiple cromwell disks', () => {
    expect(workspaceHasMultipleDisks(mockAppDisksSameWorkspace, tools.Cromwell.appType)).toBe(false)
  })
})

describe('getDisplayList', () => {
  it('getDisplayList should return a string of the analysis names, comma separated', () => {
    expect(getAnalysesDisplayList(mockBucketAnalyses)).toBe('testA.Rmd, testB.Rmd')
  })
})

describe('getCostDisplayForTool', () => {
  it('will get compute cost and compute status for Galaxy app', () => {
    // Arrange
    const expectedResult = 'Running $0.53/hr'
    const app = galaxyRunning
    const currentRuntime = undefined
    const currentRuntimeTool = undefined
    const toolLabel = tools.Galaxy.label

    // Act
    const result = getCostDisplayForTool(app, currentRuntime, currentRuntimeTool, toolLabel)

    // Assert
    expect(result).toBe(expectedResult)
  })
  it('will get compute cost and compute status for a running Jupyter runtime', () => {
    // Arrange
    const expectedResult = 'Running $0.06/hr'
    const app = undefined
    const currentRuntime = jupyter1
    const currentRuntimeTool = tools.Jupyter.label
    const toolLabel = tools.Jupyter.label

    // Act
    const result = getCostDisplayForTool(app, currentRuntime, currentRuntimeTool, toolLabel)

    // Assert
    expect(result).toBe(expectedResult)
  })
  it('will get compute cost and compute status for a stopped Jupyter runtime', () => {
    // Arrange
    const expectedResult = 'Paused $0.01/hr'
    const app = undefined
    const currentRuntime = { ...jupyter1, status: 'Stopped' }
    const currentRuntimeTool = tools.Jupyter.label
    const toolLabel = tools.Jupyter.label

    // Act
    const result = getCostDisplayForTool(app, currentRuntime, currentRuntimeTool, toolLabel)

    // Assert
    expect(result).toBe(expectedResult)
  })
  it('will return blank because current runtime is not equal to currentRuntimeTool', () => {
    // Arrange
    const expectedResult = ''
    const app = undefined
    const currentRuntime = jupyter1
    const currentRuntimeTool = tools.RStudio.label
    const toolLabel = tools.Jupyter.label

    // Act
    const result = getCostDisplayForTool(app, currentRuntime, currentRuntimeTool, toolLabel)

    // Assert
    expect(result).toBe(expectedResult)
  })
})

describe('getCostDisplayForDisk', () => {
  it('will get the disk cost for a Galaxy AppDataDisk', () => {
    // Arrange
    const app = galaxyRunning
    const appDataDisks = [galaxyDisk]
    const computeRegion = 'US-CENTRAL1'
    const currentRuntimeTool = undefined
    const persistentDisks = []
    const runtimes = []
    const toolLabel = tools.Galaxy.label
    const expectedResult = 'Disk $0.04/hr'

    // Act
    const result = getCostDisplayForDisk(app, appDataDisks, computeRegion, currentRuntimeTool, persistentDisks, runtimes, toolLabel)

    // Assert
    expect(result).toBe(expectedResult)
  })
  it('will get the disk cost for a Jupyter Persistent Disk', () => {
    // Arrange
    const app = undefined
    const appDataDisks = []
    const computeRegion = 'US-CENTRAL1'
    const currentRuntimeTool = tools.Jupyter.label
    const persistentDisks = [jupyter1Disk]
    const runtimes = [jupyter1]
    const toolLabel = tools.Jupyter.label
    const expectedResult = 'Disk < $0.01/hr'

    // Act
    const result = getCostDisplayForDisk(app, appDataDisks, computeRegion, currentRuntimeTool, persistentDisks, runtimes, toolLabel)

    // Assert
    expect(result).toBe(expectedResult)
  })
  it('will return empty string because when there is no app or runtime to get cost information from.', () => {
    // Arrange
    const app = undefined
    const appDataDisks = []
    const computeRegion = 'US-CENTRAL1'
    const currentRuntimeTool = undefined
    const persistentDisks = []
    const runtimes = []
    const toolLabel = ''
    const expectedResult = ''

    // Act
    const result = getCostDisplayForDisk(app, appDataDisks, computeRegion, currentRuntimeTool, persistentDisks, runtimes, toolLabel)

    // Assert
    expect(result).toBe(expectedResult)
  })
  it('will return empty string because toolLabel and currentRuntimeTool are not equal.', () => {
    // Arrange
    const app = undefined
    const appDataDisks = []
    const computeRegion = 'US-CENTRAL1'
    const currentRuntimeTool = tools.Jupyter.label
    const persistentDisks = []
    const runtimes = []
    const toolLabel = tools.RStudio.label
    const expectedResult = ''

    // Act
    const result = getCostDisplayForDisk(app, appDataDisks, computeRegion, currentRuntimeTool, persistentDisks, runtimes, toolLabel)

    // Assert
    expect(result).toBe(expectedResult)
  })
  it('will return blank string because cost is 0 due to deleting disk.', () => {
    // Arrange
    const app = undefined
    const appDataDisks = []
    const computeRegion = 'US-CENTRAL1'
    const currentRuntimeTool = tools.Jupyter.label
    const persistentDisks = [{ ...jupyter1Disk, status: 'Deleting' }]
    const runtimes = [jupyter1]
    const toolLabel = tools.Jupyter.label
    const expectedResult = ''

    // Act
    const result = getCostDisplayForDisk(app, appDataDisks, computeRegion, currentRuntimeTool, persistentDisks, runtimes, toolLabel)

    // Assert
    expect(result).toBe(expectedResult)
  })
})
