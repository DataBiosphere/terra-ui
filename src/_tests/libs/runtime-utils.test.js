import { tools } from 'src/components/notebook-utils'
import { getCurrentApp, getCurrentAppIncludingDeleting, getCurrentPersistentDisk } from 'src/libs/runtime-utils'


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

// Newer than cromwellRunning.
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

const galaxyDisk = {
  appType: 'GALAXY',
  auditInfo: {
    creator: 'cahrens@gmail.com', createdDate: '2021-11-29T20:19:13.162484Z', destroyedDate: null, dateAccessed: '2021-11-29T20:19:14.114Z'
  },
  blockSize: 4096,
  diskType: 'pd-standard',
  googleProject: 'terra-test-e4000484',
  id: 10,
  labels: {},
  name: 'saturn-pd-026594ac-d829-423d-a8df-76fe96f5b4e7',
  size: 500,
  status: 'Ready',
  zone: 'us-central1-a'
}

// Newer than galaxyDisk, attached to galaxyDeleting app.
const galaxyDeletingDisk = {
  appType: 'GALAXY',
  auditInfo: {
    creator: 'cahrens@gmail.com', createdDate: '2021-11-30T20:19:13.162484Z', destroyedDate: null, dateAccessed: '2021-11-30T20:19:14.114Z'
  },
  blockSize: 4096,
  diskType: 'pd-standard',
  googleProject: 'terra-test-e4000484',
  id: 10,
  labels: {},
  name: 'saturn-pd-1236594ac-d829-423d-a8df-76fe96f5897',
  size: 500,
  status: 'Deleting',
  zone: 'us-central1-a'
}

const cromwellUnattachedDisk = {
  appType: 'CROMWELL',
  auditInfo: {
    creator: 'cahrens@gmail.com', createdDate: '2021-11-30T02:21:00.705505Z', destroyedDate: null, dateAccessed: '2021-11-30T02:21:00.705505Z'
  },
  blockSize: 4096,
  diskType: 'pd-standard',
  googleProject: 'terra-test-e4000484',
  id: 12,
  labels: {},
  name: 'saturn-pd-7fc0c398-63fe-4441-aea5-1e794c961310',
  size: 500,
  status: 'Ready',
  zone: 'us-central1-a'
}

// Older than cromwellUnattachedDisk, attached to cromwellProvisioning app.
const cromwellProvisioningDisk = {
  appType: 'CROMWELL',
  auditInfo: {
    creator: 'cahrens@gmail.com', createdDate: '2021-11-29T20:28:01.998494Z', destroyedDate: null, dateAccessed: '2021-11-29T20:28:03.109Z'
  },
  blockSize: 4096,
  diskType: 'pd-standard',
  googleProject: 'terra-test-e4000484',
  id: 11,
  labels: {},
  name: 'saturn-pd-693a9707-634d-4134-bb3a-cbb73cd5a8ce',
  size: 500,
  status: 'Ready',
  zone: 'us-central1-a'
}

const mockAppDisks = [galaxyDisk, galaxyDeletingDisk, cromwellProvisioningDisk, cromwellUnattachedDisk]

describe('getCurrentApp', () => {
  it('returns undefined if no instances of the app exist', () => {
    expect(getCurrentApp(tools.galaxy.appType)([])).toBeUndefined()
    expect(getCurrentApp(tools.cromwell.appType)([galaxyRunning])).toBeUndefined()
  })
  it('returns the most recent app for the given type (that is not deleting)', () => {
    expect(getCurrentApp(tools.galaxy.appType)(mockApps)).toBe(galaxyRunning)
    expect(getCurrentApp(tools.cromwell.appType)(mockApps)).toBe(cromwellProvisioning)
  })
})

describe('getCurrentAppIncludingDeleting', () => {
  it('does not filter out deleting', () => {
    expect(getCurrentAppIncludingDeleting(tools.galaxy.appType)(mockApps)).toBe(galaxyDeleting)
    expect(getCurrentAppIncludingDeleting(tools.cromwell.appType)(mockApps)).toBe(cromwellProvisioning)
  })
})

describe('getCurrentPersistentDisk', () => {
  it('returns the newest attached disk, even if app is deleting', () => {
    expect(getCurrentPersistentDisk(tools.galaxy.appType, mockApps, mockAppDisks)).toBe(galaxyDeletingDisk)
    expect(getCurrentPersistentDisk(tools.cromwell.appType, mockApps, mockAppDisks)).toBe(cromwellProvisioningDisk)
  })
  it('returns the newest unattached disk that is not deleting if no app instance exists', () => {
    expect(getCurrentPersistentDisk(tools.galaxy.appType, [], mockAppDisks)).toBe(galaxyDisk)
    expect(getCurrentPersistentDisk(tools.cromwell.appType, [galaxyRunning], mockAppDisks)).toBe(cromwellUnattachedDisk)
  })
})
