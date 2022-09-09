import '@testing-library/jest-dom'

import { fireEvent, render, screen } from '@testing-library/react'
import { div, h } from 'react-hyperscript-helpers'
import { tools } from 'src/components/notebook-utils'
import { MenuTrigger } from 'src/components/PopupTrigger'
import { Ajax } from 'src/libs/ajax'
import { CloudEnvironmentModal } from 'src/pages/workspaces/workspace/analysis/modals/CloudEnvironmentModal'

import { ContextBar } from '../ContextBar'


// Mocking for terminalLaunchLink using Nav.getLink
jest.mock('src/libs/nav', () => {
  const originalModule = jest.requireActual('src/libs/nav')

  return {
    ...originalModule,
    getPath: jest.fn(() => '/test/'),
    getLink: jest.fn(() => '/')
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

jest.mock('src/pages/workspaces/workspace/analysis/modals/CloudEnvironmentModal', () => {
  const originalModule = jest.requireActual('src/pages/workspaces/workspace/analysis/modals/CloudEnvironmentModal')
  return {
    ...originalModule,
    CloudEnvironmentModal: jest.fn()
  }
})

jest.mock('src/libs/ajax')
beforeEach(() => {
  MenuTrigger.mockImplementation(({ content }) => { return div([content]) })
  CloudEnvironmentModal.mockImplementation(({ isOpen, filterForTool, onSuccess, onDismiss, ...props }) => {
    return isOpen ? div([
      'Cloud Environment Details',
      div(filterForTool),
      div({ label: 'Success Button', onClick: () => onSuccess() }, 'SuccessButton'),
      div({ label: 'Success Button', onClick: () => onDismiss() }, 'DismissButton')
    ]) : div([])
  })
  Ajax.mockImplementation(() => {
    return {
      Metrics: {
        captureEvent: () => {}
      },
      Runtimes: {
        runtime: () => {
          return {
            start: jest.fn()
          }
        }
      }
    }
  })
})

//Note - These constants are copied from src/libs/runtime-utils.test.js
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

const rstudioRuntime = {
  id: 76979,
  workspaceId: null,
  runtimeName: 'saturn-48afb74a-15b1-4aad-8b23-d039cf8253fb',
  googleProject: 'terra-dev-98897219',
  cloudContext: {
    cloudProvider: 'GCP',
    cloudResource: 'terra-dev-98897219'
  },
  auditInfo: {
    creator: 'ncl.hedwig@gmail.com',
    createdDate: '2022-09-08T19:46:37.396597Z',
    destroyedDate: null,
    dateAccessed: '2022-09-08T19:47:21.206Z'
  },
  runtimeConfig: {
    machineType: 'n1-standard-4',
    persistentDiskId: 15774,
    cloudService: 'GCE',
    bootDiskSize: 120,
    zone: 'us-central1-a',
    gpuConfig: null
  },
  proxyUrl: 'https://leonardo.dsde-dev.broadinstitute.org/proxy/terra-dev-98897219/saturn-48afb74a-15b1-4aad-8b23-d039cf8253fb/rstudio',
  status: 'Creating',
  labels: {
    saturnWorkspaceNamespace: 'general-dev-billing-account',
    'saturn-iframe-extension': 'https://bvdp-saturn-dev.appspot.com/jupyter-iframe-extension.js',
    creator: 'ncl.hedwig@gmail.com',
    clusterServiceAccount: 'pet-26534176105071279add1@terra-dev-98897219.iam.gserviceaccount.com',
    saturnAutoCreated: 'true',
    clusterName: 'saturn-48afb74a-15b1-4aad-8b23-d039cf8253fb',
    saturnWorkspaceName: 'N8s Space',
    saturnVersion: '6',
    tool: 'RStudio',
    runtimeName: 'saturn-48afb74a-15b1-4aad-8b23-d039cf8253fb',
    cloudContext: 'Gcp/terra-dev-98897219',
    googleProject: 'terra-dev-98897219'
  },
  patchInProgress: false
}

const contextBarProps = {
  runtimes: [],
  apps: [],
  appDataDisks: [],
  refreshRuntimes: () => '',
  location: 'US-CENTRAL1',
  locationType: '',
  refreshApps: () => '',
  workspace: {
    workspace: {
      namespace: 'namespace'
    },
    namespace: 'Broad Test Workspace'
  }
}

describe('ContextBar - buttons', () => {
  it('will render default icons', () => {
    // Act
    render(h(ContextBar, contextBarProps))

    // Assert
    expect(screen.getByText('Rate:'))
    expect(screen.getByLabelText('Environment Configuration'))
    expect(screen.getByLabelText('Terminal button')).toHaveAttribute('disabled')
  })

  it('will render Jupyter button with an enabled Terminal Button', () => {
    // Arrange
    const jupyterContextBarProps = {
      ...contextBarProps,
      runtimes: [jupyter1],
      persistentDisks: [jupyter1Disk]
    }

    // Act
    render(h(ContextBar, jupyterContextBarProps))

    //Assert
    expect(screen.getByText('Rate:'))
    expect(screen.getByLabelText('Environment Configuration'))
    expect(screen.getByLabelText(new RegExp(/Jupyter Environment/i)))
    expect(screen.getByLabelText('Terminal button')).toBeEnabled()
  })

  it('will render a Galaxy and RStudio with a disabled Terminal Button', () => {
    // Arrange
    const rstudioGalaxyContextBarProps = {
      ...contextBarProps,
      runtimes: [rstudioRuntime],
      apps: [galaxyRunning],
      appDataDisks: [galaxyDisk],
      persistentDisks: [jupyter1Disk]
    }

    // Act
    render(h(ContextBar, rstudioGalaxyContextBarProps))

    //Assert
    expect(screen.getByText('Rate:'))
    expect(screen.getByLabelText('Environment Configuration'))
    expect(screen.getByLabelText(new RegExp(/RStudio Environment/i)))
    expect(screen.getByLabelText(new RegExp(/Galaxy Environment/i)))
    expect(screen.getByLabelText('Terminal button')).toHaveAttribute('disabled')
  })
})

describe('ContextBar - actions', () => {
  it('clicking environment configuration opens CloudEnvironmentModal', () => {
    // Act
    render(h(ContextBar, contextBarProps))
    const envConf = screen.getByLabelText('Environment Configuration')
    fireEvent.click(envConf)

    // Assert
    screen.getByText('Cloud Environment Details')
  })
  it('clicking Jupyter opens CloudEnvironmentModal with Jupyter as filter for tool.', () => {
    // Arrange
    const jupyterContextBarProps = {
      ...contextBarProps,
      runtimes: [jupyter1],
      persistentDisks: [jupyter1Disk]
    }

    // Act
    render(h(ContextBar, jupyterContextBarProps))
    fireEvent.click(screen.getByLabelText(new RegExp(/Jupyter Environment/i)))

    // Assert
    screen.getByText('Cloud Environment Details')
    screen.getByText(tools.Jupyter.label)
  })
  it('clicking Galaxy opens CloudEnvironmentModal with Galaxy as filter for tool.', () => {
    // Arrange
    const galaxyContextBarProps = {
      ...contextBarProps,
      apps: [galaxyRunning],
      appDataDisks: [galaxyDisk]
    }

    // Act
    render(h(ContextBar, galaxyContextBarProps))
    fireEvent.click(screen.getByLabelText(new RegExp(/Galaxy Environment/i)))

    // Assert
    screen.getByText('Cloud Environment Details')
    screen.getByText(tools.Galaxy.label)
  })
  it('clicking RStudio opens CloudEnvironmentModal with RStudio as filter for tool.', () => {
    // Act
    const rstudioContextBarProps = {
      ...contextBarProps,
      runtimes: [rstudioRuntime],
      apps: [galaxyRunning],
      appDataDisks: [galaxyDisk],
      persistentDisks: [jupyter1Disk]
    }

    // Act
    render(h(ContextBar, rstudioContextBarProps))
    fireEvent.click(screen.getByLabelText(new RegExp(/RStudio Environment/i)))

    // Assert
    screen.getByText('Cloud Environment Details')
    screen.getByText(tools.RStudio.label)
  })

  it('clicking Terminal attempts to start current runtime', () => {
    // Arrange
    global.window = Object.create(window)
    const url = 'http://dummy.com'
    Object.defineProperty(window, 'location', {
      value: {
        href: url
      },
      writable: true,
      hash: '/'
    })
    const jupyterContextBarProps = {
      ...contextBarProps,
      runtimes: [{
        ...jupyter1,
        status: 'Stopped'
      }],
      persistentDisks: [jupyter1Disk]
    }

    // Act
    render(h(ContextBar, jupyterContextBarProps))
    fireEvent.click(screen.getByLabelText('Terminal button'))

    // Assert
    //TODO: Assert that start is called
    // expect(Ajax().Runtimes.runtime().start).toBeCalled()
  })
  it('onSuccess will close modal', () => {
    // Act
    render(h(ContextBar, contextBarProps))
    const envConf = screen.getByLabelText('Environment Configuration')
    fireEvent.click(envConf)
    screen.getByText('Cloud Environment Details')
    fireEvent.click(screen.getByText('SuccessButton'))

    // Assert
    expect(screen.queryByText('Cloud Environment Details')).toBeFalsy()
  })

  it('onDismiss will close modal', () => {
    // Act
    render(h(ContextBar, contextBarProps))
    const envConf = screen.getByLabelText('Environment Configuration')
    fireEvent.click(envConf)
    screen.getByText('Cloud Environment Details')
    fireEvent.click(screen.getByText('DismissButton'))

    // Assert
    expect(screen.queryByText('Cloud Environment Details')).toBeFalsy()
  })
})
