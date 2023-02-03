import { galaxyDisk, galaxyRunning, getDisk, getGoogleRuntime, getJupyterRuntimeConfig } from 'src/pages/workspaces/workspace/analysis/_testData/testData'

import { getAzurePricesForRegion, getCostDisplayForDisk, getCostDisplayForTool, getPersistentDiskCostMonthly, getRuntimeCost } from './cost-utils'
import { cloudProviders, pdTypes } from './runtime-utils'
import { toolLabels } from './tool-utils'


const azureDisk = {
  id: 16902,
  cloudContext: {
    cloudProvider: 'AZURE',
    cloudResource: 'testCloudResource'
  },
  zone: 'eastus',
  name: 'testAzurePD',
  status: 'Ready',
  auditInfo: {
    creator: 'test.user@gmail.com',
    createdDate: '2023-02-01T20:40:50.428281Z',
    destroyedDate: null,
    dateAccessed: '2023-02-01T20:41:00.357Z'
  },
  size: 50,
  diskType: 'pd-standard', //TODO: This should be stored in backend as STANDARD_LRS
  blockSize: 4096,
  labels: {
    saturnWorkspaceNamespace: 'azure-dev-2023-01-23',
    saturnWorkspaceName: 'N8AzureWS-2-1-2'
  }
}

const azureRuntime = {
  id: 79771,
  workspaceId: 'fafbb550-62eb-4135-8b82-3ce4d53446af',
  runtimeName: 'saturn-42a4398b-10f8-4626-9025-7abda26aedab',
  googleProject: '0cb7a640-45a2-4ed6-be9f-63519f86e04b/3efc5bdf-be0e-44e7-b1d7-c08931e3c16c/mrg-terra-dev-jan23-20230123125907',
  cloudContext: {
    cloudProvider: 'AZURE',
    cloudResource: '0cb7a640-45a2-4ed6-be9f-63519f86e04b/3efc5bdf-be0e-44e7-b1d7-c08931e3c16c/mrg-terra-dev-jan23-20230123125907'
  },
  auditInfo: {
    creator: 'ncl.hedwig@gmail.com',
    createdDate: '2023-02-01T20:40:50.428281Z',
    destroyedDate: null,
    dateAccessed: '2023-02-01T20:41:00.357Z'
  },
  runtimeConfig: {
    cloudService: 'AZURE_VM',
    machineType: 'Standard_DS2_v2',
    persistentDiskId: 16902,
    region: 'eastus'
  },
  proxyUrl: 'https://lzf07312d05014dcfc2a6d8244c0f9b166a3801f44ec2b003d.servicebus.windows.net/saturn-42a4398b-10f8-4626-9025-7abda26aedab',
  status: 'Running',
  labels: {
    saturnWorkspaceNamespace: 'azure-dev-2023-01-23',
    creator: 'ncl.hedwig@gmail.com',
    clusterServiceAccount: 'ncl.hedwig@gmail.com',
    saturnAutoCreated: 'true',
    clusterName: 'saturn-42a4398b-10f8-4626-9025-7abda26aedab',
    saturnWorkspaceName: 'N8AzureWS-2-1-2',
    saturnVersion: '6',
    tool: 'JupyterLab',
    runtimeName: 'saturn-42a4398b-10f8-4626-9025-7abda26aedab',
    cloudContext: 'Azure/0cb7a640-45a2-4ed6-be9f-63519f86e04b/3efc5bdf-be0e-44e7-b1d7-c08931e3c16c/mrg-terra-dev-jan23-20230123125907'
  },
  patchInProgress: false
}

