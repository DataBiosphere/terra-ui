import { fireEvent, render } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { div, h } from 'react-hyperscript-helpers';
import { MenuTrigger } from 'src/components/PopupTrigger';
import { Ajax } from 'src/libs/ajax';
import { defaultAzureMachineType, defaultAzureRegion } from 'src/libs/azure-utils';
import { getConfig } from 'src/libs/config';
import * as Utils from 'src/libs/utils';
import { ContextBar } from 'src/pages/workspaces/workspace/analysis/ContextBar';
import { CloudEnvironmentModal } from 'src/pages/workspaces/workspace/analysis/modals/CloudEnvironmentModal';
import {
  getGalaxyComputeCost,
  getGalaxyDiskCost,
  getPersistentDiskCostHourly,
  getRuntimeCost,
  runtimeConfigCost,
} from 'src/pages/workspaces/workspace/analysis/utils/cost-utils';
import { appToolLabels, runtimeToolLabels } from 'src/pages/workspaces/workspace/analysis/utils/tool-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const GALAXY_COMPUTE_COST = 10;
const GALAXY_DISK_COST = 1;
const RUNTIME_COST = 0.1;
const PERSISTENT_DISK_COST = 0.01;

vi.mock('src/pages/workspaces/workspace/analysis/utils/cost-utils', () => ({
  ...vi.importActual('src/pages/workspaces/workspace/analysis/utils/cost-utils'),
  getGalaxyComputeCost: vi.fn(),
  getGalaxyDiskCost: vi.fn(),
  getPersistentDiskCostHourly: vi.fn(),
  getRuntimeCost: vi.fn(),
  runtimeConfigCost: vi.fn(),
}));

// Mocking for terminalLaunchLink using Nav.getLink
vi.mock('src/libs/nav', () => ({
  ...vi.importActual('src/libs/nav'),
  getPath: vi.fn(() => '/test/'),
  getLink: vi.fn(() => '/'),
}));

// Mocking PopupTrigger to avoid test environment issues with React Portal's requirement to use
// DOM measure services which are not available in jest environment
vi.mock('src/components/PopupTrigger', () => ({
  ...vi.importActual('src/components/PopupTrigger'),
  MenuTrigger: vi.fn(),
}));

vi.mock('src/pages/workspaces/workspace/analysis/modals/CloudEnvironmentModal', () => ({
  ...vi.importActual('src/pages/workspaces/workspace/analysis/modals/CloudEnvironmentModal'),
  CloudEnvironmentModal: vi.fn(),
}));

vi.mock('src/libs/config', () => ({
  ...vi.importActual('src/libs/config'),
  getConfig: vi.fn().mockReturnValue({}),
  isCromwellAppVisible: () => {
    return true;
  },
}));

vi.mock('src/libs/ajax');

