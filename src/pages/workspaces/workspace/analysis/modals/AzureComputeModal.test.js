import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash/fp';
import { act } from 'react-dom/test-utils';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { azureMachineTypes, defaultAzureMachineType } from 'src/libs/azure-utils';
import { formatUSD } from 'src/libs/utils';
import {
  azureRuntime,
  defaultAzureWorkspace,
  defaultTestDisk,
  getDisk,
  imageDocs,
  testAzureDefaultRegion,
} from 'src/pages/workspaces/workspace/analysis/_testData/testData';
import { getAzureComputeCostEstimate, getAzureDiskCostEstimate } from 'src/pages/workspaces/workspace/analysis/utils/cost-utils';
import { autopauseDisabledValue, defaultAutopauseThreshold } from 'src/pages/workspaces/workspace/analysis/utils/runtime-utils';
import { runtimeToolLabels, runtimeTools } from 'src/pages/workspaces/workspace/analysis/utils/tool-utils';
import { asMockedFn } from 'src/testing/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AzureComputeModalBase } from './AzureComputeModal';

vi.mock('src/pages/workspaces/workspace/analysis/utils/cost-utils');

vi.mock('src/libs/ajax');
vi.mock('src/libs/notifications', () => ({
  notify: vi.fn(),
}));
const onSuccess = vi.fn();
const defaultModalProps = {
  onSuccess,
  onDismiss: vi.fn(),
  onError: vi.fn(),
  currentRuntime: undefined,
  currentDisk: undefined,
  tool: runtimeToolLabels.JupyterLab,
  workspace: defaultAzureWorkspace,
  location: testAzureDefaultRegion,
};

const persistentDiskModalProps = {
  onSuccess,
  onDismiss: vi.fn(),
  onError: vi.fn(),
  currentRuntime: undefined,
  currentDisk: defaultTestDisk,
  tool: runtimeToolLabels.JupyterLab,
  workspace: defaultAzureWorkspace,
  location: testAzureDefaultRegion,
};

const defaultAjaxImpl = {
  Runtimes: {
    runtime: () => ({
      details: vi.fn(),
    }),
  },
  Buckets: { getObjectPreview: () => Promise.resolve({ json: () => Promise.resolve(imageDocs) }) },
  Disks: {
    disk: () => ({
      details: vi.fn(),
    }),
  },
  Metrics: {
    captureEvent: () => vi.fn(),
  },
};

const verifyEnabled = (item) => expect(item).not.toHaveAttribute('disabled');