describe('GCP getCostDisplayForDisk', () => {
  it('will get the disk cost for a Galaxy AppDataDisk', () => {
    // Arrange
    const app = galaxyRunning
    const appDataDisks = [galaxyDisk]
    const computeRegion = 'US-CENTRAL1'
    const currentRuntimeTool = undefined
    const persistentDisks = []
    const runtimes = []
    const toolLabel = toolLabels.Galaxy
    const expectedResult = 'Disk $0.04/hr'

    // Act
    const result = getCostDisplayForDisk(app, appDataDisks, computeRegion, currentRuntimeTool, persistentDisks, runtimes, toolLabel)

    // Assert
    expect(result).toBe(expectedResult)
  })
  it('will get the disk cost for a Jupyter Persistent Disk', () => {
    // Arrange
    const jupyterDisk = getDisk()
    const jupyterRuntime = getGoogleRuntime({
      runtimeConfig: getJupyterRuntimeConfig({ diskId: jupyterDisk.id })
    })
    const app = undefined
    const appDataDisks = []
    const computeRegion = 'US-CENTRAL1'
    const currentRuntimeTool = toolLabels.Jupyter
    const persistentDisks = [jupyterDisk]
    const runtimes = [jupyterRuntime]
    const toolLabel = toolLabels.Jupyter
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
    const currentRuntimeTool = toolLabels.Jupyter
    const persistentDisks = []
    const runtimes = []
    const toolLabel = toolLabels.RStudio
    const expectedResult = ''

    // Act
    const result = getCostDisplayForDisk(app, appDataDisks, computeRegion, currentRuntimeTool, persistentDisks, runtimes, toolLabel)

    // Assert
    expect(result).toBe(expectedResult)
  })
  it('will return blank string because cost is 0 due to deleting disk.', () => {
    // Arrange
    const jupyterDisk = getDisk()
    const jupyterRuntime = getGoogleRuntime({
      runtimeConfig: getJupyterRuntimeConfig({ diskId: jupyterDisk.id })
    })
    const app = undefined
    const appDataDisks = []
    const computeRegion = 'US-CENTRAL1'
    const currentRuntimeTool = toolLabels.Jupyter
    const persistentDisks = [{ ...jupyterDisk, status: 'Deleting' }]
    const runtimes = [jupyterRuntime]
    const toolLabel = toolLabels.Jupyter
    const expectedResult = ''

    // Act
    const result = getCostDisplayForDisk(app, appDataDisks, computeRegion, currentRuntimeTool, persistentDisks, runtimes, toolLabel)

    // Assert
    expect(result).toBe(expectedResult)
  })
})

describe('Azure getCostDisplayForDisk', () => {
  it('will get the disk cost display for an Azure disk.', () => {
    // Arrange
    const app = undefined
    const appDataDisks = []
    const computeRegion = 'eastus'
    const currentRuntimeTool = toolLabels.JupyterLab
    const persistentDisks = [azureDisk]
    const runtimes = [azureRuntime]
    const toolLabel = toolLabels.Jupyter
    const expectedResult = 'Disk < $0.01/hr'

    // Act
    const result = getCostDisplayForDisk(app, appDataDisks, computeRegion, currentRuntimeTool, persistentDisks, runtimes, toolLabel)
    // Act
    getCostDisplayForDisk(azureRuntime)
    // Assert

    expect(result).toBe(expectedResult)
  })
})


