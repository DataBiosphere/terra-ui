import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash/fp';
import { act } from 'react-dom/test-utils';
import { h } from 'react-hyperscript-helpers';
import { cloudServices } from 'src/data/gce-machines';
import { Ajax } from 'src/libs/ajax';
import { runtimeStatuses } from 'src/libs/ajax/leonardo/models/runtime-models';
import { formatUSD } from 'src/libs/utils';
import {
  defaultGoogleWorkspace,
  defaultImage,
  defaultRImage,
  defaultTestDisk,
  getDisk,
  getGoogleDataProcRuntime,
  getGoogleRuntime,
  getJupyterRuntimeConfig,
  hailImage,
  imageDocs,
  testDefaultLocation,
} from 'src/pages/workspaces/workspace/analysis/_testData/testData';
import { GcpComputeModalBase } from 'src/pages/workspaces/workspace/analysis/modals/ComputeModal/GcpComputeModal/GcpComputeModal';
import { getPersistentDiskCostMonthly, runtimeConfigBaseCost, runtimeConfigCost } from 'src/pages/workspaces/workspace/analysis/utils/cost-utils';
import {
  defaultDataprocMasterDiskSize,
  defaultDataprocWorkerDiskSize,
  defaultPersistentDiskType,
} from 'src/pages/workspaces/workspace/analysis/utils/disk-utils';
import {
  defaultDataprocMachineType,
  defaultGceMachineType,
  defaultGpuType,
  defaultNumDataprocPreemptibleWorkers,
  defaultNumDataprocWorkers,
  defaultNumGpus,
} from 'src/pages/workspaces/workspace/analysis/utils/runtime-utils';
import { runtimeToolLabels, runtimeTools } from 'src/pages/workspaces/workspace/analysis/utils/tool-utils';
import { asMockedFn } from 'src/testing/test-utils';

jest.mock('src/libs/notifications', () => ({
  notify: (...args) => {
    console.debug('######################### notify')/* eslint-disable-line */
    console.debug({ method: 'notify', args: [...args] })/* eslint-disable-line */
  },
}));

jest.mock('src/libs/ajax');
jest.mock('src/pages/workspaces/workspace/analysis/utils/cost-utils');
jest.mock('src/libs/config', () => ({
  getConfig: () => ({
    terraDeploymentEnv: 'unitTest',
  }),
}));

const onSuccess = jest.fn();
const defaultModalProps = {
  onSuccess,
  onDismiss: jest.fn(),
  onError: jest.fn(),
  currentRuntime: undefined,
  currentDisk: undefined,
  tool: runtimeToolLabels.Jupyter,
  workspace: defaultGoogleWorkspace,
  location: testDefaultLocation,
};

// TODO: test utils??
const verifyDisabled = (item) => expect(item).toHaveAttribute('disabled');
const verifyEnabled = (item) => expect(item).not.toHaveAttribute('disabled');

const defaultAjaxImpl = {
  Runtimes: {
    runtime: () => ({
      details: jest.fn(),
    }),
  },
  Buckets: { getObjectPreview: () => Promise.resolve({ json: () => Promise.resolve(imageDocs) }) },
  Disks: {
    disk: () => ({
      details: jest.fn(),
    }),
  },
  Metrics: {
    captureEvent: () => jest.fn(),
  },
};

