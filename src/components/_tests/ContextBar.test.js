// import { render, screen } from '@testing-library/react'

// import { ContextBar } from '../ContextBar'

// //Note - These constants are copied from src/libs/runtime-utils.test.js
// const galaxyRunning = {
//   appName: 'terra-app-69200c2f-89c3-47db-874c-b770d8de737f',
//   appType: 'GALAXY',
//   auditInfo: {
//     creator: 'cahrens@gmail.com', createdDate: '2021-11-29T20:19:13.162484Z', destroyedDate: null, dateAccessed: '2021-11-29T20:19:13.162484Z'
//   },
//   diskName: 'saturn-pd-026594ac-d829-423d-a8df-76fe96f5b4e7',
//   errors: [],
//   googleProject: 'terra-test-e4000484',
//   kubernetesRuntimeConfig: { numNodes: 1, machineType: 'n1-highmem-8', autoscalingEnabled: false },
//   labels: {},
//   proxyUrls: { galaxy: 'https://leonardo-fiab.dsde-dev.broadinstitute.org/a-app-69200c2f-89c3-47db-874c-b770d8de737f/galaxy' },
//   status: 'RUNNING'
// }

// const galaxyDisk = {
//   auditInfo: {
//     creator: 'cahrens@gmail.com', createdDate: '2021-11-29T20:19:13.162484Z', destroyedDate: null, dateAccessed: '2021-11-29T20:19:14.114Z'
//   },
//   blockSize: 4096,
//   diskType: 'pd-standard',
//   googleProject: 'terra-test-e4000484',
//   id: 10,
//   labels: { saturnApplication: 'galaxy', saturnWorkspaceName: 'test-workspace' }, // Note 'galaxy' vs. 'GALAXY', to represent our older naming scheme
//   name: 'saturn-pd-026594ac-d829-423d-a8df-76fe96f5b4e7',
//   size: 500,
//   status: 'Ready',
//   zone: 'us-central1-a'
// }

// const jupyter1 = {
//   id: 75239,
//   workspaceId: null,
//   runtimeName: 'saturn-eae9168f-9b99-4910-945e-dbab66e04d91',
//   googleProject: 'terra-dev-cf677740',
//   cloudContext: {
//     cloudProvider: 'GCP',
//     cloudResource: 'terra-dev-cf677740'
//   },
//   auditInfo: {
//     creator: 'testuser123@broad.com',
//     createdDate: '2022-07-18T18:35:32.012698Z',
//     destroyedDate: null,
//     dateAccessed: '2022-07-18T21:44:17.565Z'
//   },
//   runtimeConfig: {
//     machineType: 'n1-standard-1',
//     persistentDiskId: 14692,
//     cloudService: 'GCE',
//     bootDiskSize: 120,
//     zone: 'us-central1-a',
//     gpuConfig: null
//   },
//   proxyUrl: 'https://leonardo.dsde-dev.broadinstitute.org/proxy/terra-dev-cf677740/saturn-eae9168f-9b99-4910-945e-dbab66e04d91/jupyter',
//   status: 'Running',
//   labels: {
//     saturnWorkspaceNamespace: 'general-dev-billing-account',
//     'saturn-iframe-extension': 'https://bvdp-saturn-dev.appspot.com/jupyter-iframe-extension.js',
//     creator: 'testuser123@broad.com',
//     clusterServiceAccount: 'pet-26534176105071279add1@terra-dev-cf677740.iam.gserviceaccount.com',
//     saturnAutoCreated: 'true',
//     clusterName: 'saturn-eae9168f-9b99-4910-945e-dbab66e04d91',
//     saturnWorkspaceName: 'Broad Test Workspace',
//     saturnVersion: '6',
//     tool: 'Jupyter',
//     runtimeName: 'saturn-eae9168f-9b99-4910-945e-dbab66e04d91',
//     cloudContext: 'Gcp/terra-dev-cf677740',
//     googleProject: 'terra-dev-cf677740'
//   },
//   patchInProgress: false
// }

// const jupyter1Disk = {
//   id: 14692,
//   googleProject: 'terra-dev-cf677740',
//   cloudContext: {
//     cloudProvider: 'GCP',
//     cloudResource: 'terra-dev-cf677740'
//   },
//   zone: 'us-central1-a',
//   name: 'saturn-pd-c4aea6ef-5618-47d3-b674-5d456c9dcf4f',
//   status: 'Ready',
//   auditInfo: {
//     creator: 'testuser123@broad.com',
//     createdDate: '2022-07-18T18:35:32.012698Z',
//     destroyedDate: null,
//     dateAccessed: '2022-07-18T20:34:56.092Z'
//   },
//   size: 50,
//   diskType: {
//     label: 'pd-standard',
//     displayName: 'Standard',
//     regionToPricesName: 'monthlyStandardDiskPrice'
//   },
//   blockSize: 4096,
//   labels: {
//     saturnWorkspaceNamespace: 'general-dev-billing-account',
//     saturnWorkspaceName: 'Broad Test Workspace'
//   }
// }

// describe('getTotalToolAndDiskCostDisplay', () => {
//   it('will get the total cost of all tools in the workspace.', () => {
//     //Arrange
//     const runtimes
//     const apps appDataDisks, refreshRuntimes, location, locationType, refreshApps,
//     workspace, persistentDisks, workspace: { workspace: { namespace, name: workspaceName }
//     render(<ContextBar

//     />)
//     //Act

//     //Assert
//   })
// })
