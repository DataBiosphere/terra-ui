import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import _ from 'lodash/fp'
import { act } from 'react-dom/test-utils'
import { h } from 'react-hyperscript-helpers'
import { Ajax } from 'src/libs/ajax'
import { azureMachineTypes, defaultAzureMachineType } from 'src/libs/azure-utils'
import { formatUSD } from 'src/libs/utils'
import {
  azureRuntime,
  defaultAzureWorkspace, getDisk,
  imageDocs, testAzureDefaultRegion
} from 'src/pages/workspaces/workspace/analysis/_testData/testData'
import { getAzureComputeCostEstimate, getAzureDiskCostEstimate } from 'src/pages/workspaces/workspace/analysis/utils/cost-utils'
import { runtimeToolLabels, runtimeTools } from 'src/pages/workspaces/workspace/analysis/utils/tool-utils'
import { asMockedFn } from 'src/testing/test-utils'

import { AzureComputeModalBase } from './AzureComputeModal'


jest.mock('src/pages/workspaces/workspace/analysis/utils/cost-utils')

jest.mock('src/libs/ajax')
jest.mock('src/libs/notifications', () => ({
  notify: jest.fn()
}))
const onSuccess = jest.fn()
const defaultModalProps = {
  onSuccess, onDismiss: jest.fn(), onError: jest.fn(),
  currentRuntime: undefined, currentDisk: undefined, tool: runtimeToolLabels.JupyterLab, workspace: defaultAzureWorkspace,
  location: testAzureDefaultRegion
}

const defaultAjaxImpl = {
  Runtimes: {
    runtime: () => ({
      details: jest.fn()
    })
  },
  Buckets: { getObjectPreview: () => Promise.resolve({ json: () => Promise.resolve(imageDocs) }) },
  Disks: {
    disk: () => ({
      details: jest.fn()
    })
  },
  Metrics: {
    captureEvent: () => jest.fn()
  }
}

const verifyEnabled = item => expect(item).not.toHaveAttribute('disabled')

describe('AzureComputeModal', () => {
  beforeAll(() => {
  })

  beforeEach(() => {
    // Arrange
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl
    }))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const getCreateButton = () => screen.getByText('Create')
  it('renders correctly with minimal state', async () => {
    // Arrange

    // Act
    // wrapping component init-time stateful side-effects with act()
    await act(async () => {
      await render(h(AzureComputeModalBase, defaultModalProps))
    })

    // Assert
    verifyEnabled(getCreateButton())
    screen.getByText('Azure Cloud Environment')
  })

  it('sends the proper leo API call in default create case (no runtimes or disks)', async () => {
    // Arrange
    const createFunc = jest.fn()
    const runtimeFunc = jest.fn(() => ({
      create: createFunc,
      details: jest.fn()
    }))
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtimeV2: runtimeFunc
      }
    }))

    // Act
    // wrapping component init-time stateful side-effects with act()
    await act(async () => {
      await render(h(AzureComputeModalBase, defaultModalProps))
      await userEvent.click(getCreateButton())
    })

    // Assert
    const labels = {
      saturnWorkspaceNamespace: defaultModalProps.workspace.workspace.namespace,
      saturnWorkspaceName: defaultModalProps.workspace.workspace.name
    }
    expect(runtimeFunc).toHaveBeenCalledWith(defaultModalProps.workspace.workspace.workspaceId, expect.anything())
    expect(createFunc).toHaveBeenCalledWith(expect.objectContaining({
      labels,
      disk: expect.objectContaining({
        labels,
        name: expect.anything()
      }),
      machineSize: defaultAzureMachineType
    }))

    expect(onSuccess).toHaveBeenCalled()
  })

  it('renders default cost estimate', async () => {
    // Arrange
    const expectedComputeCost = 0.15
    const expectedDiskCost = 0.20

    asMockedFn(getAzureComputeCostEstimate).mockReturnValue(expectedComputeCost)
    asMockedFn(getAzureDiskCostEstimate).mockReturnValue(expectedDiskCost)

    // Act
    // wrapping component init-time stateful side-effects with act()
    await act(async () => {
      await render(h(AzureComputeModalBase, defaultModalProps))
    })

    // Assert
    expect(screen.getAllByText(formatUSD(expectedComputeCost)).length).toBeTruthy() // Currently stopped and running are the same cost.
    expect(screen.getByText(formatUSD(expectedDiskCost)))
  })

  it('renders updated cost estimate after change', async () => {
    // Arrange
    const initialComputeCost = 0.15
    const expectedComputeCost = 0.30
    const expectedDiskCost = 0.20

    asMockedFn(getAzureComputeCostEstimate).mockImplementation(computeConfig => {
      return computeConfig.machineType === defaultAzureMachineType ? initialComputeCost : expectedComputeCost
    })

    asMockedFn(getAzureDiskCostEstimate).mockReturnValue(expectedDiskCost)

    const user = userEvent.setup()

    // Act
    // wrapping component init-time stateful side-effects with act()
    await act(async () => {
      await render(h(AzureComputeModalBase, defaultModalProps))
      expect(screen.getAllByText(formatUSD(initialComputeCost)).length).toBeTruthy() // Verify initial value

      const selectCompute = screen.getByLabelText('Cloud compute profile')
      await user.click(selectCompute)
      const selectOption = await screen.getByText(_.keys(azureMachineTypes)[1], { exact: false })
      await user.click(selectOption)
    })

    // Assert
    expect(screen.getAllByText(formatUSD(expectedComputeCost)).length).toBeTruthy() // Currently stopped and running are the same cost.
    expect(screen.getByText(formatUSD(expectedDiskCost)))
  })

  // click delete environment on an existing [jupyter, rstudio] runtime with disk should bring up confirmation
  it('deletes environment with a confirmation for disk deletion for tool $tool.label', async () => {
    // Arrange
    const disk = getDisk()
    const runtime = azureRuntime
    runtime.runtimeConfig.persistentDiskId = disk.id
    runtime.tool = runtimeTools.Jupyter

    const runtimeFunc = jest.fn(() => ({
      details: () => runtime
    }))
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtimeV2: runtimeFunc
      },
      Disks: {
        disk: () => ({
          details: () => disk
        })
      }
    }))

    // Act
    await act(async () => {
      render(h(AzureComputeModalBase, {
        ...defaultModalProps,
        persistentDisks: [disk],
        runtimes: [runtime]
      }))
      await userEvent.click(screen.getByText('Delete Environment'))
    })

    // Assert
    verifyEnabled(screen.getByText('Delete'))
    const radio1 = screen.getByLabelText('Keep persistent disk, delete application configuration and compute profile')
    expect(radio1).toBeChecked()
    const radio2 = screen.getByLabelText('Delete everything, including persistent disk')
    expect(radio2).not.toBeChecked()
  })
})