describe('GcpComputeModal', () => {
  beforeAll(() => {});

  beforeEach(() => {
    // Arrange
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const getCreateButton = () => screen.getByText('Create');

  it('renders correctly with minimal state', async () => {
    // Arrange

    // Act
    await act(async () => await render(h(GcpComputeModalBase, defaultModalProps)));

    // Assert
    verifyEnabled(getCreateButton());
    screen.getByText('Jupyter Cloud Environment');
  });

  it('passes the TERRA_DEPLOYMENT_ENV env var through to the notebook through custom env vars', async () => {
    // Arrange
    const createFunc = jest.fn();
    const runtimeFunc = jest.fn(() => ({
      create: createFunc,
      details: jest.fn(),
    }));
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtime: runtimeFunc,
      },
    }));

    // Act
    await act(async () => {
      await render(h(GcpComputeModalBase, defaultModalProps));
      await userEvent.click(getCreateButton());
    });

    // Assert
    expect(runtimeFunc).toHaveBeenCalledWith(defaultModalProps.workspace.workspace.googleProject, expect.anything());
    expect(createFunc).toHaveBeenCalledWith(
      expect.objectContaining({
        customEnvironmentVariables: expect.objectContaining({
          TERRA_DEPLOYMENT_ENV: 'unitTest',
        }),
      })
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it('sends the proper leo API call in default create case (no runtimes or disks)', async () => {
    // Arrange
    const createFunc = jest.fn();
    const runtimeFunc = jest.fn(() => ({
      create: createFunc,
      details: jest.fn(),
    }));
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtime: runtimeFunc,
      },
    }));

    // Act
    await act(async () => {
      await render(h(GcpComputeModalBase, defaultModalProps));
      await userEvent.click(getCreateButton());
    });

    // Assert
    const labels = {
      saturnWorkspaceNamespace: defaultModalProps.workspace.workspace.namespace,
      saturnWorkspaceName: defaultModalProps.workspace.workspace.name,
    };
    expect(runtimeFunc).toHaveBeenCalledWith(defaultModalProps.workspace.workspace.googleProject, expect.anything());
    expect(createFunc).toHaveBeenCalledWith(
      expect.objectContaining({
        labels,
        runtimeConfig: expect.objectContaining({
          cloudService: cloudServices.GCE,
          machineType: defaultGceMachineType,
          persistentDisk: expect.objectContaining({
            diskType: defaultPersistentDiskType.value,
            labels,
            name: expect.anything(),
          }),
        }),
        toolDockerImage: defaultImage.image,
      })
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  // create button with disk but no runtime
  it('sends the proper API call in create case with an existing disk but no runtime', async () => {
    // Arrange
    // put value into local var so its easier to refactor
    const disk = defaultTestDisk;
    const createFunc = jest.fn();
    const runtimeFunc = jest.fn(() => ({
      create: createFunc,
      details: jest.fn(),
    }));
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtime: runtimeFunc,
      },
      Disks: {
        disksV1: () => ({
          disk: () => ({
            details: () => disk,
          }),
        }),
      },
    }));

    // Act
    await act(async () => {
      await render(
        h(GcpComputeModalBase, {
          ...defaultModalProps,
          currentDisk: disk,
        })
      );
      await userEvent.click(getCreateButton());
    });

    // Assert
    expect(runtimeFunc).toHaveBeenCalledWith(defaultGoogleWorkspace.workspace.googleProject, expect.anything());
    expect(createFunc).toHaveBeenCalledWith(
      expect.objectContaining({
        runtimeConfig: expect.objectContaining({
          persistentDisk: { name: disk.name },
        }),
      })
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  // with a [jupyter, rstudio] runtime existing and, details pane is open
  it.each([{ runtimeTool: runtimeTools.Jupyter }, { runtimeTool: runtimeTools.RStudio }])(
    'opens runtime details pane with a $runtimeTool.label runtime and a disk existing',
    async ({ runtimeTool }) => {
      // Arrange
      const disk = getDisk();
      const machine = { name: 'n1-standard-4', cpu: 4, memory: 15 };
      const runtimeProps = { tool: runtimeTool, runtimeConfig: getJupyterRuntimeConfig({ diskId: disk.id, machineType: machine.name }) };
      const runtime = getGoogleRuntime(runtimeProps);

      const runtimeFunc = jest.fn(() => ({
        create: jest.fn(),
        details: () => runtime,
      }));
      Ajax.mockImplementation(() => ({
        ...defaultAjaxImpl,
        Runtimes: {
          runtime: runtimeFunc,
        },
        Disks: {
          disksV1: () => ({
            disk: () => ({
              details: () => disk,
            }),
          }),
        },
      }));

      // Act
      await act(async () => {
        await render(
          h(GcpComputeModalBase, {
            ...defaultModalProps,
            currentDisk: disk,
            currentRuntime: runtime,
            tool: runtimeTool.label,
          })
        );
      });

      // Assert
      screen.getByText(`${runtimeTool.label} Cloud Environment`);

      const toolImage = _.find({ imageType: runtimeTool.label }, runtime.runtimeImages);
      const selectText = _.find({ image: toolImage.imageUrl }, imageDocs).label;
      screen.getByText(selectText);

      screen.getByText(machine.cpu);
      screen.getByText(machine.memory);

      verifyDisabled(screen.getByLabelText('Disk Type'));
      verifyDisabled(screen.getByLabelText('Location'));
      screen.getByDisplayValue(disk.size);

      verifyEnabled(screen.getByText('Delete Environment'));
      verifyEnabled(screen.getByText('Update'));
    }
  );

  it.each([{ status: runtimeStatuses.running }, { status: runtimeStatuses.starting }])(
    'lets the user update a runtime only in an appropriate status ($status.label, $status.canChangeCompute)',
    async ({ status }) => {
      // Arrange
      const disk = getDisk();
      const runtimeProps = { status: status.leoLabel, runtimeConfig: getJupyterRuntimeConfig({ diskId: disk.id }) };
      const runtime = getGoogleRuntime(runtimeProps);

      const runtimeFunc = jest.fn(() => ({
        details: () => runtime,
      }));
      Ajax.mockImplementation(() => ({
        ...defaultAjaxImpl,
        Runtimes: {
          runtime: runtimeFunc,
        },
        Disks: {
          disksV1: () => ({
            disk: () => ({
              details: () => disk,
            }),
          }),
        },
      }));

      // Act
      await act(async () => {
        await render(
          h(GcpComputeModalBase, {
            ...defaultModalProps,
            currentDisk: disk,
            currentRuntime: runtime,
          })
        );
      });

      // Assert
      if (status.canChangeCompute) {
        verifyEnabled(screen.getByText('Update'));
      } else {
        verifyDisabled(screen.getByText('Update'));
      }
    }
  );

  // click delete environment on an existing [jupyter, rstudio] runtime with disk should bring up confirmation
  it.each([{ tool: runtimeTools.Jupyter }, { tool: runtimeTools.RStudio }])(
    'deletes environment with a confirmation for disk deletion for tool $tool.label',
    async ({ tool }) => {
      // Arrange
      const disk = getDisk();
      const runtimeProps = { runtimeConfig: getJupyterRuntimeConfig({ diskId: disk.id, tool }) };
      const runtime = getGoogleRuntime(runtimeProps);

      const runtimeFunc = jest.fn(() => ({
        details: () => runtime,
      }));
      Ajax.mockImplementation(() => ({
        ...defaultAjaxImpl,
        Runtimes: {
          runtime: runtimeFunc,
        },
        Disks: {
          disksV1: () => ({
            disk: () => ({
              details: () => disk,
            }),
          }),
        },
      }));

      // Act
      await act(async () => {
        render(
          h(GcpComputeModalBase, {
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
    }
  );

  // click delete environment on an existing [jupyter, rstudio] runtime with disk should delete
  it.each([{ tool: runtimeTools.Jupyter }, { tool: runtimeTools.RStudio }])(
    'clicking through delete confirmation and then delete should call delete for tool $tool.label',
    async ({ tool }) => {
      // Arrange
      const disk = getDisk();
      const runtimeProps = { runtimeConfig: getJupyterRuntimeConfig({ diskId: disk.id, tool }) };
      const runtime = getGoogleRuntime(runtimeProps);

      const deleteFunc = jest.fn();

      const runtimeFunc = jest.fn(() => ({
        details: () => runtime,
        delete: deleteFunc,
      }));
      Ajax.mockImplementation(() => ({
        ...defaultAjaxImpl,
        Runtimes: {
          runtime: runtimeFunc,
        },
        Disks: {
          disksV1: () => ({
            disk: () => ({
              details: () => disk,
            }),
          }),
        },
      }));

      // Act
      await act(async () => {
        render(
          h(GcpComputeModalBase, {
            ...defaultModalProps,
            currentDisk: disk,
            currentRuntime: runtime,
          })
        );
        await userEvent.click(screen.getByText('Delete Environment'));
        await userEvent.click(screen.getByText('Delete'));
      });

      // Assert
      expect(runtimeFunc).toHaveBeenCalledWith(defaultModalProps.workspace.workspace.googleProject, expect.anything());
      expect(deleteFunc).toHaveBeenCalled();
    }
  );
  // click update with downtime (and keep pd)
  it.each([{ tool: runtimeTools.Jupyter }, { tool: runtimeTools.RStudio }])(
    'updating a runtime after changing a field that requires downtime should call update for tool $tool.label',
    async ({ tool }) => {
      // Arrange
      const disk = getDisk();
      const runtimeProps = { runtimeConfig: getJupyterRuntimeConfig({ diskId: disk.id, tool }) };
      const runtime = getGoogleRuntime(runtimeProps);

      const updateFunc = jest.fn();

      const runtimeFunc = jest.fn(() => ({
        details: () => runtime,
        update: updateFunc,
      }));
      Ajax.mockImplementation(() => ({
        ...defaultAjaxImpl,
        Runtimes: {
          runtime: runtimeFunc,
        },
        Disks: {
          disksV1: () => ({
            disk: () => ({
              details: () => disk,
            }),
          }),
        },
      }));

      // Act
      await act(async () => {
        await render(
          h(GcpComputeModalBase, {
            ...defaultModalProps,
            currentDisk: disk,
            currentRuntime: runtime,
          })
        );

        await userEvent.click(screen.getByLabelText('CPUs'));
        const selectOption = await screen.findByText('2');
        await userEvent.click(selectOption);
        const nextButton = await screen.findByText('Next');
        await userEvent.click(nextButton);
      });

      // Assert
      await screen.findByText('Downtime required');

      // Act
      await act(async () => {
        const updateButton = await screen.findByText('Update');
        await userEvent.click(updateButton);
      });

      // Assert
      expect(runtimeFunc).toHaveBeenCalledWith(defaultModalProps.workspace.workspace.googleProject, expect.anything());
      expect(updateFunc).toHaveBeenCalledWith(
        expect.objectContaining({
          runtimeConfig: {
            cloudService: 'GCE',
            machineType: 'n1-standard-2',
            zone: 'us-central1-a',
          },
        })
      );
    }
  );

  // TODO: this is a bug that this doesn't work... needs more investigation
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
  //     await render(h(GcpComputeModalBase, {
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
  //     await render(h(GcpComputeModalBase, {
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

  it('should create dataproc spark cluster successfully', async () => {
    // Arrange
    const createFunc = jest.fn();
    const runtimeFunc = jest.fn(() => ({
      create: createFunc,
      details: jest.fn(),
    }));
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtime: runtimeFunc,
      },
      Disks: {
        disk: () => ({
          details: jest.fn(),
        }),
      },
    }));

    // Act
    await act(async () => {
      await render(h(GcpComputeModalBase, defaultModalProps));

      const selectMenu = await screen.getByLabelText('Application configuration');
      await userEvent.click(selectMenu);
      const selectOption = await screen.findByText(hailImage.label);
      await userEvent.click(selectOption);

      const computeTypeSelect = await screen.getByLabelText('Compute type');
      await userEvent.click(computeTypeSelect);
      const sparkClusterOption = await screen.findByText('Spark cluster');
      await userEvent.click(sparkClusterOption);

      const create = await screen.getByText('Create');
      await userEvent.click(create);
    });

    expect(runtimeFunc).toHaveBeenCalledWith(defaultModalProps.workspace.workspace.googleProject, expect.anything());
    expect(createFunc).toHaveBeenCalledWith(
      expect.objectContaining({
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
          componentGatewayEnabled: true,
        }),
      })
    );
  });

  it('should create dataproc spark single node successfully', async () => {
    // Arrange
    const createFunc = jest.fn();
    const runtimeFunc = jest.fn(() => ({
      create: createFunc,
      details: jest.fn(),
    }));
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtime: runtimeFunc,
      },
      Disks: {
        disk: () => ({
          details: jest.fn(),
        }),
      },
    }));

    // Act
    await act(async () => {
      await render(h(GcpComputeModalBase, defaultModalProps));

      const selectMenu = await screen.getByLabelText('Application configuration');
      await userEvent.click(selectMenu);
      const selectOption = await screen.findByText(hailImage.label);
      await userEvent.click(selectOption);

      const computeTypeSelect = await screen.getByLabelText('Compute type');
      await userEvent.click(computeTypeSelect);

      const sparkSingleNodeOption = await screen.findByText('Spark single node')[0];
      await userEvent.click(sparkSingleNodeOption);

      const create = await screen.getByText('Create');
      await userEvent.click(create);
    });

    expect(runtimeFunc).toHaveBeenCalledWith(defaultModalProps.workspace.workspace.googleProject, expect.anything());

    expect(createFunc).toHaveBeenCalledWith(
      expect.objectContaining({
        toolDockerImage: hailImage.image,
        runtimeConfig: expect.objectContaining({
          numberOfWorkers: 0,
          masterMachineType: defaultDataprocMachineType,
          masterDiskSize: defaultDataprocMasterDiskSize,
          cloudService: 'DATAPROC',
          region: 'us-central1',
          componentGatewayEnabled: true,
        }),
      })
    );
  });

  it('should delete spark single node successfully', async () => {
    // Arrange
    const runtimeProps = {
      runtimeConfig: getJupyterRuntimeConfig({
        diskId: undefined,
        tool: runtimeTools.Jupyter,
      }),
    };
    const runtime = getGoogleDataProcRuntime(runtimeProps);

    const deleteFunc = jest.fn();

    const runtimeFunc = jest.fn(() => ({
      details: () => runtime,
      delete: deleteFunc,
    }));
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtime: runtimeFunc,
      },
      Disks: {
        disksV1: () => ({
          disk: () => ({
            details: () => undefined,
          }),
        }),
      },
    }));

    // Act
    await act(async () => {
      await render(
        h(GcpComputeModalBase, {
          ...defaultModalProps,
          currentDisk: undefined,
          currentRuntime: runtime,
        })
      );
      await userEvent.click(screen.getByText('Delete Runtime'));
      await userEvent.click(screen.getByText('Delete'));
    });

    // Assert
    expect(runtimeFunc).toHaveBeenCalledWith(defaultModalProps.workspace.workspace.googleProject, expect.anything());
    expect(deleteFunc).toHaveBeenCalled();
  });

  // with a [jupyter, rstudio] runtime existing and [a disk, no disk], details pane is open
  it('dataproc runtime should display properly in modal', async () => {
    // Arrange
    const machine1 = { name: 'n1-standard-2', cpu: 2, memory: 7.5 };
    const machine2 = { name: 'n1-standard-4', cpu: 4, memory: 15 };
    const runtimeProps = {
      image: hailImage.image,
      status: runtimeStatuses.stopped.leoLabel,
      runtimeConfig: {
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
        workerPrivateAccess: false,
      },
    };
    const runtime = getGoogleRuntime(runtimeProps);

    const runtimeFunc = jest.fn(() => ({
      create: jest.fn(),
      details: () => runtime,
    }));
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtime: runtimeFunc,
      },
      Disks: {
        disk: () => ({
          details: jest.fn(),
        }),
      },
    }));

    // Act
    await act(async () => {
      await render(
        h(GcpComputeModalBase, {
          ...defaultModalProps,
          currentRuntime: runtime,
        })
      );
    });

    // Assert
    screen.getByText(`${runtimeToolLabels.Jupyter} Cloud Environment`);

    const selectText = hailImage.label;
    screen.getByText(selectText);

    screen.getByText(machine1.cpu);
    screen.getByText(machine1.memory);
    screen.getByText('Spark cluster');

    verifyDisabled(screen.getByLabelText('Workers'));
    verifyDisabled(screen.getByLabelText('Location'));

    const inputs = screen.getAllByLabelText('Disk size (GB)');
    expect(inputs.length).toBe(2);
    expect(inputs[1]).toHaveDisplayValue(150);
    expect(inputs[0]).toHaveDisplayValue(151);

    screen.getByText(machine2.cpu);
    screen.getByText(machine2.memory);

    verifyEnabled(screen.getByText('Delete Runtime'));
    screen.getByText('Update');
  });

  // spark cluster (pass a dataproc runtime and ensure it loads correctly) (
  it('creates a dataproc runtime', async () => {
    // Arrange
    const createFunc = jest.fn();
    const runtimeFunc = jest.fn(() => ({
      create: createFunc,
      details: jest.fn(),
    }));
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtime: runtimeFunc,
      },
      Disks: {
        disk: () => ({
          details: jest.fn(),
        }),
      },
    }));

    // Act
    await act(async () => {
      await render(h(GcpComputeModalBase, defaultModalProps));

      const selectMenu = await screen.getByLabelText('Application configuration');
      await userEvent.click(selectMenu);
      const selectOption = await screen.findByText(hailImage.label);
      await userEvent.click(selectOption);
      const computeTypeSelect = await screen.getByLabelText('Compute type');
      await userEvent.click(computeTypeSelect);
      const sparkClusterOption = await screen.findByText('Spark cluster');
      await userEvent.click(sparkClusterOption);

      const create = await screen.getByText('Create');
      await userEvent.click(create);
    });

    expect(runtimeFunc).toHaveBeenCalledWith(defaultModalProps.workspace.workspace.googleProject, expect.anything());
    expect(createFunc).toHaveBeenCalledWith(
      expect.objectContaining({
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
          componentGatewayEnabled: true,
        }),
      })
    );
  });

  // custom on image select with a [valid, invalid] custom image should function
  it.each([{ tool: runtimeTools.Jupyter }, { tool: runtimeTools.RStudio }])(
    'custom Environment pane should behave correctly with an invalid image URI',
    async ({ tool }) => {
      // Arrange
      const createFunc = jest.fn();
      const disk = getDisk();
      const runtimeProps = { runtimeConfig: getJupyterRuntimeConfig({ diskId: disk.id, tool }) };
      const runtime = getGoogleRuntime(runtimeProps);

      const runtimeFunc = jest.fn(() => ({
        details: () => runtime,
        create: createFunc,
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

      // Act and assert
      await act(async () => {
        await render(h(GcpComputeModalBase, defaultModalProps));

        const selectMenu = await screen.getByLabelText('Application configuration');
        await userEvent.click(selectMenu);
        const selectOption = await screen.findByText('Custom Environment');
        await userEvent.click(selectOption);

        const imageInput = await screen.getByLabelText('Container image');
        expect(imageInput).toBeInTheDocument();
        const invalidImageUri = 'b';
        await userEvent.type(imageInput, invalidImageUri);

        const nextButton = await screen.findByText('Next');

        verifyDisabled(nextButton);
      });
    }
  );

  // custom on image select with a [valid, invalid] custom image should function
  it.each([{ tool: runtimeTools.Jupyter }, { tool: runtimeTools.RStudio }])(
    'custom Environment pane should work with a valid image URI ',
    async ({ tool }) => {
      // Arrange
      const createFunc = jest.fn();
      const disk = getDisk();
      const runtimeProps = { runtimeConfig: getJupyterRuntimeConfig({ diskId: disk.id, tool }) };
      const runtime = getGoogleRuntime(runtimeProps);

      const runtimeFunc = jest.fn(() => ({
        details: () => runtime,
        create: createFunc,
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

      // Act and assert
      await act(async () => {
        await render(h(GcpComputeModalBase, defaultModalProps));

        const selectMenu = await screen.getByLabelText('Application configuration');
        await userEvent.click(selectMenu);
        const selectOption = await screen.findByText('Custom Environment');
        await userEvent.click(selectOption);

        const imageInput = await screen.getByLabelText('Container image');
        expect(imageInput).toBeInTheDocument();
        const customImageUri = 'us';
        await fireEvent.change(imageInput, { target: { value: customImageUri } });

        await screen.findByText('Creation Timeout Limit');

        const nextButton = await screen.findByText('Next');
        verifyEnabled(nextButton);
        await userEvent.click(nextButton);
        const unverifiedDockerWarningHeader = await screen.findByText('Unverified Docker image');

        expect(unverifiedDockerWarningHeader).toBeInTheDocument();
        const createButton = await screen.findByText('Create');
        await userEvent.click(createButton);
        expect(runtimeFunc).toHaveBeenCalledWith(defaultModalProps.workspace.workspace.googleProject, expect.anything());
        expect(createFunc).toHaveBeenCalledWith(
          expect.objectContaining({
            toolDockerImage: customImageUri,
          })
        );
      });
    }
  );

  // click learn more about persistent disk
  it('should render learn more about persistent disks', async () => {
    // Act
    render(h(GcpComputeModalBase, defaultModalProps));
    const link = screen.getByText('Learn more about persistent disks and where your disk is mounted.');
    await userEvent.click(link);

    // Assert
    screen.getByText('About persistent disk');
    screen.getByText(/Your persistent disk is mounted in the directory/);
  });

  it.each([{ tool: runtimeTools.Jupyter }, { tool: runtimeTools.RStudio }])(
    'should check successfully that the disk type is clickable',
    async ({ tool }) => {
      // arrange
      const runtimeProps = { runtimeConfig: getJupyterRuntimeConfig({ tool }) };
      const runtime = getGoogleRuntime(runtimeProps);

      // Act
      await act(async () => {
        await render(
          h(GcpComputeModalBase, {
            ...defaultModalProps,
            currentRuntime: runtime,
          })
        );
      });

      // Assert
      const diskTypeDropdown = screen.getByLabelText('Disk Type');
      await userEvent.click(diskTypeDropdown);
    }
  );

  it('should render whats installed on this environment', async () => {
    // Act
    await act(async () => {
      await render(h(GcpComputeModalBase, defaultModalProps));
      const link = await screen.getByText('What’s installed on this environment?');
      await userEvent.click(link);
    });

    // Assert
    screen.getByText('Installed packages');
    screen.getByText(defaultImage.label);
    screen.getByText('Language:');
  });

  // GPUs should function properly
  it.each([{ tool: runtimeTools.Jupyter }, { tool: runtimeTools.RStudio }])('creates a runtime with GPUs for $tool', async ({ tool }) => {
    // Arrange
    const createFunc = jest.fn();
    const runtimeFunc = jest.fn(() => ({
      create: createFunc,
      details: jest.fn(),
    }));
    Ajax.mockImplementation(() => ({
      ...defaultAjaxImpl,
      Runtimes: {
        runtime: runtimeFunc,
      },
    }));
    // Act
    await act(async () => {
      await render(
        h(GcpComputeModalBase, {
          ...defaultModalProps,
          tool,
        })
      );
      const enableGPU = await screen.getByText('Enable GPUs');
      await userEvent.click(enableGPU);
    });

    // Assert
    screen.getByText('GPU type');
    screen.getByText('GPUs');

    // Act
    await act(async () => {
      const create = screen.getByText('Create');
      await userEvent.click(create);
    });

    // Assert
    expect(createFunc).toHaveBeenCalledWith(
      expect.objectContaining({
        runtimeConfig: expect.objectContaining({
          gpuConfig: { gpuType: defaultGpuType, numOfGpus: defaultNumGpus },
        }),
      })
    );
  });

  // click learn more about persistent disk
  it.each([
    { tool: runtimeTools.Jupyter, expectedLabel: '/home/jupyter' },
    { tool: runtimeTools.RStudio, expectedLabel: '/home/rstudio' },
  ])('should render learn more about persistent disks', async ({ tool, expectedLabel }) => {
    // Arrange
    const disk = getDisk();
    const runtimeProps = { runtimeConfig: getJupyterRuntimeConfig({ diskId: disk.id, tool }) };
    const runtime = getGoogleRuntime(runtimeProps);
    // Act
    // HACK: await not necessary here
    // eslint-disable-next-line require-await
    await act(async () => {
      render(
        h(GcpComputeModalBase, {
          ...defaultModalProps,
          currentDisk: disk,
          currentRuntime: runtime,
          tool,
        })
      );
    });

    // Assert
    const link = screen.getByText('Learn more about persistent disks and where your disk is mounted.');
    await userEvent.click(link);
    screen.getByText('About persistent disk');
    screen.getByText(expectedLabel);
  });

  it('correctly renders and updates timeoutInMinutes', async () => {
    await act(async () => {
      // Arrange
      const createFunc = jest.fn();
      const runtimeFunc = jest.fn(() => ({
        create: createFunc,
        details: jest.fn(),
      }));
      Ajax.mockImplementation(() => ({
        ...defaultAjaxImpl,
        Runtimes: {
          runtime: runtimeFunc,
        },
      }));
      await render(h(GcpComputeModalBase, defaultModalProps));

      // Act
      const selectMenu = await screen.getByLabelText('Application configuration');
      await userEvent.click(selectMenu);
      const selectOption = await screen.findByText(/Legacy GATK:/);
      await userEvent.click(selectOption);

      await screen.findByText('Creation Timeout Limit');
      const timeoutInput = await screen.getByLabelText('Creation Timeout Limit');
      await fireEvent.change(timeoutInput, { target: { value: 20 } });

      // Assert
      expect(timeoutInput.value).toBe('20');

      // Act
      await userEvent.click(selectMenu);
      const selectOption2 = await screen.findByText(defaultImage.label);
      await userEvent.click(selectOption2);
      // Assert
      expect(timeoutInput).not.toBeVisible();
    });
  });

  it.each([{ runtimeTool: runtimeTools.Jupyter }, { runtimeTool: runtimeTools.RStudio }])(
    'correctly sends timeoutInMinutes to create for tool $runtimeTool.label',
    async ({ runtimeTool }) => {
      await act(async () => {
        // Arrange
        const createFunc = jest.fn();
        const runtimeFunc = jest.fn(() => ({
          create: createFunc,
          details: jest.fn(),
        }));
        Ajax.mockImplementation(() => ({
          ...defaultAjaxImpl,
          Runtimes: {
            runtime: runtimeFunc,
          },
        }));

        // Act
        await act(async () => {
          await render(h(GcpComputeModalBase, { ...defaultModalProps, tool: runtimeTool.label }));

          const selectMenu = await screen.getByLabelText('Application configuration');
          await userEvent.click(selectMenu);
          const customImageSelect = await screen.findByText('Custom Environment');
          await userEvent.click(customImageSelect);

          await screen.findByText('Creation Timeout Limit');
          const timeoutInput = await screen.getByLabelText('Creation Timeout Limit');

          const imageInput = await screen.getByLabelText('Container image');
          expect(imageInput).toBeInTheDocument();
          const customImageUri = 'us';
          await fireEvent.change(imageInput, { target: { value: customImageUri } });

          await fireEvent.change(timeoutInput, { target: { value: 20 } });
          await userEvent.click(selectMenu);
        });

        // Act
        await act(async () => {
          const nextButton = await screen.findByText('Next');
          verifyEnabled(nextButton);
          await userEvent.click(nextButton);
          const unverifiedDockerWarningHeader = await screen.findByText('Unverified Docker image');

          expect(unverifiedDockerWarningHeader).toBeInTheDocument();
          const createButton = await screen.findByText('Create');
          await userEvent.click(createButton);
        });

        // Assert
        expect(createFunc).toHaveBeenCalledWith(
          expect.objectContaining({
            timeoutInMinutes: 20,
          })
        );
      });
    }
  );

  it.each([
    { runtimeTool: runtimeTools.Jupyter, imageLabel: defaultImage.label },
    { runtimeTool: runtimeTools.RStudio, imageLabel: defaultRImage.label },
  ])('sends null timeout in minutes  for tool $runtimeTool.label after setting and clearing the field', async ({ runtimeTool, imageLabel }) => {
    await act(async () => {
      // Arrange
      const createFunc = jest.fn();
      const runtimeFunc = jest.fn(() => ({
        create: createFunc,
        details: jest.fn(),
      }));
      Ajax.mockImplementation(() => ({
        ...defaultAjaxImpl,
        Runtimes: {
          runtime: runtimeFunc,
        },
      }));

      // Act
      await act(async () => {
        await render(h(GcpComputeModalBase, { ...defaultModalProps, tool: runtimeTool.label }));

        const selectMenu = await screen.getByLabelText('Application configuration');
        await userEvent.click(selectMenu);
        const customImageSelect = await screen.findByText('Custom Environment');
        await userEvent.click(customImageSelect);

        await screen.findByText('Creation Timeout Limit');
        const timeoutInput = await screen.getByLabelText('Creation Timeout Limit');
        // Set the field to an arbitrary value
        await fireEvent.change(timeoutInput, { target: { value: 20 } });
        await userEvent.click(selectMenu);
        const supportedImageSelect = await screen.findByText(imageLabel);
        // Clear timeoutInput by selecting
        await userEvent.click(supportedImageSelect);
      });

      // Act
      await act(async () => {
        const create = screen.getByText('Create');
        await userEvent.click(create);
      });

      // Assert
      expect(createFunc).toHaveBeenCalledWith(
        expect.objectContaining({
          // Verify that timeoutInMinutes is actually cleared by selecting
          // a supported image.
          timeoutInMinutes: null,
        })
      );
    });
  });

  it('renders default cost estimate', async () => {
    // Arrange
    const expectedRuntimeConfigCost = 0.4;
    const expectedRuntimeConfigBaseCost = 0.15;
    const expectedPersistentDiskCostMonthly = 0.2;

    asMockedFn(runtimeConfigCost).mockReturnValue(expectedRuntimeConfigCost);
    asMockedFn(runtimeConfigBaseCost).mockReturnValue(expectedRuntimeConfigBaseCost);
    asMockedFn(getPersistentDiskCostMonthly).mockReturnValue(expectedPersistentDiskCostMonthly);

    // Act
    await act(async () => {
      await render(h(GcpComputeModalBase, defaultModalProps));
    });

    // Assert
    expect(screen.getByText(formatUSD(expectedRuntimeConfigCost)));
    expect(screen.getByText(formatUSD(expectedRuntimeConfigBaseCost)));
    expect(screen.getByText(formatUSD(expectedPersistentDiskCostMonthly)));
  });
});
