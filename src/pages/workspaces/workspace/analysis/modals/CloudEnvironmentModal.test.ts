import '@testing-library/jest-dom'

import {
  act,
  render,
  screen,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { h } from 'react-hyperscript-helpers'
import { Ajax } from 'src/libs/ajax'
import {
  azureDisk,
  defaultAzureWorkspace,
  defaultGoogleWorkspace,
  defaultTestDisk,
  galaxyRunning,
  generateTestApp,
  getGoogleRuntime,
} from 'src/pages/workspaces/workspace/analysis/_testData/testData'
import { CloudEnvironmentModal } from 'src/pages/workspaces/workspace/analysis/modals/CloudEnvironmentModal'
import { tools } from 'src/pages/workspaces/workspace/analysis/utils/tool-utils'
import { asMockedFn } from 'src/testing/test-utils'


const successFn = s => jest.fn(s)
const dismissFn = jest.fn()
const refreshRuntimesFn = jest.fn()
const refreshAppsFn = jest.fn()

type AjaxExports = typeof import('src/libs/ajax')
jest.mock('src/libs/ajax', (): AjaxExports => {
  return {
    ...jest.requireActual('src/libs/ajax'),
    Ajax: jest.fn()
  }
})

type AjaxContract = ReturnType<typeof Ajax>;
type AjaxAppsContract = AjaxContract['Apps']
type AjaxAppsAppContract = ReturnType<AjaxContract['Apps']['app']>
type AjaxRuntimesContract = AjaxContract['Runtimes']
type AjaxRuntimesWrapperContract = ReturnType<AjaxContract['Runtimes']['runtimeWrapper']>


const AzureCloudEnvironmentModalDefaultProps:any = {
  isOpen: true,
  canCompute: true,
  runtimes: [],
  apps: [],
  appDataDisks: [],
  workspace: {
    azureContext: {
      managedResourceGroupId: 'mrg-terra-dev-jan23-20230123125907',
      subscriptionId: '3efc5bdf-be0e-44e7-b1d7-c08931e3c16c',
      tenantId: '0cb7a640-45a2-4ed6-be9f-63519f86e04b'
    },
    workspaceSubmissionStats: {
      runningSubmissionsCount: 0
    },
    accessLevel: 'OWNER',
    owners: ['liz.baldo.dev@gmail.com',
      'broadterraui@gmail.com'],
    workspace: {
      attributes: { description: 'for IA-4028' },
      authorizationDomain: [],
      bucketName: '',
      cloudPlatform: 'Azure',
      createdBy: 'broadterraui@gmail.com',
      createdDate: '2023-02-06T20:35:22.794Z',
      googleProject: '',
      isLocked: false,
      lastModified: '2023-02-06T20:35:22.797Z',
      name: 'jake-test-azure',
      namespace: 'azure-dev-2023-01-23',
      workspaceId: 'b6adedd9-d41f-4f06-a1de-9cb62a12caf2',
      workspaceType: 'mc',
      workspaceVersion: 'v2'
    },
    canShare: true,
    canCompute: true,
    workspaceInitialized: true
  },
  persistentDisks: [],
  location: 'eastus',
  computeRegion: 'eastus',
  workspace2: {
    workspace: {
      namespace: 'azure-dev-2023-01-23',
      name: 'jake-test-azure'
    }
  },
  refreshRuntimes: refreshRuntimesFn,
  refreshApps: refreshAppsFn,
  onSuccess: successFn,
  onDismiss: dismissFn,
}


const CloudEnvironmentModalDefaultProps:any = {
  isOpen: true,
  onSuccess: successFn,
  onDismiss: dismissFn,
  canCompute: true,
  runtimes: [],
  apps: [],
  appDataDisks: [],
  refreshRuntimes: refreshRuntimesFn,
  refreshApps: refreshAppsFn,
  workspace: defaultGoogleWorkspace,
  persistentDisks: [],
  location: 'eastus',
  computeRegion: 'eastus',
  filterForTool: undefined
}

type NavExports = typeof import('src/libs/nav')

jest.mock('src/libs/nav', (): Partial<NavExports> => ({
  getCurrentUrl: jest.fn().mockReturnValue(new URL('https://app.terra.bio')),
  getLink: jest.fn(),
  goToPath: jest.fn(),
}))

describe('CloudEnvironmentModal', () => {
  //vanilla envs
  it('Renders cloud environment modal with minimal details', () => {
    // Arrange
    const cloneCEM = { ...CloudEnvironmentModalDefaultProps }
    // Act
    const vdom = render(h(CloudEnvironmentModal,
      cloneCEM))
    // Assert
    expect(vdom.getByText('Cloud Environment Details'))
    expect(vdom.getByAltText('Jupyter'))
    expect(vdom.getByAltText('RStudio'))
    expect(vdom.getByAltText('GALAXY'))
  })

  it('Renders azure cloud environment modal with minimal details', () => {
    // Arrange
    const cloneAzure = { ...AzureCloudEnvironmentModalDefaultProps }
    // Act
    const vdom = render(h(CloudEnvironmentModal,
      cloneAzure))
    // Assert
    expect(vdom.getByText('Cloud Environment Details'))
    expect(vdom.getByAltText('JupyterLab'))
    expect(vdom.getByAltText('CROMWELL'))
  })
  //populated envs
  it('Renders populated cloud environment', () => {
    // Arrange
    const CloneCEM = {
      ...CloudEnvironmentModalDefaultProps,
      runtimes: [getGoogleRuntime()],
      apps: [generateTestApp({})],
      appDataDisks: [defaultTestDisk]
    }
    // Act
    const vdom = render(h(CloudEnvironmentModal,
      CloneCEM))
    // Assert
    expect(vdom.getByText('Cloud Environment Details'))
    expect(vdom.getByAltText('Jupyter'))
    expect(vdom.getByAltText('RStudio'))
    expect(vdom.getByAltText('GALAXY'))
    // expect(vdom.getAllByText(/Running/).length).toBe(2)
    expect(vdom.getAllByText('Pause').length).toBe(3)
    expect(vdom.getAllByText('Open').length).toBe(3)
    // expect(vdom.getAllByText('Edit existing Environment').length).toBe(2)
    // expect(vdom.getAllByText('Edit existing Environment')[0]).not.toBeVisible()
  })

  it('Renders populated azure cloud environment modal', () => {
    // Arrange
    const cloneAzure = {
      ...AzureCloudEnvironmentModalDefaultProps,
      workspace: defaultAzureWorkspace,
      persistentDisks: [azureDisk]
    }
    // Act
    const vdom = render(h(CloudEnvironmentModal,
      cloneAzure))
    // Assert
    expect(vdom.getByText('Cloud Environment Details'))
    expect(vdom.getByAltText('JupyterLab'))
    expect(vdom.getByAltText('CROMWELL'))
    expect(vdom.getAllByText('Pause').length).toBe(1)
    expect(vdom.getAllByText('Open').length).toBe(2)
    expect(vdom.getAllByText('No Environment found').length).toBe(3)
    expect(vdom.getAllByText('No Environment found')[0]).not.toBeVisible()
  })
  //button tests(pause)
  it.each([
    { //Jupyter
      input: {
        ...CloudEnvironmentModalDefaultProps,
        runtimes: [getGoogleRuntime()],
        apps: [generateTestApp({
          appName: 'app1',
          status: 'RUNNING'
        })],
        appDataDisks: [defaultTestDisk]
      },
      expectedOutput: {
        buttonIndex: 0,
        stopTimes: 1,
        pauseTimes: 0,
      }
    },
    { //RStudio
      input: {
        ...CloudEnvironmentModalDefaultProps,
        runtimes: [getGoogleRuntime({
          tool: tools.RStudio,
        })],
        appDataDisks: [defaultTestDisk]
      },
      expectedOutput: {
        buttonIndex: 1,
        stopTimes: 1,
        pauseTimes: 0,
      }
    },
    { //Galaxy
      input: {
        ...CloudEnvironmentModalDefaultProps,
        runtimes: [getGoogleRuntime()],
        apps: [galaxyRunning],
        appDataDisks: [defaultTestDisk]
      },
      expectedOutput: {
        buttonIndex: 2,
        stopTimes: 0,
        pauseTimes: 1,
      }
    }
  ])('Invokes ajax call for pause button on a populated google cloud environments instance', async ({ input, expectedOutput }) => {
    // Arrange
    const user = userEvent.setup()
    //stop mock
    const stopFn = jest.fn()
    const mockRuntimes: Partial<AjaxRuntimesContract> = {
      runtimeWrapper: jest.fn()
    }

    asMockedFn((mockRuntimes as AjaxRuntimesContract).runtimeWrapper).mockImplementation(() => {
      const mockAppContract: Partial<AjaxRuntimesWrapperContract> = {
        stop: stopFn
      }
      const stopContract = mockAppContract as AjaxRuntimesWrapperContract
      asMockedFn(stopContract.stop)
      return stopContract
    })

    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract)
    //pause mock
    const pauseFn = jest.fn()
    const mockApps: Partial<AjaxAppsContract> = {
      app: jest.fn()
    }

    asMockedFn((mockApps as AjaxAppsContract).app).mockImplementation(() => {
      const mockAppContract: Partial<AjaxAppsAppContract> = {
        pause: pauseFn
      }
      const pauseContract = mockAppContract as AjaxAppsAppContract
      asMockedFn(pauseContract.pause)
      return pauseContract
    })

    const mockAjax: Partial<AjaxContract> = {
      Apps: mockApps as AjaxAppsContract,
      Runtimes: mockRuntimes as AjaxRuntimesContract
    }
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract)

    // Act
    render(h(CloudEnvironmentModal, input))
    // Assert
    const pauseButtons = screen.getAllByText('Pause')
    expect(pauseButtons.length).toBe(3)
    await act(async () => { await user.click(pauseButtons[expectedOutput.buttonIndex]) })
    expect(stopFn).toBeCalledTimes(expectedOutput.stopTimes)
    expect(pauseFn).toBeCalledTimes(expectedOutput.pauseTimes)
  })

  it('Invokes ajax call for pause button on a populated azure cloud environments instance', async () => {
    // Arrange
    const user = userEvent.setup()
    //stop mock
    const stopFn = jest.fn()
    const mockRuntimes: Partial<AjaxRuntimesContract> = {
      runtimeWrapper: jest.fn()
    }

    asMockedFn((mockRuntimes as AjaxRuntimesContract).runtimeWrapper).mockImplementation(() => {
      const mockAppContract: Partial<AjaxRuntimesWrapperContract> = {
        stop: stopFn
      }
      const stopContract = mockAppContract as AjaxRuntimesWrapperContract
      asMockedFn(stopContract.stop)
      return stopContract
    })

    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract)
    //pause mock
    const pauseFn = jest.fn()
    const mockApps: Partial<AjaxAppsContract> = {
      app: jest.fn()
    }

    asMockedFn((mockApps as AjaxAppsContract).app).mockImplementation(() => {
      const mockAppContract: Partial<AjaxAppsAppContract> = {
        pause: pauseFn
      }
      const pauseContract = mockAppContract as AjaxAppsAppContract
      asMockedFn(pauseContract.pause)
      return pauseContract
    })

    const mockAjax: Partial<AjaxContract> = {
      Apps: mockApps as AjaxAppsContract,
      Runtimes: mockRuntimes as AjaxRuntimesContract
    }
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract)

    const cloneAzure = {
      ...AzureCloudEnvironmentModalDefaultProps,
      // workspace: defaultAzureWorkspace,
      // runtime: azureRuntime,
    }

    // Act
    render(h(CloudEnvironmentModal, cloneAzure))
    // Assert
    const pauseButton = screen.getByText('Pause')
    await act(async () => { await user.click(pauseButton) })
    expect(stopFn).toBeCalledTimes(0)
    expect(pauseFn).toBeCalledTimes(0)
  })


  // button tests(launch)
  it.each([
    { //Jupyter
      input: {
        ...CloudEnvironmentModalDefaultProps,
        runtimes: [getGoogleRuntime()],
        apps: [generateTestApp({
          appName: 'app1',
          status: 'RUNNING'
        })],
        appDataDisks: [defaultTestDisk]
      },
      buttonIndex: 0
    },
    { //RStudio
      input: {
        ...CloudEnvironmentModalDefaultProps,
        runtimes: [getGoogleRuntime({
          tool: tools.RStudio,
        })],
        appDataDisks: [defaultTestDisk]
      },
      buttonIndex: 1
    },
    { //Galaxy
      input: {
        ...CloudEnvironmentModalDefaultProps,
        runtimes: [getGoogleRuntime()],
        apps: [galaxyRunning],
        appDataDisks: [defaultTestDisk]
      },
      buttonIndex: 2
    }
  ])('Invokes dismiss call for launch button on a populated google cloud environments instance', async ({ input, buttonIndex }) => {
    // Arrange
    const user = userEvent.setup()

    // Act
    render(h(CloudEnvironmentModal, input))
    // Assert
    const startButtons = screen.getAllByText('Open')
    expect(startButtons.length).toBe(3)
    await act(async () => { await user.click(startButtons[buttonIndex]) })
    expect(dismissFn).toBeCalledTimes(1)
    dismissFn.mockClear()
  })

  it.each([0, 1])('Invokes dismiss call for launch button on a populated azure cloud environments instance', async buttonIndex => {
    // Arrange
    const user = userEvent.setup()

    const cloneAzure = {
      ...AzureCloudEnvironmentModalDefaultProps,
      // workspace: defaultAzureWorkspace,
      // runtime: azureRuntime,
    }

    // Act
    render(h(CloudEnvironmentModal, cloneAzure))
    // Assert
    const startButtons = screen.getAllByText('Open')
    expect(startButtons.length).toBe(2)
    await act(async () => { await user.click(startButtons[buttonIndex]) })
    expect(dismissFn).toBeCalledTimes(1)
    dismissFn.mockClear()
  })

  //button tests(settings)
  it.each([
    { //Jupyter
      input: {
        ...CloudEnvironmentModalDefaultProps,
        runtimes: [getGoogleRuntime()],
        apps: [generateTestApp({
          appName: 'app1',
          status: 'RUNNING'
        })],
        appDataDisks: [defaultTestDisk]
      },
      buttonIndex: 0
    },
    { //RStudio
      input: {
        ...CloudEnvironmentModalDefaultProps,
        runtimes: [getGoogleRuntime({
          tool: tools.RStudio,
        })],
        appDataDisks: [defaultTestDisk]
      },
      buttonIndex: 1
    },
    { //Galaxy
      input: {
        ...CloudEnvironmentModalDefaultProps,
        runtimes: [getGoogleRuntime()],
        apps: [galaxyRunning],
        appDataDisks: [defaultTestDisk]
      },
      buttonIndex: 2
    }
  ])('Invokes ajax call for settings button on a populated google cloud environments instance', async ({ input, buttonIndex }) => {
    // Arrange
    const user = userEvent.setup()

    // Act
    render(h(CloudEnvironmentModal, input))
    // Assert
    const startButtons = screen.getAllByText('Settings')
    expect(startButtons.length).toBe(3)
    await act(async () => { await user.click(startButtons[buttonIndex]) })
    expect(dismissFn).toBeCalledTimes(1)
    dismissFn.mockClear()
  })
})
