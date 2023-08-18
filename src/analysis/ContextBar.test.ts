import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { div, h } from 'react-hyperscript-helpers';
import {
  defaultAzureWorkspace,
  defaultGoogleWorkspace,
  galaxyDisk,
  galaxyRunning,
} from 'src/analysis/_testData/testData';
import { ContextBar, ContextBarProps } from 'src/analysis/ContextBar';
import { CloudEnvironmentModal } from 'src/analysis/modals/CloudEnvironmentModal';
import { doesWorkspaceSupportCromwellAppForUser } from 'src/analysis/utils/app-utils';
import {
  getGalaxyComputeCost,
  getGalaxyDiskCost,
  getPersistentDiskCostHourly,
  getRuntimeCost,
  runtimeConfigCost,
} from 'src/analysis/utils/cost-utils';
import { defaultLocation } from 'src/analysis/utils/runtime-utils';
import { appToolLabels, isToolHidden, runtimeToolLabels } from 'src/analysis/utils/tool-utils';
import { MenuTrigger } from 'src/components/PopupTrigger';
import { locationTypes } from 'src/components/region-common';
import { Ajax } from 'src/libs/ajax';
import { App } from 'src/libs/ajax/leonardo/models/app-models';
import { DecoratedPersistentDisk, PersistentDisk } from 'src/libs/ajax/leonardo/models/disk-models';
import { Runtime, runtimeStatuses } from 'src/libs/ajax/leonardo/models/runtime-models';
import { defaultAzureMachineType, defaultAzureRegion } from 'src/libs/azure-utils';
import { isCromwellAppVisible } from 'src/libs/config';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import * as Utils from 'src/libs/utils';
import { cloudProviderTypes } from 'src/libs/workspace-utils';
import { asMockedFn } from 'src/testing/test-utils';

const GALAXY_COMPUTE_COST = 10;
const GALAXY_DISK_COST = 1;
const RUNTIME_COST = 0.1;
const PERSISTENT_DISK_COST = 0.01;

type CostUtilsExports = typeof import('src/analysis/utils/cost-utils');
jest.mock(
  'src/analysis/utils/cost-utils',
  (): CostUtilsExports => ({
    ...jest.requireActual('src/analysis/utils/cost-utils'),
    getGalaxyComputeCost: jest.fn(),
    getGalaxyDiskCost: jest.fn(),
    getPersistentDiskCostHourly: jest.fn(),
    getRuntimeCost: jest.fn(),
    runtimeConfigCost: jest.fn(),
  })
);

type AppUtilsExports = typeof import('src/analysis/utils/app-utils');
jest.mock(
  'src/analysis/utils/app-utils',
  (): AppUtilsExports => ({
    ...jest.requireActual('src/analysis/utils/app-utils'),
    doesWorkspaceSupportCromwellAppForUser: jest.fn(),
  })
);

type ToolUtilsExports = typeof import('src/analysis/utils/tool-utils');
jest.mock(
  'src/analysis/utils/tool-utils',
  (): ToolUtilsExports => ({
    ...jest.requireActual('src/analysis/utils/tool-utils'),
    isToolHidden: jest.fn(),
  })
);

// Mocking for terminalLaunchLink using Nav.getLink
type NavExports = typeof import('src/libs/nav');
jest.mock(
  'src/libs/nav',
  (): NavExports => ({
    ...jest.requireActual('src/libs/nav'),
    getPath: jest.fn(() => '/test/'),
    getLink: jest.fn(() => '/'),
  })
);

// Mocking PopupTrigger to avoid test environment issues with React Portal's requirement to use
// DOM measure services which are not available in jest environment
type PopupTriggerExports = typeof import('src/components/PopupTrigger');
jest.mock(
  'src/components/PopupTrigger',
  (): PopupTriggerExports => ({
    ...jest.requireActual('src/components/PopupTrigger'),
    MenuTrigger: jest.fn(),
  })
);

