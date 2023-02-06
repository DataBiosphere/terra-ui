import { azureDisk, azureRuntime, galaxyDisk, galaxyRunning, getDisk, getGoogleRuntime, getJupyterRuntimeConfig } from 'src/pages/workspaces/workspace/analysis/_testData/testData'

import { getAzurePricesForRegion, getCostDisplayForDisk, getCostDisplayForTool, getPersistentDiskCostMonthly, getRuntimeCost } from './cost-utils'
import { cloudProviders, pdTypes } from './runtime-utils'
import { toolLabels } from './tool-utils'


describe('getCostDisplayForDisk', () => {
  it('GCP - will get the disk cost for a Galaxy AppDataDisk', () => {
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

  it('GCP - will get the disk cost for a Jupyter Persistent Disk', () => {
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

  it('GCP - will return empty string because when there is no app or runtime to get cost information from.', () => {
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

  it('GCP - will return empty string because toolLabel and currentRuntimeTool are not equal.', () => {
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

  it('GCP - will return blank string because cost is 0 due to deleting disk.', () => {
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

  //  ---- Azure ----
  it('Azure - will get the disk cost display for an Azure disk.', () => {
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
  it('Azure - will get compute cost and compute status for Galaxy app', () => {
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

  it('Azure - will get compute cost and compute status for a running Jupyter runtime', () => {
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

  it('Azure - will get compute cost and compute status for a stopped Jupyter runtime', () => {
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

  it('Azure - will return blank because current runtime is not equal to currentRuntimeTool', () => {
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
  it('Azure - will get runtime cost', () => {
    // Arrange
    const runtime = azureRuntime

    // Act
    const result = getRuntimeCost(runtime)

    // Assert
    expect(result).toBeGreaterThan(0)
  })

  it('Azure - will return 0 if runtime is in error', () => {
    // Arrange
    const runtime = getGoogleRuntime({
      runtimeConfig: getJupyterRuntimeConfig(),
      status: 'Error'
    })

    // Act
    const result = getRuntimeCost(runtime)

    // Assert
    expect(result).toBe(0.0)
  })
})

describe('getCostDisplayForTool', () => {
  it('Azure - will get compute cost and compute status for a running Azure JupyterLab runtime', () => {
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

  it('Azure - will get blank compute cost due to no runtime.', () => {
    // Arrange
    const app = undefined
    const currentRuntime = undefined
    const currentRuntimeTool = toolLabels.JupyterLab
    const toolLabel = toolLabels.JupyterLab

    // Act
    const result = getCostDisplayForTool(app, currentRuntime, currentRuntimeTool, toolLabel)

    // Assert
    expect(result).toBe('')
  })
})

describe('getPersistentDiskCostMonthly', () => {
  it('GCP - Cost estimate', () => {
    // Arrange
    const cloudContext = { cloudProvider: cloudProviders.gcp.label }

    // Act
    const result = getPersistentDiskCostMonthly({ cloudContext, size: 50, diskType: pdTypes.standard }, 'US-CENTRAL1')

    // Assert
    expect(result).not.toBe(NaN) // Seems excessive to check the math, we really just want to see that it calculates a number.
  })

  // TODO: Need disk types for Azure
  it('Azure - Standard disk smallest size cost estimate', () => {
    // Arrange
    const cloudContext = { cloudProvider: cloudProviders.azure.label }

    // Act
    const result = getPersistentDiskCostMonthly({ cloudContext, size: 50, zone: 'eastus' })

    // Assert
    expect(result).toBe(getAzurePricesForRegion('eastus')['S6 LRS'])
  })
})
