import '@testing-library/jest-dom'

import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import _ from 'lodash/fp'
import { act } from 'react-dom/test-utils'
import { h } from 'react-hyperscript-helpers'
import { cloudServices } from 'src/data/machines'
import { Ajax } from 'src/libs/ajax'
import {
  defaultGoogleWorkspace, defaultImage, defaultTestDisk, getDisk,
  getGoogleRuntime, getJupyterRuntimeConfig, hailImage,
  imageDocs, testDefaultLocation
} from 'src/pages/workspaces/workspace/analysis/_testData/testData'
import { ComputeModalBase } from 'src/pages/workspaces/workspace/analysis/modals/ComputeModal'
import { tools } from 'src/pages/workspaces/workspace/analysis/notebook-utils'
import {
  defaultDataprocMachineType, defaultDataprocMasterDiskSize, defaultDataprocWorkerDiskSize,
  defaultGceMachineType, defaultGpuType, defaultNumDataprocPreemptibleWorkers, defaultNumDataprocWorkers, defaultNumGpus, defaultPersistentDiskType,
  runtimeStatuses
} from 'src/pages/workspaces/workspace/analysis/runtime-utils'


jest.mock('src/components/Modal', () => {
  const { div, h } = jest.requireActual('react-hyperscript-helpers')
  const originalModule = jest.requireActual('src/components/Modal')
  return {
    ...originalModule,
    __esModule: true,
    default: props => div({ id: 'modal-root' }, [
      h(originalModule.default, { onAfterOpen: jest.fn(), ...props })
    ])
  }
})

// Mocking PopupTrigger to avoid test environment issues with React Portal's requirement to use
// DOM measure services which are not available in jest environment
jest.mock('src/components/PopupTrigger', () => {
  const originalModule = jest.requireActual('src/components/PopupTrigger')
  return {
    ...originalModule,
    MenuTrigger: jest.fn()
  }
})

jest.mock('src/libs/notifications', () => ({
  notify: (...args) => {
    console.debug('######################### notify')/* eslint-disable-line */
    console.debug({ method: 'notify', args: [...args] })/* eslint-disable-line */
  }
}))

jest.mock('src/libs/ajax')

const onSuccess = jest.fn()
const defaultModalProps = {
  onSuccess, onDismiss: jest.fn(), onError: jest.fn(),
  currentRuntime: undefined, currentDisk: undefined, tool: tools.Jupyter.label, workspace: defaultGoogleWorkspace,
  location: testDefaultLocation
}

jest.mock('react-dom', () => {
  const originalModule = jest.requireActual('react-dom')
  return {
    ...originalModule,
    createPortal: () => <div></div>
  }
})

//TODO: test utils??
const verifyDisabled = item => expect(item).toHaveAttribute('disabled')
const verifyEnabled = item => expect(item).not.toHaveAttribute('disabled')

const defaultAjaxImpl = {
  Runtimes: {
    runtime: () => ({
      details: jest.fn()
    })
  },
  Buckets: { getObjectPreview: () => Promise.resolve(imageDocs) },
  Disks: {
    disk: () => ({
      details: jest.fn()
    })
  },
  Metrics: {
    captureEvent: () => jest.fn()
  }
}

