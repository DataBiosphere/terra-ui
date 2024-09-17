import { DeepPartial } from '@terra-ui-packages/core-utils';
import { partial } from '@terra-ui-packages/test-utils';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import {
  azureRuntime,
  defaultTestDisk,
  getDisk,
  imageDocs,
  testAzureDefaultRegion,
} from 'src/analysis/_testData/testData';
import { getAzureComputeCostEstimate, getAzureDiskCostEstimate } from 'src/analysis/utils/cost-utils';
import { autopauseDisabledValue, defaultAutopauseThreshold } from 'src/analysis/utils/runtime-utils';
import { runtimeToolLabels } from 'src/analysis/utils/tool-utils';
import { Ajax } from 'src/libs/ajax';
import { Billing, BillingContract } from 'src/libs/ajax/billing/Billing';
import { AzureConfig } from 'src/libs/ajax/leonardo/models/runtime-config-models';
import { leoDiskProvider } from 'src/libs/ajax/leonardo/providers/LeoDiskProvider';
import { RuntimeAjaxContractV2 } from 'src/libs/ajax/leonardo/Runtimes';
import { WorkspaceManagerResources, WorkspaceManagerResourcesContract } from 'src/libs/ajax/WorkspaceManagerResources';
import { azureMachineTypes, defaultAzureMachineType, getMachineTypeLabel } from 'src/libs/azure-utils';
import { formatUSD } from 'src/libs/utils';
import { azureBillingProfile } from 'src/testing/billing-profile-fixtures';
import { asMockedFn, renderWithAppContexts as render, SelectHelper } from 'src/testing/test-utils';
import { defaultAzureWorkspace } from 'src/testing/workspace-fixtures';

import { AzureComputeModalBase } from './AzureComputeModal';

jest.mock('src/analysis/utils/cost-utils');
jest.mock('src/libs/ajax/leonardo/providers/LeoDiskProvider');
jest.mock('src/libs/ajax/WorkspaceManagerResources', () => ({ WorkspaceManagerResources: jest.fn() }));
jest.mock('src/libs/ajax/billing/Billing', () => ({ Billing: jest.fn() }));

jest.mock('src/libs/ajax');
jest.mock('src/libs/notifications', () => ({
  notify: jest.fn(),
}));

const onSuccess = jest.fn();
const defaultModalProps = {
  onSuccess,
  onDismiss: jest.fn(),
  onError: jest.fn(),
  currentRuntime: undefined,
  currentDisk: undefined,
  tool: runtimeToolLabels.JupyterLab,
  workspace: defaultAzureWorkspace,
  location: testAzureDefaultRegion,
  isLoadingCloudEnvironments: false,
  hideCloseButton: false,
};

const persistentDiskModalProps = {
  onSuccess,
  onDismiss: jest.fn(),
  onError: jest.fn(),
  currentRuntime: undefined,
  currentDisk: defaultTestDisk,
  tool: runtimeToolLabels.JupyterLab,
  workspace: defaultAzureWorkspace,
  location: testAzureDefaultRegion,
  isLoadingCloudEnvironments: false,
  hideCloseButton: false,
};

type AjaxContract = ReturnType<typeof Ajax>;

const defaultAjaxImpl: AjaxContract = {
  Buckets: { getObjectPreview: () => Promise.resolve({ json: () => Promise.resolve(imageDocs) }) } satisfies Partial<
    AjaxContract['Buckets']
  >,
  Metrics: {
    captureEvent: jest.fn(),
  } satisfies Partial<AjaxContract['Metrics']>,
} as DeepPartial<AjaxContract> as AjaxContract;

const verifyEnabled = (item) => expect(item).not.toHaveAttribute('disabled');
const verifyDisabled = (item) => expect(item).toHaveAttribute('disabled');