describe('AzureComputeModal', () => {
  beforeAll(() => {});

  beforeEach(() => {
    // Arrange
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const getCreateButton = () => screen.getByText('Create');
  it('renders correctly with minimal state', async () => {
    // Arrange

    // Act
    // wrapping component init-time stateful side-effects with act()
    await act(async () => {
      await render(h(AzureComputeModalBase, defaultModalProps));
    });

    // Assert
    verifyEnabled(getCreateButton());
    screen.getByText('Azure Cloud Environment');
    const deleteButton = screen.queryByText('Delete Environment');
    expect(deleteButton).toBeNull();
  });

  it('sends the proper leo API call in default create case (no runtimes or disks)', async () => {
    // Arrange
    const createFunc = vi.fn();
    const runtimeFunc = vi.fn(() => ({
      create: createFunc,
      details: vi.fn(),
    }));
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtimeV2: runtimeFunc,
      },
    }));

    // Act
    // wrapping component init-time stateful side-effects with act()
    await act(async () => {
      await render(h(AzureComputeModalBase, defaultModalProps));
      await userEvent.click(getCreateButton());
    });

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
    const createFunc = vi.fn();
    const runtimeFunc = vi.fn(() => ({
      create: createFunc,
      details: vi.fn(),
    }));
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtimeV2: runtimeFunc,
      },
    }));

    // Act
    // wrapping component init-time stateful side-effects with act()
    await act(async () => {
      await render(h(AzureComputeModalBase, persistentDiskModalProps));
      await userEvent.click(getCreateButton());
    });

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

    const createFunc = vi.fn();
    const runtimeFunc = vi.fn(() => ({
      create: createFunc,
      details: vi.fn(),
    }));
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtimeV2: runtimeFunc,
      },
    }));

    // Act
    // wrapping component init-time stateful side-effects with act()
    await act(async () => {
      await render(h(AzureComputeModalBase, defaultModalProps));

      const numberInput = await screen.getByLabelText('minutes of inactivity');
      expect(numberInput).toBeInTheDocument();
      await user.type(numberInput, '0');
      expect(numberInput.value).toBe('300');

      await user.click(getCreateButton());
    });

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
    const createFunc = vi.fn();
    const runtimeFunc = vi.fn(() => ({
      create: createFunc,
      details: vi.fn(),
    }));
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtimeV2: runtimeFunc,
      },
    }));

    // Act
    // wrapping component init-time stateful side-effects with act()
    await act(async () => {
      await render(h(AzureComputeModalBase, defaultModalProps));

      const autopauseCheckbox = await screen.getByLabelText('Enable autopause');
      expect(autopauseCheckbox).toBeInTheDocument();
      await expect(autopauseCheckbox).toBeChecked();
      await fireEvent.click(autopauseCheckbox); // click to focus?
      await fireEvent.click(autopauseCheckbox);
      await expect(autopauseCheckbox).not.toBeChecked();
      const numberInput = await screen.getByLabelText('minutes of inactivity');
      await expect(numberInput).not.toBeVisible();

      await userEvent.click(getCreateButton());
    });

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
      await render(h(AzureComputeModalBase, defaultModalProps));
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
      await render(h(AzureComputeModalBase, defaultModalProps));
      expect(screen.getAllByText(formatUSD(initialComputeCost)).length).toBeTruthy(); // Verify initial value

      const selectCompute = screen.getByLabelText('Cloud compute profile');
      await user.click(selectCompute);
      const selectOption = await screen.getByText(_.keys(azureMachineTypes)[1], { exact: false });
      await user.click(selectOption);
    });

    // Assert
    expect(screen.getAllByText(formatUSD(expectedComputeCost)).length).toBeTruthy(); // Currently stopped and running are the same cost.
    expect(screen.getByText(formatUSD(expectedDiskCost)));
  });

  // click delete environment on an existing [jupyter, rstudio] runtime with disk should bring up confirmation
  it('deletes environment with a confirmation for disk deletion for tool $tool.label', async () => {
    // Arrange
    const disk = getDisk();
    const runtime = azureRuntime;
    runtime.runtimeConfig.persistentDiskId = disk.id;
    runtime.tool = runtimeTools.Jupyter;

    const runtimeFunc = vi.fn(() => ({
      details: () => runtime,
    }));
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtimeV2: runtimeFunc,
      },
      Disks: {
        disk: () => ({
          details: () => disk,
        }),
      },
    }));

    // Act
    await act(async () => {
      render(
        h(AzureComputeModalBase, {
          ...defaultModalProps,
          currentDisk: disk,
          currentRuntime: runtime,
        })
      );
      await userEvent.click(screen.getByText('Delete Environment'));
    });

    // Assert
    verifyEnabled(screen.getByText('Delete'));
    const radio1 = screen.getByLabelText('Keep persistent disk, delete application configuration and compute profile');
    expect(radio1).toBeChecked();
    const radio2 = screen.getByLabelText('Delete everything, including persistent disk');
    expect(radio2).not.toBeChecked();
  });

  it('deletes disk when there is no runtime present.', async () => {
    // Arrange
    const disk = getDisk();

    const runtimeFunc = vi.fn(() => ({
      details: () => null,
    }));
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtime: runtimeFunc,
      },
      Disks: {
        disk: () => ({
          details: () => disk,
        }),
      },
    }));

    // Act
    await act(async () => {
      render(
        h(AzureComputeModalBase, {
          ...defaultModalProps,
          currentDisk: disk,
          currentRuntime: null,
        })
      );
      await userEvent.click(screen.getByText('Delete Persistent Disk'));
    });

    // Assert
    verifyEnabled(screen.getByText('Delete'));
    const radio1 = screen.getByLabelText('Delete persistent disk');
    expect(radio1).toBeChecked();
  });
});