describe('GCP getCostDisplayForTool', () => {
  it('will get compute cost and compute status for Galaxy app', () => {
    // Arrange
    const expectedResult = 'Running $0.53/hr'
    const app = galaxyRunning
    const currentRuntime = undefined
    const currentRuntimeTool = undefined
    const toolLabel = toolLabels.Galaxy

    // Act
    const result = getCostDisplayForTool(app, currentRuntime, currentRuntimeTool, toolLabel)

    // Assert
    expect(result).toBe(expectedResult)
  })
  it('will get compute cost and compute status for a running Jupyter runtime', () => {
    // Arrange
    const expectedResult = 'Running $0.06/hr'
    const app = undefined
    const currentRuntime = getGoogleRuntime({
      runtimeConfig: getJupyterRuntimeConfig()
    })
    const currentRuntimeTool = toolLabels.Jupyter
    const toolLabel = toolLabels.Jupyter

    // Act
    const result = getCostDisplayForTool(app, currentRuntime, currentRuntimeTool, toolLabel)

    // Assert
    expect(result).toBe(expectedResult)
  })
  it('will get compute cost and compute status for a stopped Jupyter runtime', () => {
    // Arrange
    const expectedResult = 'Paused $0.01/hr'
    const app = undefined
    const jupyterRuntime = getGoogleRuntime({
      runtimeConfig: getJupyterRuntimeConfig()
    })
    const currentRuntime = { ...jupyterRuntime, status: 'Stopped' }
    const currentRuntimeTool = toolLabels.Jupyter
    const toolLabel = toolLabels.Jupyter

    // Act
    const result = getCostDisplayForTool(app, currentRuntime, currentRuntimeTool, toolLabel)

    // Assert
    expect(result).toBe(expectedResult)
  })
  it('will return blank because current runtime is not equal to currentRuntimeTool', () => {
    // Arrange
    const expectedResult = ''
    const app = undefined
    const currentRuntime = getGoogleRuntime({
      runtimeConfig: getJupyterRuntimeConfig()
    })
    const currentRuntimeTool = toolLabels.RStudio
    const toolLabel = toolLabels.Jupyter

    // Act
    const result = getCostDisplayForTool(app, currentRuntime, currentRuntimeTool, toolLabel)

    // Assert
    expect(result).toBe(expectedResult)
  })
})

describe('getRuntimeCost', () => {
  it('will get azure runtime cost', () => {
    // Act
    const result = getRuntimeCost(azureRuntime)

    // Assert
    expect(result).toBeGreaterThan(0)
  })
  it('will return 0 if runtime is in error', () => {
    // Arrange
    // Act
    const result = getRuntimeCost(
      getGoogleRuntime({
        runtimeConfig: getJupyterRuntimeConfig(),
        status: 'Error'
      })
    )
    // Assert
    expect(result).toBe(0.0)
  })
})

describe('Azure getCostDisplayForTool', () => {
  it('will get compute cost and compute status for a running Azure JupyterLab runtime', () => {
    // Arrange
    const app = undefined
    const currentRuntime = azureRuntime
    const currentRuntimeTool = toolLabels.JupyterLab
    const toolLabel = toolLabels.JupyterLab

    // Act
    const result = getCostDisplayForTool(app, currentRuntime, currentRuntimeTool, toolLabel)

    // Assert
    expect(result).toContain('Running') // Costs may change, but we want to make sure the status prints correctly.
  })
  it('will get blank compute cost due to no runtime.', () => {
    // Arrange
    const app = undefined
    const currentRuntime = undefined
    const currentRuntimeTool = toolLabels.JupyterLab
    const toolLabel = toolLabels.JupyterLab

    // Act
    const result = getCostDisplayForTool(app, currentRuntime, currentRuntimeTool, toolLabel)

    // Assert
    expect(result).toBe('') // Costs may change, but we want to make sure the status prints correctly.
  })
})

describe('getPersistentDiskCostMonthly', () => {
  // TODO: Need disk types for Azure
  it('Azure Standard disk smallest size cost estimate', () => {
    // Arrange
    const cloudContext = { cloudProvider: cloudProviders.azure.label }

    // Act
    const result = getPersistentDiskCostMonthly({ cloudContext, size: 50, zone: 'eastus' })

    // Assert
    expect(result).toBe(getAzurePricesForRegion('eastus')['S6 LRS'])
  })

  it('GCP Cost estimate', () => {
    // Arrange
    const cloudContext = { cloudProvider: cloudProviders.gcp.label }

    // Act
    const result = getPersistentDiskCostMonthly({ cloudContext, size: 50, diskType: pdTypes.standard }, 'US-CENTRAL1')

    // Assert
    expect(result).not.toBe(NaN) // Seems excessive to check the math, we really just want to see that it calculates a number.
  })
})