type CloudEnvironmentModalExports = typeof import('src/analysis/modals/CloudEnvironmentModal');
jest.mock(
  'src/analysis/modals/CloudEnvironmentModal',
  (): CloudEnvironmentModalExports => ({
    ...jest.requireActual('src/analysis/modals/CloudEnvironmentModal'),
    CloudEnvironmentModal: jest.fn(),
  })
);

type ConfigExports = typeof import('src/libs/config');
jest.mock(
  'src/libs/config',
  (): ConfigExports => ({
    ...jest.requireActual('src/libs/config'),
    isCromwellAppVisible: jest.fn(),
  })
);

jest.mock('src/libs/ajax');
jest.mock('src/libs/feature-previews');

type AjaxContract = ReturnType<typeof Ajax>;
type AjaxMetricsContract = AjaxContract['Metrics'];

const mockMetrics: Partial<AjaxMetricsContract> = {
  captureEvent: () => Promise.resolve(),
};

const defaultAjaxImpl: Partial<AjaxContract> = {
  Metrics: mockMetrics as AjaxMetricsContract,
};

beforeEach(() => {
  asMockedFn(MenuTrigger).mockImplementation(({ content }) => {
    return div([content]);
  });
  asMockedFn(CloudEnvironmentModal).mockImplementation(({ isOpen, filterForTool, onSuccess, onDismiss, ...props }) => {
    return isOpen
      ? div([
          'Cloud Environment Details',
          div([filterForTool]),
          div({ onClick: () => onSuccess('success') }, ['SuccessButton']),
          div({ onClick: () => onDismiss() }, ['DismissButton']),
        ])
      : div([]);
  });

  asMockedFn(Ajax).mockReturnValue(defaultAjaxImpl as AjaxContract);

  asMockedFn(getGalaxyComputeCost).mockReturnValue(GALAXY_COMPUTE_COST);
  asMockedFn(getGalaxyDiskCost).mockReturnValue(GALAXY_DISK_COST);
  asMockedFn(getRuntimeCost).mockReturnValue(RUNTIME_COST);
  asMockedFn(getPersistentDiskCostHourly).mockReturnValue(PERSISTENT_DISK_COST);
  asMockedFn(runtimeConfigCost).mockReturnValue(RUNTIME_COST + PERSISTENT_DISK_COST);
});

afterEach(() => {
  jest.clearAllMocks();
});

const cromwellRunning: App = {
  workspaceId: null,
  accessScope: null,
  appName: 'terra-app-83f46705-524c-4fc8-xcyc-97fdvcfby14f',
  appType: 'CROMWELL',
  auditInfo: {
    creator: 'cahrens@gmail.com',
    createdDate: '2021-11-28T20:28:01.998494Z',
    destroyedDate: null,
    dateAccessed: '2021-11-28T20:28:01.998494Z',
  },
  cloudContext: {
    cloudProvider: cloudProviderTypes.GCP,
    cloudResource: 'terra-test-e4000484',
  },
  diskName: 'saturn-pd-026594ac-d829-423d-a8df-55fe36f5b4e8',
  errors: [],
  kubernetesRuntimeConfig: { numNodes: 1, machineType: 'n1-highmem-8', autoscalingEnabled: false },
  labels: {},
  proxyUrls: {
    'cromwell-service':
      'https://leonardo-fiab.dsde-dev.broadinstitute.org/fd0cfbb14f/cromwell-service/swagger/cromwell.yaml',
  },
  status: 'RUNNING',
};

const cromwellDisk: PersistentDisk = {
  auditInfo: {
    creator: 'cahrens@gmail.com',
    createdDate: '2021-11-26T20:19:13.162484Z',
    destroyedDate: null,
    dateAccessed: '2021-11-29T20:19:14.114Z',
  },
  blockSize: 4096,
  diskType: 'pd-standard',
  cloudContext: {
    cloudProvider: cloudProviderTypes.GCP,
    cloudResource: 'terra-test-e4000484',
  },
  id: 16,
  labels: { saturnApplication: 'CROMWELL', saturnWorkspaceName: 'test-workspace' },
  name: 'saturn-pd-026594ac-d829-423d-a8df-55fe36f5b4e8',
  size: 500,
  status: 'Ready',
  zone: 'us-central1-a',
};

