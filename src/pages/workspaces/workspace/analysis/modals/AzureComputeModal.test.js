import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react-dom/test-utils'
import { h } from 'react-hyperscript-helpers'
import { Ajax } from 'src/libs/ajax'
import { defaultAzureMachineType } from 'src/libs/azure-utils'
import {
  defaultAzureWorkspace, imageDocs, testAzureDefaultLocation
} from 'src/pages/workspaces/workspace/analysis/_testData/testData'
import { getAzureComputeCostEstimate, getAzureDiskCostEstimate } from 'src/pages/workspaces/workspace/analysis/cost-utils'
import { toolLabels } from 'src/pages/workspaces/workspace/analysis/tool-utils'
import { asMockedFn } from 'src/testing/test-utils'

import { AzureComputeModalBase } from './AzureComputeModal'


jest.mock('src/pages/workspaces/workspace/analysis/cost-utils', () => ({
  ...jest.requireActual('src/pages/workspaces/workspace/analysis/cost-utils'),
  getAzureComputeCostEstimate: jest.fn(),
  getAzureDiskCostEstimate: jest.fn()
}))

jest.mock('src/libs/ajax')
jest.mock('src/libs/notifications', () => ({
  notify: jest.fn()
}))
const onSuccess = jest.fn()
const defaultModalProps = {
  onSuccess, onDismiss: jest.fn(), onError: jest.fn(),
  currentRuntime: undefined, currentDisk: undefined, tool: toolLabels.JupyterLab, workspace: defaultAzureWorkspace,
  location: testAzureDefaultLocation
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
    await act(async () => await render(h(AzureComputeModalBase, defaultModalProps)))

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
    const createFunc = jest.fn()
    const runtimeFunc = jest.fn(() => ({
      create: createFunc,
      details: jest.fn()
    }))

    asMockedFn(getAzureComputeCostEstimate).mockReturnValue(0.15)
    asMockedFn(getAzureDiskCostEstimate).mockReturnValue(0.20)
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtimeV2: runtimeFunc
      }
    }))

    // Act
    await act(async () => {
      await render(h(AzureComputeModalBase, defaultModalProps))
    })

    // Assert
    expect(screen.getAllByText('$0.15')) // Currently stopped and running are the same cost.
    expect(screen.getByText('$0.20'))
  })

  it('renders default cost estimate', async () => {
    // Arrange
    const createFunc = jest.fn()
    const runtimeFunc = jest.fn(() => ({
      create: createFunc,
      details: jest.fn()
    }))

    asMockedFn(getAzureComputeCostEstimate).mockReturnValue(0.15)
    asMockedFn(getAzureDiskCostEstimate).mockReturnValue(0.20)
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtimeV2: runtimeFunc
      }
    }))

    // Act
    await act(async () => {
      await render(h(AzureComputeModalBase, defaultModalProps))
    })

    // Assert
    expect(screen.getAllByText('$0.15')) // Currently stopped and running are the same cost.
    expect(screen.getByText('$0.20'))
  })
})