describe('ComputeModal', () => {
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
    await act(async () => await render(h(ComputeModalBase, defaultModalProps)))

    // Assert
    verifyEnabled(getCreateButton())
    const title = screen.getByText('Jupyter Cloud Environment')
    expect(title).toBeInTheDocument()
    expect(screen.getByText('Create custom environment')).toBeInTheDocument()
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
        runtime: runtimeFunc
      }
    }))

    // Act
    await act(async () => {
      await render(h(ComputeModalBase, defaultModalProps))
      await userEvent.click(getCreateButton())
    })

    // Assert
    const labels = {
      saturnWorkspaceNamespace: defaultModalProps.workspace.workspace.namespace,
      saturnWorkspaceName: defaultModalProps.workspace.workspace.name
    }
    expect(runtimeFunc).toHaveBeenCalledWith(defaultModalProps.workspace.workspace.googleProject, expect.anything())
    expect(createFunc).toHaveBeenCalledWith(expect.objectContaining({
      labels,
      runtimeConfig: expect.objectContaining({
        cloudService: cloudServices.GCE,
        machineType: defaultGceMachineType,
        persistentDisk: expect.objectContaining({
          diskType: defaultPersistentDiskType.label,
          labels,
          name: expect.anything()
        })
      }),
      toolDockerImage: defaultImage.image
    }))
    expect(onSuccess).toHaveBeenCalled()
  })

  //create button with disk but no runtime
  it('sends the proper API call in create case with an existing disk but no runtime', async () => {
    // Arrange
    // put value into local var so its easier to refactor
    const disk = defaultTestDisk
    const createFunc = jest.fn()
    const runtimeFunc = jest.fn(() => ({
      create: createFunc,
      details: jest.fn()
    }))
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtime: runtimeFunc
      },
      Disks: {
        disk: () => ({
          details: () => disk
        })
      }
    }))

    // Act
    await act(async () => {
      await render(h(ComputeModalBase, {
        ...defaultModalProps,
        currentDisk: disk
      }))
      await userEvent.click(getCreateButton())
    })

    // Assert
    expect(runtimeFunc).toHaveBeenCalledWith(defaultGoogleWorkspace.workspace.googleProject, expect.anything())
    expect(createFunc).toHaveBeenCalledWith(expect.objectContaining({
      runtimeConfig: expect.objectContaining({
        persistentDisk: { name: disk.name }
      })
    }))
    expect(onSuccess).toHaveBeenCalled()
  })

  // with a [jupyter, rstudio] runtime existing and, details pane is open
  it.each([
    { runtimeTool: tools.Jupyter },
    { runtimeTool: tools.RStudio }
  ])('opens runtime details pane with a $runtimeTool.label runtime and a disk existing', async ({ runtimeTool }) => {
    // Arrange
    const disk = getDisk()
    const machine = { name: 'n1-standard-4', cpu: 4, memory: 15 }
    const runtimeProps = { tool: runtimeTool, runtimeConfig: getJupyterRuntimeConfig({ diskId: disk.id, machineType: machine.name }) }
    const runtime = getGoogleRuntime(runtimeProps)

    const runtimeFunc = jest.fn(() => ({
      create: jest.fn(),
      details: () => runtime
    }))
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtime: runtimeFunc
      },
      Disks: {
        disk: () => ({
          details: () => disk
        })
      }
    }))

    // Act
    await act(async () => {
      await render(h(ComputeModalBase, {
        ...defaultModalProps,
        currentDisk: disk,
        currentRuntime: runtime,
        tool: runtimeTool.label
      }))
    })

    // Assert
    expect(screen.getByText(`${runtimeTool.label} Cloud Environment`)).toBeInTheDocument()

    const toolImage = _.find({ imageType: runtimeTool.label }, runtime.runtimeImages)
    const selectText = _.find({ image: toolImage.imageUrl }, imageDocs).label
    expect(screen.getByText(selectText)).toBeInTheDocument()

    expect(screen.getByText(machine.cpu)).toBeInTheDocument()
    expect(screen.getByText(machine.memory)).toBeInTheDocument()

    verifyDisabled(screen.getByLabelText('Disk Type'))
    verifyDisabled(screen.getByLabelText('Location'))
    expect(screen.getByDisplayValue(disk.size)).toBeInTheDocument()

    verifyEnabled(screen.getByText('Delete Environment'))
    verifyEnabled(screen.getByText('Update'))
  })

  it.each([
    { status: runtimeStatuses.running },
    { status: runtimeStatuses.starting }
  ])('lets the user update a runtime only in an appropriate status ($status.label, $status.canChangeCompute)', async ({ status }) => {
    // Arrange
    const disk = getDisk()
    const runtimeProps = { status: status.leoLabel, runtimeConfig: getJupyterRuntimeConfig({ diskId: disk.id }) }
    const runtime = getGoogleRuntime(runtimeProps)

    const runtimeFunc = jest.fn(() => ({
      details: () => runtime
    }))
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtime: runtimeFunc
      },
      Disks: {
        disk: () => ({
          details: () => disk
        })
      }
    }))

    // Act
    await act(async () => {
      await render(h(ComputeModalBase, {
        ...defaultModalProps,
        currentDisk: disk,
        currentRuntime: runtime
      }))
    })

    // Assert
    if (!!status.canChangeCompute) {
      verifyEnabled(screen.getByText('Update'))
    } else {
      verifyDisabled(screen.getByText('Update'))
    }
  })

  // click delete environment on an existing [jupyter, rstudio] runtime with disk should bring up confirmation
  it.each([
    { tool: tools.Jupyter },
    { tool: tools.RStudio }
  ])('deletes environment with a confirmation for disk deletion for tool $tool.label', async ({ tool }) => {
    // Arrange
    const disk = getDisk()
    const runtimeProps = { runtimeConfig: getJupyterRuntimeConfig({ diskId: disk.id, tool }) }
    const runtime = getGoogleRuntime(runtimeProps)

    const runtimeFunc = jest.fn(() => ({
      details: () => runtime
    }))
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtime: runtimeFunc
      },
      Disks: {
        disk: () => ({
          details: () => disk
        })
      }
    }))

    // Act
    await act(async () => {
      render(h(ComputeModalBase, {
        ...defaultModalProps,
        currentDisk: disk,
        currentRuntime: runtime
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

  // click delete environment on an existing [jupyter, rstudio] runtime with disk should delete
  it.each([
    { tool: tools.Jupyter },
    { tool: tools.RStudio }
  ])('clicking through delete confirmation and then delete should call delete for tool $tool.label', async ({ tool }) => {
    // Arrange
    const disk = getDisk()
    const runtimeProps = { runtimeConfig: getJupyterRuntimeConfig({ diskId: disk.id, tool }) }
    const runtime = getGoogleRuntime(runtimeProps)

    const deleteFunc = jest.fn()

    const runtimeFunc = jest.fn(() => ({
      details: () => runtime,
      delete: deleteFunc
    }))
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtime: runtimeFunc
      },
      Disks: {
        disk: () => ({
          details: () => disk
        })
      }
    }))

    // Act
    await act(async () => {
      render(h(ComputeModalBase, {
        ...defaultModalProps,
        currentDisk: disk,
        currentRuntime: runtime
      }))
      await userEvent.click(screen.getByText('Delete Environment'))
      await userEvent.click(screen.getByText('Delete'))
    })

    // Assert
    expect(runtimeFunc).toHaveBeenCalledWith(defaultModalProps.workspace.workspace.googleProject, expect.anything())
    expect(deleteFunc).toHaveBeenCalled()
  })

  // click update with downtime (and keep pd)
  it.each([
    { tool: tools.Jupyter },
    { tool: tools.RStudio }
  ])('updating a runtime after changing a field that requires downtime should call update for tool $tool.label', async ({ tool }) => {
    // Arrange
    const disk = getDisk()
    const runtimeProps = { runtimeConfig: getJupyterRuntimeConfig({ diskId: disk.id, tool }) }
    const runtime = getGoogleRuntime(runtimeProps)

    const updateFunc = jest.fn()

    const runtimeFunc = jest.fn(() => ({
      details: () => runtime,
      update: updateFunc
    }))
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtime: runtimeFunc
      },
      Disks: {
        disk: () => ({
          details: () => disk
        })
      }
    }))

    // Act
    await act(async () => {
      await render(h(ComputeModalBase, {
        ...defaultModalProps,
        currentDisk: disk,
        currentRuntime: runtime
      }))

      await userEvent.click(screen.getByLabelText('CPUs'))
      const selectOption = await screen.findByText('2')
      await userEvent.click(selectOption)
      const nextButton = await screen.findByText('Next')
      await userEvent.click(nextButton)
    })

    // Assert
    const headerForNextPane = await screen.findByText('Downtime required')
    expect(headerForNextPane).toBeInTheDocument()

    // Act
    await act(async () => {
      const updateButton = await screen.findByText('Update')
      await userEvent.click(updateButton)
    })

    // Assert
    expect(runtimeFunc).toHaveBeenCalledWith(defaultModalProps.workspace.workspace.googleProject, expect.anything())
    expect(updateFunc).toHaveBeenCalledWith(expect.objectContaining({
      runtimeConfig: {
        cloudService: 'GCE',
        machineType: 'n1-standard-2',
        zone: 'us-central1-a'
      }
    }))
  })

  // TODO: this is a bug that this doesn't work... needs moore investigation
  // click update with no downtime (and keep pd)
  // it.each([
  //   { tool: tools.Jupyter },
  //   { tool: tools.RStudio }
  // ])
  // ('Updating a runtime and changing a field that requires no downtime should call update for tool $tool.label', async ({ tool }) => {
  //   const disk = getDisk()
  //   const runtimeProps = { runtimeConfig: getJupyterRuntimeConfig({ diskId: disk.id, tool }) }
  //   const runtime = getGoogleRuntime(runtimeProps)
  //
  //   const updateFunc = jest.fn()
  //
  //   const runtimeFunc = jest.fn(() => ({
  //     details: () => runtime,
  //     update: updateFunc
  //   }))
  //   Ajax.mockImplementation(() => ({
  //     ...defaultAjaxImpl,
  //     Runtimes: {
  //       runtime: runtimeFunc,
  //     },
  //     Disks: {
  //       disk: () => ({
  //         details: () => disk
  //       })
  //     }
  //   }))
  //
  //   // Act
  //   await act(async () => {
  //     await render(h(ComputeModalBase, {
  //       ...defaultModalProps,
  //       currentDisk: disk,
  //       currentRuntime: runtime
  //     }))
  //
  //     const numberInput = await screen.getByDisplayValue(disk.size)
  //     expect(numberInput).toBeInTheDocument()
  //     fireEvent.change(numberInput, { target: { value: 51 } })
  //
  //     const changedNumberInput = await screen.getByDisplayValue(51)
  //     expect(changedNumberInput).toBeInTheDocument()
  //
  //     const updateButton = await screen.findByText('Update')
  //     await userEvent.click(updateButton)
  //   })
  //
  //   expect(runtimeFunc).toHaveBeenCalledWith(defaultModalProps.workspace.workspace.googleProject, expect.anything())
  //   // expect(screen.getByText('51')).toBeInTheDocument()
  //   expect(updateFunc).toHaveBeenCalledWith(expect.objectContaining({
  //     runtimeConfig: expect.objectContaining({
  //       diskSize: 51
  //     })
  //   }))
  // })

  // TODO: this is a bug that this doesn't work... needs more investigation
  // decrease disk size
  // it.each([
  //   { tool: tools.Jupyter },
  //   { tool: tools.RStudio }
  // ])
  // ('Decreasing disk size should prompt user their disk will be deleted for $tool.label', async ({ tool }) => {
  //   const disk = getDisk()
  //   const runtimeProps = { runtimeConfig: getJupyterRuntimeConfig({ diskId: disk.id, tool }) }
  //   const runtime = getGoogleRuntime(runtimeProps)
  //
  //   const createFunc = jest.fn()
  //   const deleteFunc = jest.fn()
  //
  //   const runtimeFunc = jest.fn(() => ({
  //     details: () => runtime,
  //     create: createFunc,
  //     delete: deleteFunc
  //   }))
  //   Ajax.mockImplementation(() => ({
  //     ...defaultAjaxImpl,
  //     Runtimes: {
  //       runtime: runtimeFunc,
  //     },
  //     Disks: {
  //       disk: () => ({
  //         details: () => disk
  //       })
  //     }
  //   }))
  //
  //   // Act
  //   await act(async () => {
  //     await render(h(ComputeModalBase, {
  //       ...defaultModalProps,
  //       currentDisk: disk,
  //       currentRuntime: runtime
  //     }))
  //
  //     const numberInput = await screen.getByDisplayValue(disk.size)
  //     expect(numberInput).toBeInTheDocument()
  //     fireEvent.change(numberInput, { target: { value: disk.size - 1 } })
  //
  //     const changedNumberInput = await screen.getByDisplayValue(disk.size - 1)
  //     expect(changedNumberInput).toBeInTheDocument()
  //
  //     const nextButton = await screen.findByText('Update')
  //     await userEvent.click(nextButton)
  //
  //     const deleteConfirmationPaneHeader = await screen.findByText('Data will be deleted')
  //     expect(deleteConfirmationPaneHeader).toBeInTheDocument()
  //
  //     const updateButton = await screen.findByText('Update')
  //     await userEvent.click(updateButton)
  //   })
  //
  //   expect(runtimeFunc).toHaveBeenCalledWith(defaultModalProps.workspace.workspace.googleProject, runtime.runtimeName)
  //   expect(deleteFunc).toHaveBeenCalled()
  //   expect(createFunc).toHaveBeenCalledWith(expect.objectContaining({
  //     runtimeConfig: expect.objectContaining({
  //       persistentDisk: expect.objectContaining({
  //         size: disk.size - 1
  //       })
  //     })
  //   }))
  // })

  // with a [jupyter, rstudio] runtime existing and [a disk, no disk], details pane is open
  it('dataproc runtime should display properly in modal', async () => {
    // Arrange
    const machine1 = { name: 'n1-standard-2', cpu: 2, memory: 7.50 }
    const machine2 = { name: 'n1-standard-4', cpu: 4, memory: 15 }
    const runtimeProps = {
      image: hailImage.image, status: runtimeStatuses.stopped.leoLabel, runtimeConfig: {
        numberOfWorkers: 2,
        masterMachineType: machine1.name,
        masterDiskSize: 151,
        workerMachineType: machine2.name,
        workerDiskSize: 150,
        numberOfWorkerLocalSSDs: 0,
        numberOfPreemptibleWorkers: 0,
        cloudService: 'DATAPROC',
        region: 'us-central1',
        componentGatewayEnabled: true,
        workerPrivateAccess: false
      }
    }
    const runtime = getGoogleRuntime(runtimeProps)

    const runtimeFunc = jest.fn(() => ({
      create: jest.fn(),
      details: () => runtime
    }))
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtime: runtimeFunc
      },
      Disks: {
        disk: () => ({
          details: jest.fn()
        })
      }
    }))

    // Act
    await act(async () => {
      await render(h(ComputeModalBase, {
        ...defaultModalProps,
        currentRuntime: runtime
      }))
    })

    // Assert
    expect(screen.getByText(`${tools.Jupyter.label} Cloud Environment`)).toBeInTheDocument()

    const selectText = hailImage.label
    expect(screen.getByText(selectText)).toBeInTheDocument()

    expect(screen.getByText(machine1.cpu)).toBeInTheDocument()
    expect(screen.getByText(machine1.memory)).toBeInTheDocument()
    expect(screen.getByText('Spark cluster')).toBeInTheDocument()

    verifyDisabled(screen.getByLabelText('Workers'))
    verifyDisabled(screen.getByLabelText('Location'))

    //TODO: fix bug affecting this, IA-3739
    //master and worker disk sizes, there is a bug currently
    // expect(screen.getByDisplayValue(150)).toBeInTheDocument()
    // expect(screen.getByDisplayValue(151)).toBeInTheDocument()

    expect(screen.getByText(machine2.cpu)).toBeInTheDocument()
    expect(screen.getByText(machine2.memory)).toBeInTheDocument()

    verifyEnabled(screen.getByText('Delete Runtime'))
    //TODO: verify this is disabled once bug is fixed
    expect(screen.getByText('Next')).toBeInTheDocument()
  })

  // spark cluster (pass a dataproc runtime and ensure it loads correctly) (
  it('creates a datapoc runtime', async () => {
    // Arrange
    const createFunc = jest.fn()
    const runtimeFunc = jest.fn(() => ({
      create: createFunc,
      details: jest.fn()
    }))
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtime: runtimeFunc
      },
      Disks: {
        disk: () => ({
          details: jest.fn()
        })
      }
    }))

    // Act
    await act(async () => {
      await render(h(ComputeModalBase, defaultModalProps))

      await userEvent.click(screen.getByText('Customize'))
      const selectMenu = await screen.getByLabelText('Application configuration')
      await userEvent.click(selectMenu)
      const selectOption = await screen.findByText(hailImage.label)
      await userEvent.click(selectOption)
      const computeTypeSelect = await screen.getByLabelText('Compute type')
      await userEvent.click(computeTypeSelect)
      const sparkClusterOption = await screen.findByText('Spark cluster')
      await userEvent.click(sparkClusterOption)

      const create = await screen.getByText('Create')
      await userEvent.click(create)
    })

    expect(runtimeFunc).toHaveBeenCalledWith(defaultModalProps.workspace.workspace.googleProject, expect.anything())
    expect(createFunc).toHaveBeenCalledWith(expect.objectContaining({
      toolDockerImage: hailImage.image,
      runtimeConfig: expect.objectContaining({
        numberOfWorkers: defaultNumDataprocWorkers,
        masterMachineType: defaultDataprocMachineType,
        masterDiskSize: defaultDataprocMasterDiskSize,
        workerMachineType: defaultDataprocMachineType,
        workerDiskSize: defaultDataprocWorkerDiskSize,
        numberOfPreemptibleWorkers: defaultNumDataprocPreemptibleWorkers,
        cloudService: 'DATAPROC',
        region: 'us-central1',
        componentGatewayEnabled: true
      })
    }))
  })

  //custom on image select with a [valid, invalid] custom image should function
  it('custom Environment pane should behave correctly with an invalid image URI', async () => {
    // Arrange
    const createFunc = jest.fn()

    const runtimeFunc = jest.fn(() => ({
      details: jest.fn(),
      create: createFunc
    }))
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtime: runtimeFunc
      },
      Disks: {
        disk: () => ({
          details: jest.fn()
        })
      }
    }))

    // Act and assert
    await act(async () => {
      await render(h(ComputeModalBase, defaultModalProps))

      await userEvent.click(screen.getByText('Customize'))
      const selectMenu = await screen.getByLabelText('Application configuration')
      await userEvent.click(selectMenu)
      const selectOption = await screen.findByText('Custom Environment')
      await userEvent.click(selectOption)

      const imageInput = await screen.getByLabelText('Container image')
      expect(imageInput).toBeInTheDocument()
      const invalidImageUri = 'b'
      await userEvent.type(imageInput, invalidImageUri)

      const nextButton = await screen.findByText('Next')

      verifyDisabled(nextButton)
    })
  })

  //custom on image select with a [valid, invalid] custom image should function
  it('custom Environment pane should work with a valid image URI ', async () => {
    // Arrange
    const createFunc = jest.fn()

    const runtimeFunc = jest.fn(() => ({
      details: jest.fn(),
      create: createFunc
    }))
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtime: runtimeFunc
      },
      Disks: {
        disk: () => ({
          details: jest.fn()
        })
      }
    }))

    // Act and assert
    await act(async () => {
      await render(h(ComputeModalBase, defaultModalProps))

      await userEvent.click(screen.getByText('Customize'))
      const selectMenu = await screen.getByLabelText('Application configuration')
      await userEvent.click(selectMenu)
      const selectOption = await screen.findByText('Custom Environment')
      await userEvent.click(selectOption)

      const imageInput = await screen.getByLabelText('Container image')
      expect(imageInput).toBeInTheDocument()
      const customImageUri = 'us'
      await fireEvent.change(imageInput, { target: { value: customImageUri } })

      const nextButton = await screen.findByText('Next')
      verifyEnabled(nextButton)
      await userEvent.click(nextButton)
      const unverifiedDockerWarningHeader = await screen.findByText('Unverified Docker image')

      expect(unverifiedDockerWarningHeader).toBeInTheDocument()
      const createButton = await screen.findByText('Create')
      await userEvent.click(createButton)
      expect(runtimeFunc).toHaveBeenCalledWith(defaultModalProps.workspace.workspace.googleProject, expect.anything())
      expect(createFunc).toHaveBeenCalledWith(expect.objectContaining({
        toolDockerImage: customImageUri
      }))
    })
  })

  // click learn more about persistent disk
  it('should render learn more about persistent disks', async () => {
    // Act
    await act(async () => {
      await render(h(ComputeModalBase, defaultModalProps))
      const link = screen.getByText('Learn more about Persistent Disks.')
      await userEvent.click(link)
    })

    // Assert
    expect(screen.getByText('About persistent disk')).toBeInTheDocument()
  })

  it('should render whats installed on this environment', async () => {
    // Act
    await act(async () => {
      await render(h(ComputeModalBase, defaultModalProps))
      const link = await screen.getByText('What’s installed on this environment?')
      await userEvent.click(link)
    })

    // Assert
    expect(screen.getByText('Installed packages')).toBeInTheDocument()
    expect(screen.getByText(defaultImage.label)).toBeInTheDocument()
    expect(screen.getByText('Language:')).toBeInTheDocument()
  })

  // GPUs should function properly
  it('creates a runtime with GPUs', async () => {
    // Arrange
    const createFunc = jest.fn()
    const runtimeFunc = jest.fn(() => ({
      create: createFunc,
      details: jest.fn()
    }))
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtime: runtimeFunc
      }
    }))

    // Act
    await act(async () => {
      await render(h(ComputeModalBase, defaultModalProps))
      const link = screen.getByText('Customize')
      await userEvent.click(link)
      const enableGPU = await screen.getByText('Enable GPUs')
      await userEvent.click(enableGPU)
    })

    // Assert
    expect(screen.getByText('GPU type')).toBeInTheDocument()
    expect(screen.getByText('GPUs')).toBeInTheDocument()

    // Act
    await act(async () => {
      const create = screen.getByText('Create')
      await userEvent.click(create)
    })

    // Assert
    expect(createFunc).toHaveBeenCalledWith(expect.objectContaining({
      runtimeConfig: expect.objectContaining({
        gpuConfig: { gpuType: defaultGpuType, numOfGpus: defaultNumGpus }
      })
    }))
  })
})