describe('AzureComputeModal', () => {
  beforeEach(() => {
    // Arrange
    asMockedFn(Ajax).mockReturnValue(defaultAjaxImpl);

    const getWorkspace = jest.fn(() => Promise.resolve({ spendProfile: azureBillingProfile.id }));
    asMockedFn(WorkspaceManagerResources).mockImplementation(
      () => ({ getWorkspace } as Partial<WorkspaceManagerResourcesContract> as WorkspaceManagerResourcesContract)
    );

    const getBillingProfile = jest.fn(() => Promise.resolve(azureBillingProfile));
    asMockedFn(Billing).mockImplementation(
      () => ({ getBillingProfile } as Partial<BillingContract> as BillingContract)
    );
  });

  const getCreateButton = () => screen.getByText('Create');
  it('renders correctly with minimal state', async () => {
    // Arrange

    // Act
    // wrapping component init-time stateful side-effects with act()
    await act(async () => {
      render(h(AzureComputeModalBase, defaultModalProps));
    });

    // Assert
    verifyEnabled(getCreateButton());
    screen.getByText('Azure Cloud Environment');
    const deleteButton = screen.queryByText('Delete Environment');
    expect(deleteButton).toBeNull();
  });

  it('disables submit while loading', async () => {
    // Act
    await act(async () => {
      render(h(AzureComputeModalBase, { ...defaultModalProps, isLoadingCloudEnvironments: true }));
    });

    // Assert
    verifyDisabled(getCreateButton());
    screen.getByText('Azure Cloud Environment');
  });

  it('sends the proper leo API call in default create case (no runtimes or disks)', async () => {
    // Arrange
    const user = userEvent.setup();

    const createFunc = jest.fn();
    const runtimeFunc = jest.fn(() => ({
      create: createFunc,
      details: jest.fn(),
    }));

    asMockedFn(Ajax).mockReturnValue({
      ...defaultAjaxImpl,
      Runtimes: {
        runtimeV2: runtimeFunc as Partial<RuntimeAjaxContractV2>,
      } as Partial<AjaxContract['Runtimes']>,
    } as AjaxContract);

    // Act
    // wrapping component init-time stateful side-effects with act()
    await act(async () => {
      render(h(AzureComputeModalBase, defaultModalProps));
    });

    await user.click(getCreateButton());

    // Assert
    const labels = {
      saturnWorkspaceNamespace: defaultModalProps.workspace.workspace.namespace,
      saturnWorkspaceName: defaultModalProps.workspace.workspace.name,
    };
    expect(runtimeFunc).toHaveBeenCalledWith(defaultModalProps.workspace.workspace.workspaceId, expect.anything());
    expect(createFunc).toHaveBeenCalledWith(
      {
        labels,
        disk: expect.objectContaining({
          labels,
          name: expect.anything(),
        }),
        machineSize: defaultAzureMachineType,
        autopauseThreshold: defaultAutopauseThreshold,
      },
      false
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it('sends the proper leo API call in the case of a persistent disk', async () => {
    // Arrange
    const user = userEvent.setup();

    const createFunc = jest.fn();
    const runtimeFunc = jest.fn(() => ({
      create: createFunc,
      details: jest.fn(),
    }));
    asMockedFn(Ajax).mockReturnValue({
      ...defaultAjaxImpl,
      Runtimes: {
        runtimeV2: runtimeFunc as Partial<RuntimeAjaxContractV2>,
      } as Partial<AjaxContract['Runtimes']>,
    } as AjaxContract);

    // Act
    // wrapping component init-time stateful side-effects with act()
    await act(async () => {
      render(h(AzureComputeModalBase, persistentDiskModalProps));
    });

    await user.click(getCreateButton());

    // Assert
    const labels = {
      saturnWorkspaceNamespace: defaultModalProps.workspace.workspace.namespace,
      saturnWorkspaceName: defaultModalProps.workspace.workspace.name,
    };
    expect(runtimeFunc).toHaveBeenCalledWith(defaultModalProps.workspace.workspace.workspaceId, expect.anything());
    expect(createFunc).toHaveBeenCalledWith(
      {
        labels,
        disk: expect.objectContaining({
          labels,
          name: expect.anything(),
        }),
        machineSize: defaultAzureMachineType,
        autopauseThreshold: defaultAutopauseThreshold,
      },
      true
    );

    expect(onSuccess).toHaveBeenCalled();
  });

  it('sends the proper leo API call in create case (custom autopause)', async () => {
    // Arrange
    const user = userEvent.setup();

    const createFunc = jest.fn();
    const runtimeFunc = jest.fn(() => ({
      create: createFunc,
      details: jest.fn(),
    }));
    asMockedFn(Ajax).mockReturnValue({
      ...defaultAjaxImpl,
      Runtimes: {
        runtimeV2: runtimeFunc as Partial<RuntimeAjaxContractV2>,
      } as Partial<AjaxContract['Runtimes']>,
    } as AjaxContract);

    // Act
    // wrapping component init-time stateful side-effects with act()
    await act(async () => {
      render(h(AzureComputeModalBase, defaultModalProps));
    });

    const numberInput = (await screen.getByLabelText('minutes of inactivity')) as HTMLInputElement;
    expect(numberInput).toBeInTheDocument();
    await user.type(numberInput, '0');
    expect(numberInput.value).toBe('300');

    await user.click(getCreateButton());

    // Assert
    const labels = {
      saturnWorkspaceNamespace: defaultModalProps.workspace.workspace.namespace,
      saturnWorkspaceName: defaultModalProps.workspace.workspace.name,
    };
    expect(runtimeFunc).toHaveBeenCalledWith(defaultModalProps.workspace.workspace.workspaceId, expect.anything());
    expect(createFunc).toHaveBeenCalledWith(
      {
        labels,
        disk: expect.objectContaining({
          labels,
          name: expect.anything(),
        }),
        machineSize: defaultAzureMachineType,
        autopauseThreshold: 300,
      },
      false
    );

    expect(onSuccess).toHaveBeenCalled();
  });

  it('sends the proper leo API call in create case (autopause disabled)', async () => {
    // Arrange
    const user = userEvent.setup();

    const createFunc = jest.fn();
    const runtimeFunc = jest.fn(
      () =>
        ({
          create: createFunc,
          details: jest.fn(),
        } satisfies Partial<RuntimeAjaxContractV2>)
    );
    asMockedFn(Ajax).mockReturnValue({
      ...defaultAjaxImpl,
      Runtimes: {
        runtimeV2: runtimeFunc,
      } satisfies DeepPartial<AjaxContract['Runtimes']>,
    } as DeepPartial<AjaxContract> as AjaxContract);

    // Act
    // wrapping component init-time stateful side-effects with act()
    await act(async () => {
      render(h(AzureComputeModalBase, defaultModalProps));
    });

    const autopauseCheckbox = screen.getByLabelText('Enable autopause');
    expect(autopauseCheckbox).toBeInTheDocument();
    expect(autopauseCheckbox).toBeChecked();
    await user.click(autopauseCheckbox);
    expect(autopauseCheckbox).not.toBeChecked();
    const numberInput = screen.getByLabelText('minutes of inactivity');
    expect(numberInput).not.toBeVisible();

    await user.click(getCreateButton());

    // Assert
    const labels = {
      saturnWorkspaceNamespace: defaultModalProps.workspace.workspace.namespace,
      saturnWorkspaceName: defaultModalProps.workspace.workspace.name,
    };
    expect(runtimeFunc).toHaveBeenCalledWith(defaultModalProps.workspace.workspace.workspaceId, expect.anything());
    expect(createFunc).toHaveBeenCalledWith(
      {
        labels,
        disk: expect.objectContaining({
          labels,
          name: expect.anything(),
        }),
        machineSize: defaultAzureMachineType,
        autopauseThreshold: autopauseDisabledValue,
      },
      false
    );
  });

  it('renders default cost estimate', async () => {
    // Arrange
    const expectedComputeCost = 0.15;
    const expectedDiskCost = 0.2;

    asMockedFn(getAzureComputeCostEstimate).mockReturnValue(expectedComputeCost);
    asMockedFn(getAzureDiskCostEstimate).mockReturnValue(expectedDiskCost);

    // Act
    // wrapping component init-time stateful side-effects with act()
    await act(async () => {
      render(h(AzureComputeModalBase, defaultModalProps));
    });

    // Assert
    expect(screen.getAllByText(formatUSD(expectedComputeCost)).length).toBeTruthy(); // Currently stopped and running are the same cost.
    expect(screen.getByText(formatUSD(expectedDiskCost)));
  });

  it('renders updated cost estimate after change', async () => {
    // Arrange
    const initialComputeCost = 0.15;
    const expectedComputeCost = 0.3;
    const expectedDiskCost = 0.2;

    asMockedFn(getAzureComputeCostEstimate).mockImplementation((computeConfig) => {
      return computeConfig.machineType === defaultAzureMachineType ? initialComputeCost : expectedComputeCost;
    });

    asMockedFn(getAzureDiskCostEstimate).mockReturnValue(expectedDiskCost);

    const user = userEvent.setup();

    // Act
    // wrapping component init-time stateful side-effects with act()
    await act(async () => {
      render(h(AzureComputeModalBase, defaultModalProps));
    });

    expect(screen.getAllByText(formatUSD(initialComputeCost)).length).toBeTruthy(); // Verify initial value

    const selectCompute = screen.getByLabelText('Cloud compute profile');
    await user.click(selectCompute);
    const selectOption = await screen.getByText(_.keys(azureMachineTypes)[1], { exact: false });
    await user.click(selectOption);

    // Assert
    expect(screen.getAllByText(formatUSD(expectedComputeCost)).length).toBeTruthy(); // Currently stopped and running are the same cost.
    expect(screen.getByText(formatUSD(expectedDiskCost)));
  });

  // click delete environment on an existing [jupyter, rstudio] runtime with disk should bring up confirmation
  it('deletes environment with a confirmation for disk deletion for tool $tool.label', async () => {
    // Arrange
    const user = userEvent.setup();

    const disk = getDisk();
    const runtime = azureRuntime;
    (runtime.runtimeConfig as AzureConfig).persistentDiskId = disk.id;

    const runtimeFunc = jest.fn(() => ({
      details: () => runtime,
    }));
    asMockedFn(Ajax).mockReturnValue({
      ...defaultAjaxImpl,
      Runtimes: {
        runtimeV2: runtimeFunc as Partial<RuntimeAjaxContractV2>,
      } as Partial<RuntimeAjaxContractV2>,
    } as AjaxContract);

    // Act
    await act(async () => {
      render(
        h(AzureComputeModalBase, {
          ...defaultModalProps,
          currentDisk: disk,
          currentRuntime: runtime,
        })
      );
    });

    await user.click(screen.getByText('Delete Environment'));

    // Assert
    verifyEnabled(screen.getByText('Delete'));
    const radio1 = screen.getByLabelText('Keep persistent disk, delete application configuration and compute profile');
    expect(radio1).toBeChecked();
    const radio2 = screen.getByLabelText('Delete everything, including persistent disk');
    expect(radio2).not.toBeChecked();
  });

  it('deletes disk when there is no runtime present.', async () => {
    // Arrange
    const user = userEvent.setup();
    const disk = getDisk();

    const runtimeFunc = jest.fn(() => ({
      details: jest.fn(),
    }));
    asMockedFn(Ajax).mockReturnValue({
      ...defaultAjaxImpl,
      Runtimes: {
        runtime: runtimeFunc as Partial<RuntimeAjaxContractV2>,
      } as Partial<AjaxContract['Runtimes']>,
    } as AjaxContract);

    // Act
    await act(async () => {
      render(
        h(AzureComputeModalBase, {
          ...defaultModalProps,
          currentDisk: disk,
          currentRuntime: undefined,
        })
      );
    });

    await user.click(screen.getByText('Delete Persistent Disk'));

    // Assert
    const deleteConfirmationButton = screen.getByText('Delete');
    verifyEnabled(deleteConfirmationButton);
    const radio1 = screen.getByLabelText('Delete persistent disk');
    expect(radio1).toBeChecked();
    await user.click(deleteConfirmationButton);
    expect(leoDiskProvider.delete).toBeCalledTimes(1);
    expect(leoDiskProvider.delete).toBeCalledWith(disk);
  });

  it('toggles GPU on azure warning when GPU cloud compute profile is selected and unselected', async () => {
    // Arrange
    const user = userEvent.setup();

    render(h(AzureComputeModalBase, defaultModalProps));

    // Act
    const selectCompute = screen.getByLabelText('Cloud compute profile');
    await user.click(selectCompute);

    await user.click(screen.getByText(getMachineTypeLabel('Standard_NC6s_v3')));

    // Assert
    expect(screen.getByText('Learn more about enabling GPUs.')).toBeInTheDocument();

    // Act
    await user.click(selectCompute);
    await user.click(screen.getByText(getMachineTypeLabel('Standard_DS2_v2')));

    // Assert
    expect(screen.queryByText('Learn more about enabling GPUs.')).not.toBeInTheDocument();
  });

  describe('with resource limits', () => {
    beforeEach(() => {
      // Arrange
      asMockedFn(Billing).mockReturnValue(
        partial<BillingContract>({
          getBillingProfile: jest.fn().mockResolvedValue({
            ...azureBillingProfile,
            organization: {
              ...azureBillingProfile.organization,
              limits: {
                machinetypes: 'Standard_DS2_v2,Standard_DS3_v2',
                autopause: '30',
                persistentdisk: '32',
              },
            },
          }),
        })
      );
    });

    it('limits machine type options', async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      await act(async () => {
        render(h(AzureComputeModalBase, defaultModalProps));
      });

      // Assert
      const machineTypeSelect = new SelectHelper(screen.getByLabelText('Cloud compute profile'), user);
      const machineTypeOptions = await machineTypeSelect.getOptions();
      expect(machineTypeOptions).toEqual(['Standard_DS2_v2, 2 CPU(s), 7 GBs', 'Standard_DS3_v2, 4 CPU(s), 14 GBs']);
    });

    it('requires autopause', async () => {
      // Act
      await act(async () => {
        render(h(AzureComputeModalBase, defaultModalProps));
      });

      // Assert
      const autopauseCheckbox = screen.getByLabelText('Enable autopause');
      expect(autopauseCheckbox).toBeChecked();
      expect(autopauseCheckbox).toHaveAttribute('disabled');
    });

    it('limits max autopause', async () => {
      // Act
      await act(async () => {
        render(h(AzureComputeModalBase, defaultModalProps));
      });

      // Assert
      const autopauseInput = screen.getByLabelText('minutes of inactivity');
      expect(autopauseInput).toHaveAttribute('max', '30');
    });

    it('limits persistent disk size', async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      await act(async () => {
        render(h(AzureComputeModalBase, defaultModalProps));
      });

      // Assert
      const diskSizeSelect = new SelectHelper(screen.getByLabelText('Disk Size (GB)'), user);
      const diskSizeOptions = await diskSizeSelect.getOptions();
      expect(diskSizeOptions).toEqual(['32']);
    });
  });
});