beforeEach(() => {
  MenuTrigger.mockImplementation(({ content }) => {
    return div([content]);
  });
  CloudEnvironmentModal.mockImplementation(({ isOpen, filterForTool, onSuccess, onDismiss, ...props }) => {
    return isOpen
      ? div([
          'Cloud Environment Details',
          div(filterForTool),
          div({ label: 'Success Button', onClick: () => onSuccess() }, 'SuccessButton'),
          div({ label: 'Success Button', onClick: () => onDismiss() }, 'DismissButton'),
        ])
      : div([]);
  });

  Ajax.mockImplementation(() => ({
    Metrics: {
      captureEvent: () => {},
    },
  }));

  getGalaxyComputeCost.mockImplementation(() => {
    return GALAXY_COMPUTE_COST;
  });
  getGalaxyDiskCost.mockImplementation(() => {
    return GALAXY_DISK_COST;
  });
  getRuntimeCost.mockImplementation(() => {
    return RUNTIME_COST;
  });
  getPersistentDiskCostHourly.mockImplementation(() => {
    return PERSISTENT_DISK_COST;
  });
  runtimeConfigCost.mockImplementation(() => {
    return RUNTIME_COST + PERSISTENT_DISK_COST;
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

// Note - These constants are copied from ./runtime-utils.test.ts
const galaxyRunning = {
  appName: 'terra-app-69200c2f-89c3-47db-874c-b770d8de737f',
  appType: 'GALAXY',
  auditInfo: {
    creator: 'cahrens@gmail.com',
    createdDate: '2021-11-29T20:19:13.162484Z',
    destroyedDate: null,
    dateAccessed: '2021-11-29T20:19:13.162484Z',
  },
  diskName: 'saturn-pd-026594ac-d829-423d-a8df-76fe96f5b4e7',
  errors: [],
  googleProject: 'terra-test-e4000484',
  kubernetesRuntimeConfig: { numNodes: 1, machineType: 'n1-highmem-8', autoscalingEnabled: false },
  labels: {},
  proxyUrls: { galaxy: 'https://leonardo-fiab.dsde-dev.broadinstitute.org/a-app-69200c2f-89c3-47db-874c-b770d8de737f/galaxy' },
  status: 'RUNNING',
};

const cromwellRunning = {
  appName: 'terra-app-83f46705-524c-4fc8-xcyc-97fdvcfby14f',
  appType: 'CROMWELL',
  auditInfo: {
    creator: 'cahrens@gmail.com',
    createdDate: '2021-11-28T20:28:01.998494Z',
    destroyedDate: null,
    dateAccessed: '2021-11-28T20:28:01.998494Z',
  },
  diskName: 'saturn-pd-026594ac-d829-423d-a8df-55fe36f5b4e8',
  errors: [],
  googleProject: 'terra-test-e4000484',
  kubernetesRuntimeConfig: { numNodes: 1, machineType: 'n1-highmem-8', autoscalingEnabled: false },
  labels: {},
  proxyUrls: { 'cromwell-service': 'https://leonardo-fiab.dsde-dev.broadinstitute.org/fd0cfbb14f/cromwell-service/swagger/cromwell.yaml' },
  status: 'RUNNING',
};

const cromwellDisk = {
  auditInfo: {
    creator: 'cahrens@gmail.com',
    createdDate: '2021-11-26T20:19:13.162484Z',
    destroyedDate: null,
    dateAccessed: '2021-11-29T20:19:14.114Z',
  },
  blockSize: 4096,
  diskType: 'pd-standard',
  googleProject: 'terra-test-e4000484',
  id: 16,
  labels: { saturnApplication: 'CROMWELL', saturnWorkspaceName: 'test-workspace' },
  name: 'saturn-pd-026594ac-d829-423d-a8df-55fe36f5b4e8',
  size: 500,
  status: 'Ready',
  zone: 'us-central1-a',
};

const cromwellOnAzureRunning = {
  appName: 'test-cromwell-app',
  cloudContext: {
    cloudProvider: 'AZURE',
    cloudResource: 'path/to/cloud/resource',
  },
  kubernetesRuntimeConfig: {
    numNodes: 1,
    machineType: 'Standard_A2_v2',
    autoscalingEnabled: false,
  },
  errors: [],
  status: 'RUNNING',
  proxyUrls: {
    cbas: 'https://lz123.servicebus.windows.net/test-cromwell-app/cbas',
    'cbas-ui': 'https://lz123.servicebus.windows.net/test-cromwell-app/',
    cromwell: 'https://lz123.servicebus.windows.net/test-cromwell-app/cromwell',
    wds: 'https://lz123.servicebus.windows.net/test-cromwell-app/wds',
  },
  diskName: null,
  customEnvironmentVariables: {},
  auditInfo: {
    creator: 'abc.testerson@gmail.com',
    createdDate: '2023-01-18T23:28:47.605176Z',
    destroyedDate: null,
    dateAccessed: '2023-01-18T23:28:47.605176Z',
  },
  appType: 'CROMWELL',
  labels: {
    cloudContext: 'path/to/cloud/context',
    appName: 'test-cromwell-app',
    clusterServiceAccount: '/subscriptions/123/pet-101',
    creator: 'abc.testerson@gmail.com',
  },
};

const galaxyDisk = {
  auditInfo: {
    creator: 'cahrens@gmail.com',
    createdDate: '2021-11-29T20:19:13.162484Z',
    destroyedDate: null,
    dateAccessed: '2021-11-29T20:19:14.114Z',
  },
  blockSize: 4096,
  diskType: 'pd-standard',
  googleProject: 'terra-test-e4000484',
  id: 10,
  labels: { saturnApplication: 'galaxy', saturnWorkspaceName: 'test-workspace' }, // Note 'galaxy' vs. 'GALAXY', to represent our older naming scheme
  name: 'saturn-pd-026594ac-d829-423d-a8df-76fe96f5b4e7',
  size: 500,
  status: 'Ready',
  zone: 'us-central1-a',
};

const jupyter = {
  id: 75239,
  workspaceId: null,
  runtimeName: 'saturn-eae9168f-9b99-4910-945e-dbab66e04d91',
  googleProject: 'terra-dev-cf677740',
  cloudContext: {
    cloudProvider: 'GCP',
    cloudResource: 'terra-dev-cf677740',
  },
  auditInfo: {
    creator: 'testuser123@broad.com',
    createdDate: '2022-07-18T18:35:32.012698Z',
    destroyedDate: null,
    dateAccessed: '2022-07-18T21:44:17.565Z',
  },
  runtimeConfig: {
    machineType: 'n1-standard-1',
    persistentDiskId: 15778,
    cloudService: 'GCE',
    bootDiskSize: 120,
    zone: 'us-central1-a',
    gpuConfig: undefined,
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
    googleProject: 'terra-dev-cf677740',
  },
  patchInProgress: false,
};

const jupyterLabRunning = {
  auditInfo: {
    createdDate: '2022-09-09T20:20:06.982538Z',
    creator: 'ncl.hedwig@gmail.com',
    dateAccessed: '2022-09-09T20:20:08.185Z',
    destroyedDate: null,
  },
  cloudContext: {
    cloudProvider: 'AZURE',
    cloudResource: 'fad90753-2022-4456-9b0a-c7e5b934e408/3efc5bdf-be0e-44e7-b1d7-c08931e3c16c/mrg-terra-workspace-20220412104730',
  },
  googleProject: 'fad90753-2022-4456-9b0a-c7e5b934e408/3efc5bdf-be0e-44e7-b1d7-c08931e3c16c/mrg-terra-workspace-20220412104730',
  id: 76996,
  labels: {
    cloudContext: 'Azure/fad90753-2022-4456-9b0a-c7e5b934e408/3efc5bdf-be0e-44e7-b1d7-c08931e3c16c/mrg-terra-workspace-20220412104730',
    clusterName: 'saturn-b2eecc2d-75d5-44f5-8eb2-5147db41874a',
    clusterServiceAccount: 'ncl.hedwig@gmail.com',
    creator: 'ncl.hedwig@gmail.com',
    runtimeName: 'saturn-b2eecc2d-75d5-44f5-8eb2-5147db41874a',
    saturnAutoCreated: 'true',
    saturnVersion: '6',
    saturnWorkspaceName: 'isAzure',
    saturnWorkspaceNamespace: 'alpha-azure-billing-project-20220407',
    tool: 'JupyterLab',
  },
  patchInProgress: false,
  proxyUrl: 'https://relay-ns-2a77dcb5-882c-46b9-a3bc-5d251aff14d0.servicebus.windows.net/saturn-b2eecc2d-75d5-44f5-8eb2-5147db41874a',
  runtimeConfig: {
    cloudService: 'AZURE_VM',
    machineType: defaultAzureMachineType,
    persistentDiskId: 15778,
    region: defaultAzureRegion,
    runtimeName: 'saturn-b2eecc2d-75d5-44f5-8eb2-5147db41874a',
    status: 'Running',
    workspaceId: '2a77dcb5-882c-46b9-a3bc-5d251aff14d0',
  },
};

const runtimeDisk = {
  id: 15778,
  googleProject: 'terra-dev-cf677740',
  cloudContext: {
    cloudProvider: 'GCP',
    cloudResource: 'terra-dev-cf677740',
  },
  zone: 'us-central1-a',
  name: 'saturn-pd-c4aea6ef-5618-47d3-b674-5d456c9dcf4f',
  status: 'Ready',
  auditInfo: {
    creator: 'testuser123@broad.com',
    createdDate: '2022-07-18T18:35:32.012698Z',
    destroyedDate: null,
    dateAccessed: '2022-07-18T20:34:56.092Z',
  },
  size: 50,
  diskType: {
    label: 'pd-standard',
    displayName: 'Standard',
    regionToPricesName: 'monthlyStandardDiskPrice',
  },
  blockSize: 4096,
  labels: {
    saturnWorkspaceNamespace: 'general-dev-billing-account',
    saturnWorkspaceName: 'Broad Test Workspace',
  },
};

const rstudioRuntime = {
  id: 76979,
  workspaceId: null,
  runtimeName: 'saturn-48afb74a-15b1-4aad-8b23-d039cf8253fb',
  googleProject: 'terra-dev-98897219',
  cloudContext: {
    cloudProvider: 'GCP',
    cloudResource: 'terra-dev-98897219',
  },
  auditInfo: {
    creator: 'ncl.hedwig@gmail.com',
    createdDate: '2022-09-08T19:46:37.396597Z',
    destroyedDate: null,
    dateAccessed: '2022-09-08T19:47:21.206Z',
  },
  runtimeConfig: {
    machineType: 'n1-standard-4',
    persistentDiskId: 15778,
    cloudService: 'GCE',
    bootDiskSize: 120,
    zone: 'us-central1-a',
    gpuConfig: undefined,
  },
  proxyUrl: 'https://leonardo.dsde-dev.broadinstitute.org/proxy/terra-dev-98897219/saturn-48afb74a-15b1-4aad-8b23-d039cf8253fb/rstudio',
  status: 'Running',
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
    googleProject: 'terra-dev-98897219',
  },
  patchInProgress: false,
};

const contextBarProps = {
  runtimes: [],
  apps: [],
  appDataDisks: [],
  refreshRuntimes: () => '',
  storageDetails: {
    googleBucketLocation: 'US-CENTRAL1',
    googleBucketType: '',
    azureContainerRegion: 'eastus',
    azureContainerUrl: 'container-url',
    azureContainerSasUrl: 'container-url?sas',
  },
  refreshApps: () => '',
  workspace: {
    workspace: {
      namespace: 'namespace',
      cloudPlatform: 'Gcp',
    },
    namespace: 'Broad Test Workspace',
  },
};

const contextBarPropsForAzure = {
  runtimes: [],
  apps: [],
  appDataDisks: [],
  refreshRuntimes: () => '',
  storageDetails: {
    googleBucketLocation: 'US-CENTRAL1',
    googleBucketType: 'region',
    azureContainerRegion: undefined,
    azureContainerUrl: undefined,
    azureContainerSasUrl: undefined,
  },
  refreshApps: () => '',
  workspace: {
    workspace: {
      namespace: 'namespace',
      cloudPlatform: 'Azure',
      createdDate: '2023-02-15T19:17:15.711Z',
    },
    namespace: 'Broad Azure Test Workspace',
  },
};

describe('ContextBar - buttons', () => {
  it('will render default icons', () => {
    // Act
    const { getByText, getByLabelText, queryByTestId } = render(h(ContextBar, contextBarProps));

    // Assert
    expect(getByText('Rate:'));
    expect(getByLabelText('Environment Configuration'));
    expect(queryByTestId('terminal-button-id')).not.toBeInTheDocument();
  });

  it('will render Jupyter button with an enabled Terminal Button', () => {
    // Arrange
    const jupyterContextBarProps = {
      ...contextBarProps,
      runtimes: [jupyter],
      persistentDisks: [runtimeDisk],
    };

    // Act
    const { getByText, getByLabelText, getByTestId } = render(h(ContextBar, jupyterContextBarProps));

    // Assert
    expect(getByText('Rate:'));
    expect(getByLabelText('Environment Configuration'));
    expect(getByLabelText(new RegExp(/Jupyter Environment/i)));
    expect(getByTestId('terminal-button-id')).toBeEnabled();
    expect(getByText(Utils.formatUSD(RUNTIME_COST + PERSISTENT_DISK_COST)));
    expect(getByText(/Running \$.*\/hr/));
  });

  it('will render Jupyter in Creating status', () => {
    // Arrange
    const jupyterContextBarProps = {
      ...contextBarProps,
      runtimes: [{ ...jupyter, status: 'Creating' }],
      persistentDisks: [runtimeDisk],
    };

    // Act
    const { getByText, getByLabelText, getByTestId } = render(h(ContextBar, jupyterContextBarProps));

    // Assert
    expect(getByText('Rate:'));
    expect(getByLabelText('Environment Configuration'));
    expect(getByLabelText(new RegExp(/Jupyter Environment/i)));
    expect(getByTestId('terminal-button-id')).toBeEnabled();
    expect(getByText(Utils.formatUSD(RUNTIME_COST + PERSISTENT_DISK_COST)));
    expect(getByText(/Creating \$.*\/hr/));
  });

  it('will render Galaxy and RStudio buttons with a disabled Terminal Button', () => {
    // Arrange
    const rstudioGalaxyContextBarProps = {
      ...contextBarProps,
      runtimes: [{ ...rstudioRuntime, status: 'Creating' }],
      apps: [galaxyRunning],
      appDataDisks: [galaxyDisk],
      persistentDisks: [runtimeDisk],
    };

    // Act
    const { getByText, getByLabelText, queryByTestId } = render(h(ContextBar, rstudioGalaxyContextBarProps));

    // Assert
    expect(getByText('Rate:'));
    expect(getByText(Utils.formatUSD(RUNTIME_COST + GALAXY_COMPUTE_COST + GALAXY_DISK_COST + PERSISTENT_DISK_COST)));
    expect(getByLabelText('Environment Configuration'));
    expect(getByLabelText(new RegExp(/RStudio Environment/i)));
    expect(getByLabelText(new RegExp(/Galaxy Environment/i)));
    expect(queryByTestId('terminal-button-id')).not.toBeInTheDocument();
    expect(getByText(/Running \$.*\/hr/));
    expect(getByText(/Creating \$.*\/hr/));
    expect(getByText(/Disk \$.*\/hr/));
  });

  it('will render a Cromwell button with a disabled Terminal Button', () => {
    // Arrange
    const rstudioGalaxyContextBarProps = {
      ...contextBarProps,
      apps: [cromwellRunning],
      appDataDisks: [cromwellDisk],
    };

    // Act
    const { getByText, getByLabelText, queryByTestId } = render(h(ContextBar, rstudioGalaxyContextBarProps));

    // Assert
    expect(getByText('Rate:'));
    expect(getByText('$0.00'));
    expect(getByLabelText('Environment Configuration'));
    expect(queryByTestId('terminal-button-id')).not.toBeInTheDocument();
    expect(getByLabelText(new RegExp(/Cromwell Environment/i)));
  });

  it('will render a Cromwell on Azure button with a disabled Terminal Button', () => {
    // Arrange
    const cromwellOnAzureContextBarProps = {
      ...contextBarPropsForAzure,
      apps: [cromwellOnAzureRunning],
      appDataDisks: [],
    };

    // Act
    const { getByLabelText, queryByTestId } = render(h(ContextBar, cromwellOnAzureContextBarProps));

    // Assert
    expect(getByLabelText('Environment Configuration'));
    expect(queryByTestId('terminal-button-id')).not.toBeInTheDocument();
    expect(getByLabelText(new RegExp(/Cromwell Environment/i)));
  });

  it('will render JupyterLab Environment button', () => {
    const jupyterContextBarProps = {
      ...contextBarProps,
      runtimes: [jupyterLabRunning],
      persistentDisks: [],
    };

    // Act
    const { getByText, getByLabelText, queryByTestId } = render(h(ContextBar, jupyterContextBarProps));

    // Assert
    expect(getByText('Rate:'));
    expect(getByText(Utils.formatUSD(RUNTIME_COST)));
    expect(getByLabelText('Environment Configuration'));
    expect(getByLabelText(new RegExp(/JupyterLab Environment/i)));
    expect(queryByTestId('terminal-button-id')).not.toBeInTheDocument();
  });

  it('will render button with error status', () => {
    const jupyterContextBarProps = {
      ...contextBarProps,
      runtimes: [
        {
          ...jupyter,
          status: 'Error',
        },
      ],
      persistentDisks: [],
    };

    // Act
    const { getByText, getByLabelText } = render(h(ContextBar, jupyterContextBarProps));

    // Assert
    expect(getByText('Rate:'));
    expect(getByText(`${Utils.formatUSD(RUNTIME_COST)}`));
    expect(getByLabelText('Environment Configuration'));
    expect(getByLabelText(new RegExp(/Jupyter Environment/i)));
    expect(getByText(/Error \$0.00\/hr/));
  });
});

describe('ContextBar - buttons (Prod config)', () => {
  beforeEach(() => {
    getConfig.mockReturnValue({ isProd: true });
  });

  it('will not render a Cromwell on Azure button if workspace is created before Workflows Public Preview date', () => {
    // Arrange
    const cromwellOnAzureContextBarProps = {
      ...contextBarPropsForAzure,
      apps: [cromwellOnAzureRunning],
      appDataDisks: [],
    };

    // Act
    const { getByLabelText, queryByLabelText } = render(h(ContextBar, cromwellOnAzureContextBarProps));

    // Assert
    expect(getByLabelText('Environment Configuration'));
    expect(queryByLabelText(new RegExp(/Cromwell Environment/i))).not.toBeInTheDocument();
  });
});

describe('ContextBar - actions', () => {
  it('clicking environment configuration opens CloudEnvironmentModal', () => {
    // Act
    const { getByText, getByLabelText } = render(h(ContextBar, contextBarProps));

    const envConf = getByLabelText('Environment Configuration');
    fireEvent.click(envConf);

    // Assert
    expect(getByText('Cloud Environment Details'));
  });

  it('clicking Jupyter opens CloudEnvironmentModal with Jupyter as filter for tool.', () => {
    // Arrange
    const jupyterContextBarProps = {
      ...contextBarProps,
      runtimes: [jupyter],
      persistentDisks: [runtimeDisk],
    };

    // Act
    const { getByText, getByLabelText } = render(h(ContextBar, jupyterContextBarProps));
    fireEvent.click(getByLabelText(new RegExp(/Jupyter Environment/i)));

    // Assert
    getByText('Cloud Environment Details');
    getByText(runtimeToolLabels.Jupyter);
  });

  it('clicking Galaxy opens CloudEnvironmentModal with Galaxy as filter for tool.', () => {
    // Arrange
    const galaxyContextBarProps = {
      ...contextBarProps,
      apps: [galaxyRunning],
      appDataDisks: [galaxyDisk],
    };

    // Act
    const { getByLabelText, getByText } = render(h(ContextBar, galaxyContextBarProps));
    fireEvent.click(getByLabelText(new RegExp(/Galaxy Environment/i)));

    // Assert
    getByText('Cloud Environment Details');
    getByText(appToolLabels.GALAXY);
  });

  it('clicking RStudio opens CloudEnvironmentModal with RStudio as filter for tool.', () => {
    // Act
    const rstudioContextBarProps = {
      ...contextBarProps,
      runtimes: [rstudioRuntime],
      apps: [galaxyRunning],
      appDataDisks: [galaxyDisk],
      persistentDisks: [runtimeDisk],
    };

    // Act
    const { getByText, getByLabelText } = render(h(ContextBar, rstudioContextBarProps));
    fireEvent.click(getByLabelText(new RegExp(/RStudio Environment/i)));

    // Assert
    getByText('Cloud Environment Details');
    getByText(runtimeToolLabels.RStudio);
  });

  it('clicking Terminal will attempt to start currently stopped runtime', async () => {
    // Arrange
    const mockRuntimesStartFn = vi.fn();
    const mockRuntimeWrapper = vi.fn(() => ({
      start: mockRuntimesStartFn,
    }));
    Ajax.mockImplementation(() => ({
      Runtimes: {
        runtimeWrapper: mockRuntimeWrapper,
      },
      Metrics: {
        captureEvent: vi.fn(),
      },
    }));

    const myWindow = Object.create(window);
    const url = 'http://dummy.com';
    Object.defineProperty(myWindow, 'location', {
      value: {
        href: url,
      },
      writable: true,
      hash: '/',
    });
    const runtime = {
      ...jupyter,
      status: 'Stopped',
    };
    const jupyterContextBarProps = {
      ...contextBarProps,
      runtimes: [runtime],
      persistentDisks: [runtimeDisk],
    };

    // Act
    await act(async () => {
      const { getByTestId } = render(h(ContextBar, jupyterContextBarProps));
      await fireEvent.click(getByTestId('terminal-button-id'));
    });

    // Assert
    expect(mockRuntimeWrapper).toHaveBeenCalledWith(
      expect.objectContaining({
        status: runtime.status,
        googleProject: runtime.googleProject,
        runtimeName: runtime.runtimeName,
      })
    );
    expect(mockRuntimesStartFn).toHaveBeenCalled();
  });

  it('clicking Terminal will not attempt to start an already running Jupyter notebook', () => {
    // Arrange
    const mockRuntimesStartFn = vi.fn();
    const mockRuntimeWrapper = vi.fn(() => ({
      start: mockRuntimesStartFn,
    }));
    Ajax.mockImplementation(() => ({
      Runtimes: {
        runtimeWrapper: mockRuntimeWrapper,
      },
      Metrics: {
        captureEvent: vi.fn(),
      },
    }));

    const myWindow = Object.create(window);
    const url = 'http://dummy.com';
    Object.defineProperty(myWindow, 'location', {
      value: {
        href: url,
      },
      writable: true,
      hash: '/',
    });
    const jupyterContextBarProps = {
      ...contextBarProps,
      runtimes: [jupyter],
      persistentDisks: [runtimeDisk],
    };

    // Act
    const { getByTestId } = render(h(ContextBar, jupyterContextBarProps));
    fireEvent.click(getByTestId('terminal-button-id'));

    // Assert
    expect(mockRuntimeWrapper).not.toHaveBeenCalled();
    expect(mockRuntimesStartFn).not.toHaveBeenCalled();
  });

  it('onSuccess will close modal', () => {
    // Act
    const { getByText, getByLabelText, queryByText } = render(h(ContextBar, contextBarProps));
    const envConf = getByLabelText('Environment Configuration');
    fireEvent.click(envConf);
    fireEvent.click(getByText('SuccessButton'));

    // Assert
    expect(queryByText('Cloud Environment Details')).toBeFalsy();
  });

  it('onDismiss will close modal', () => {
    // Act
    const { getByText, getByLabelText, queryByText } = render(h(ContextBar, contextBarProps));
    const envConf = getByLabelText('Environment Configuration');
    fireEvent.click(envConf);
    fireEvent.click(getByText('DismissButton'));

    // Assert
    expect(queryByText('Cloud Environment Details')).toBeFalsy();
  });
});