const cromwellOnAzureRunning: App = {
  workspaceId: null,
  accessScope: null,
  appName: 'test-cromwell-app',
  diskName: null,
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

const rstudioRuntime: Runtime = {
  id: 76979,
  workspaceId: defaultGoogleWorkspace.workspace.workspaceId,
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
  proxyUrl:
    'https://leonardo.dsde-dev.broadinstitute.org/proxy/terra-dev-98897219/saturn-48afb74a-15b1-4aad-8b23-d039cf8253fb/rstudio',
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

const jupyter: Runtime = {
  id: 75239,
  workspaceId: defaultGoogleWorkspace.workspace.workspaceId,
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
  proxyUrl:
    'https://leonardo.dsde-dev.broadinstitute.org/proxy/terra-dev-cf677740/saturn-eae9168f-9b99-4910-945e-dbab66e04d91/jupyter',
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

const jupyterLabRunning: Runtime = {
  auditInfo: {
    createdDate: '2022-09-09T20:20:06.982538Z',
    destroyedDate: null,
    creator: 'ncl.hedwig@gmail.com',
    dateAccessed: '2022-09-09T20:20:08.185Z',
  },
  runtimeName: 'saturn-b2eecc2d-75d5-44f5-8eb2-5147db41874a',
  cloudContext: {
    cloudProvider: 'AZURE',
    cloudResource:
      'fad90753-2022-4456-9b0a-c7e5b934e408/3efc5bdf-be0e-44e7-b1d7-c08931e3c16c/mrg-terra-workspace-20220412104730',
  },
  googleProject:
    'fad90753-2022-4456-9b0a-c7e5b934e408/3efc5bdf-be0e-44e7-b1d7-c08931e3c16c/mrg-terra-workspace-20220412104730',
  id: 76996,
  labels: {
    cloudContext:
      'Azure/fad90753-2022-4456-9b0a-c7e5b934e408/3efc5bdf-be0e-44e7-b1d7-c08931e3c16c/mrg-terra-workspace-20220412104730',
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
  proxyUrl:
    'https://relay-ns-2a77dcb5-882c-46b9-a3bc-5d251aff14d0.servicebus.windows.net/saturn-b2eecc2d-75d5-44f5-8eb2-5147db41874a',
  runtimeConfig: {
    cloudService: 'AZURE_VM',
    machineType: defaultAzureMachineType,
    persistentDiskId: 15778,
    region: defaultAzureRegion,
  },
  workspaceId: '2a77dcb5-882c-46b9-a3bc-5d251aff14d0',
  status: 'Running',
};

const runtimeDisk: DecoratedPersistentDisk = {
  id: 15778,
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
    value: 'pd-standard',
    label: 'Standard',
    regionToPricesName: 'monthlyStandardDiskPrice',
  },
  blockSize: 4096,
  labels: {
    saturnWorkspaceNamespace: 'general-dev-billing-account',
    saturnWorkspaceName: 'Broad Test Workspace',
  },
};

const defaultGoogleBucketOptions = {
  googleBucketLocation: defaultLocation,
  googleBucketType: locationTypes.default,
  fetchedGoogleBucketLocation: undefined,
};
const defaultAzureStorageOptions = {
  azureContainerRegion: 'eastus',
  azureContainerUrl: 'container-url',
  azureContainerSasUrl: 'container-url?sas',
};

const contextBarProps: ContextBarProps = {
  runtimes: [],
  apps: [],
  appDataDisks: [],
  persistentDisks: [],
  refreshRuntimes: () => Promise.resolve(),
  storageDetails: defaultGoogleBucketOptions,
  refreshApps: () => Promise.resolve(),
  workspace: defaultGoogleWorkspace,
};

const contextBarPropsForAzure: ContextBarProps = {
  runtimes: [],
  apps: [],
  appDataDisks: [],
  persistentDisks: [],
  refreshRuntimes: () => Promise.resolve(),
  storageDetails: { ...defaultGoogleBucketOptions, ...defaultAzureStorageOptions },
  refreshApps: () => Promise.resolve(),
  workspace: defaultAzureWorkspace,
};

const hailBatchAppRunning: App = {
  workspaceId: null,
  accessScope: null,
  appName: 'test-hail-batch-app',
  diskName: null,
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
    batch: 'https://lz123.servicebus.windows.net/test-hail-batch-app/batch',
  },
  customEnvironmentVariables: {},
  auditInfo: {
    creator: 'abc.testerson@gmail.com',
    createdDate: '2023-01-18T23:28:47.605176Z',
    destroyedDate: null,
    dateAccessed: '2023-01-18T23:28:47.605176Z',
  },
  appType: 'HAIL_BATCH',
  labels: {
    cloudContext: 'path/to/cloud/context',
    appName: 'test-cromwell-app',
    clusterServiceAccount: '/subscriptions/123/pet-101',
    creator: 'abc.testerson@gmail.com',
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
    const jupyterContextBarProps: ContextBarProps = {
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
    const jupyterContextBarProps: ContextBarProps = {
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
    const rstudioGalaxyContextBarProps: ContextBarProps = {
      ...contextBarProps,
      runtimes: [{ ...rstudioRuntime, status: runtimeStatuses.creating.leoLabel }],
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
    expect(getByText('Running $0.52/hr'));
    expect(getByText('Creating $0.20/hr'));
    expect(getByText('Disk $0.04/hr'));
  });

  it('will render a Cromwell button with a disabled Terminal Button', () => {
    // Arrange
    const rstudioGalaxyContextBarProps: ContextBarProps = {
      ...contextBarProps,
      apps: [cromwellRunning],
      appDataDisks: [cromwellDisk],
    };

    asMockedFn(isCromwellAppVisible).mockReturnValue(true);
    asMockedFn(doesWorkspaceSupportCromwellAppForUser).mockReturnValue(true);

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
    const cromwellOnAzureContextBarProps: ContextBarProps = {
      ...contextBarPropsForAzure,
      apps: [cromwellOnAzureRunning],
      appDataDisks: [],
    };

    asMockedFn(doesWorkspaceSupportCromwellAppForUser).mockReturnValue(true);

    // Act
    const { getByLabelText, queryByTestId } = render(h(ContextBar, cromwellOnAzureContextBarProps));

    // Assert
    expect(getByLabelText('Environment Configuration'));
    expect(queryByTestId('terminal-button-id')).not.toBeInTheDocument();
    expect(getByLabelText(new RegExp(/Cromwell Environment/i)));
  });

  it('will not render a Cromwell button if workspace is not supported for cromwell', () => {
    // Arrange
    const cromwellOnAzureContextBarProps: ContextBarProps = {
      ...contextBarPropsForAzure,
      apps: [cromwellOnAzureRunning],
      appDataDisks: [],
    };

    asMockedFn(doesWorkspaceSupportCromwellAppForUser).mockReturnValue(false);

    // Act
    const { getByLabelText, queryByLabelText } = render(h(ContextBar, cromwellOnAzureContextBarProps));

    // Assert
    expect(getByLabelText('Environment Configuration'));
    expect(queryByLabelText(new RegExp(/Cromwell Environment/i))).not.toBeInTheDocument();
  });

  it('will not render a cromwell button if it is hidden ', () => {
    // Arrange
    const cromwellOnAzureContextBarProps: ContextBarProps = {
      ...contextBarPropsForAzure,
      apps: [cromwellOnAzureRunning],
      appDataDisks: [],
    };

    asMockedFn(isToolHidden).mockReturnValue(true);

    // Act
    const { getByLabelText, queryByLabelText } = render(h(ContextBar, cromwellOnAzureContextBarProps));

    // Assert
    expect(getByLabelText('Environment Configuration'));
    expect(queryByLabelText(new RegExp(/Cromwell Environment/i))).not.toBeInTheDocument();
  });

  it('will render JupyterLab Environment button', () => {
    const jupyterContextBarProps: ContextBarProps = {
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
    const jupyterContextBarProps: ContextBarProps = {
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
    const jupyterContextBarProps: ContextBarProps = {
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
    const galaxyContextBarProps: ContextBarProps = {
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
    const rstudioContextBarProps: ContextBarProps = {
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
    const user = userEvent.setup();

    const mockRuntimesStartFn = jest.fn();
    type RuntimesContract = AjaxContract['Runtimes'];

    const mockRuntimeWrapper: Partial<RuntimesContract['runtimeWrapper']> = jest.fn(() => ({
      start: mockRuntimesStartFn,
    }));

    const mockRuntimes: Partial<RuntimesContract> = {
      runtimeWrapper: mockRuntimeWrapper as RuntimesContract['runtimeWrapper'],
    };

    const newMockAjax: Partial<AjaxContract> = {
      ...defaultAjaxImpl,
      Runtimes: mockRuntimes as RuntimesContract,
    };
    asMockedFn(Ajax).mockReturnValue(newMockAjax as AjaxContract);

    const runtime: Runtime = {
      ...jupyter,
      status: 'Stopped',
    };
    const jupyterContextBarProps: ContextBarProps = {
      ...contextBarProps,
      runtimes: [runtime],
      persistentDisks: [runtimeDisk],
    };

    // Act
    render(h(ContextBar, jupyterContextBarProps));
    await user.click(screen.getByTestId('terminal-button-id'));

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
    const mockRuntimesStartFn = jest.fn();
    type RuntimesContract = AjaxContract['Runtimes'];

    const mockRuntimeWrapper: Partial<RuntimesContract['runtimeWrapper']> = jest.fn(() => ({
      start: mockRuntimesStartFn,
    }));

    const mockRuntimes: Partial<RuntimesContract> = {
      runtimeWrapper: mockRuntimeWrapper as RuntimesContract['runtimeWrapper'],
    };

    const newMockAjax: Partial<AjaxContract> = {
      ...defaultAjaxImpl,
      Runtimes: mockRuntimes as RuntimesContract,
    };
    asMockedFn(Ajax).mockReturnValue(newMockAjax as AjaxContract);

    const jupyterContextBarProps: ContextBarProps = {
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

  it('will not render Hail Batch if the feature flag is disabled', () => {
    // Arrange
    const hailBatchContextBarProps: ContextBarProps = {
      ...contextBarPropsForAzure,
      apps: [hailBatchAppRunning],
      appDataDisks: [],
    };

    asMockedFn(isFeaturePreviewEnabled).mockReturnValue(false);

    // Act
    const { getByLabelText, queryByLabelText } = render(h(ContextBar, hailBatchContextBarProps));

    // Assert
    expect(getByLabelText('Environment Configuration'));
    expect(queryByLabelText(new RegExp(/Hail Batch Environment/i))).not.toBeInTheDocument();
  });

  it('will render Hail Batch app if the feature flag is enabled', () => {
    // Arrange
    const hailBatchContextBarProps: ContextBarProps = {
      ...contextBarPropsForAzure,
      apps: [hailBatchAppRunning],
      appDataDisks: [],
    };

    asMockedFn(isFeaturePreviewEnabled).mockReturnValue(true);

    // Act
    const { getByLabelText, queryByLabelText } = render(h(ContextBar, hailBatchContextBarProps));

    // Assert
    expect(getByLabelText('Environment Configuration'));
    expect(queryByLabelText(new RegExp(/Hail Batch Environment/i)));
  });
});
