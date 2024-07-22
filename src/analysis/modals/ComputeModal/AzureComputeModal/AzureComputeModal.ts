import _ from 'lodash/fp';
import { Fragment, ReactNode, useEffect, useState } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import { AboutPersistentDiskView } from 'src/analysis/modals/ComputeModal/AboutPersistentDiskView';
import { AutopauseConfiguration } from 'src/analysis/modals/ComputeModal/AutopauseConfiguration';
import { AzureApplicationConfigurationSection } from 'src/analysis/modals/ComputeModal/AzureComputeModal/AzureApplicationConfigurationSection';
import { AzureComputeProfileSelect } from 'src/analysis/modals/ComputeModal/AzureComputeModal/AzureComputeProfileSelect';
import { AzurePersistentDiskSection } from 'src/analysis/modals/ComputeModal/AzureComputeModal/AzurePersistentDiskSection';
import { azureDiskSizes } from 'src/analysis/modals/ComputeModal/AzureComputeModal/AzurePersistentDiskSizeSelectInput';
import { DeleteEnvironment } from 'src/analysis/modals/DeleteEnvironment';
import { computeStyles } from 'src/analysis/modals/modalStyles';
import { getAzureComputeCostEstimate, getAzureDiskCostEstimate } from 'src/analysis/utils/cost-utils';
import { generatePersistentDiskName } from 'src/analysis/utils/disk-utils';
import {
  autopauseDisabledValue,
  defaultAutopauseThreshold,
  generateRuntimeName,
  getIsRuntimeBusy,
} from 'src/analysis/utils/runtime-utils';
import { isRuntimeToolLabel, runtimeToolLabels, ToolLabel } from 'src/analysis/utils/tool-utils';
import { useWorkspaceBillingProfile } from 'src/billing/useWorkspaceBillingProfile';
import { getResourceLimits } from 'src/billing-core/resource-limits';
import { ButtonOutline, ButtonPrimary, Side, spinnerOverlay } from 'src/components/common';
import { withModalDrawer } from 'src/components/ModalDrawer';
import TitleBar from 'src/components/TitleBar';
import { Ajax } from 'src/libs/ajax';
import { isAzureConfig, isAzureDiskType } from 'src/libs/ajax/leonardo/models/runtime-config-models';
import { Runtime } from 'src/libs/ajax/leonardo/models/runtime-models';
import { leoDiskProvider, PersistentDiskDetail } from 'src/libs/ajax/leonardo/providers/LeoDiskProvider';
import {
  azureMachineTypes,
  defaultAzureComputeConfig,
  defaultAzureDiskSize,
  defaultAzureMachineType,
  defaultAzurePersistentDiskType,
  defaultAzureRegion,
  machineTypeHasGpu,
} from 'src/libs/azure-utils';
import colors from 'src/libs/colors';
import { withErrorReportingInModal } from 'src/libs/error';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import * as Utils from 'src/libs/utils';
import { BaseWorkspace, cloudProviderTypes } from 'src/workspaces/utils';

const titleId = 'azure-compute-modal-title';

const minAutopause = 10;

export type viewModeTypes = 'deleteEnvironment' | 'aboutPersistentDisk' | 'baseViewMode';

export interface AzureComputeModalBaseProps {
  readonly onDismiss: () => void;
  readonly onSuccess: (string?: string) => void;
  readonly onError: () => void;
  readonly workspace: BaseWorkspace;
  readonly currentRuntime?: Runtime;
  readonly currentDisk?: PersistentDiskDetail;
  readonly isLoadingCloudEnvironments: boolean;
  readonly location: string;
  readonly tool?: ToolLabel;
  readonly hideCloseButton: boolean;
}

export const AzureComputeModalBase = (props: AzureComputeModalBaseProps): ReactNode => {
  const {
    onDismiss,
    onSuccess,
    onError,
    workspace,
    currentRuntime,
    currentDisk,
    isLoadingCloudEnvironments,
    location,
    tool,
    hideCloseButton = false,
  } = props;
  const [_loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<viewModeTypes>(undefined);
  const [currentRuntimeDetails, setCurrentRuntimeDetails] = useState(currentRuntime);
  const [currentPersistentDiskDetails] = useState(currentDisk);
  const [computeConfig, setComputeConfig] = useState(defaultAzureComputeConfig);
  const updateComputeConfig = (key, value) => setComputeConfig({ ...computeConfig, [key]: value });
  const { namespace, name: workspaceName, workspaceId } = workspace.workspace;
  const persistentDiskExists = !!currentPersistentDiskDetails;
  const [deleteDiskSelected, setDeleteDiskSelected] = useState(false);
  const billingProfile = useWorkspaceBillingProfile(workspaceId);
  const resourceLimits = billingProfile.status === 'Ready' ? getResourceLimits(billingProfile.state) : undefined;
  const availableMachineTypes = resourceLimits?.availableMachineTypes || Object.keys(azureMachineTypes);

  const loading = _loading || isLoadingCloudEnvironments || billingProfile.status === 'Loading';

  // Lifecycle
  useEffect(() => {
    Ajax().Metrics.captureEvent(Events.cloudEnvironmentConfigOpen, {
      existingConfig: !!currentRuntime,
      ...extractWorkspaceDetails(workspace.workspace),
    });
  });

  useEffect(() => {
    const refreshRuntime = _.flow(
      withErrorReportingInModal('Error loading cloud environment', onError),
      Utils.withBusyState(setLoading)
    )(async () => {
      const runtimeDetails = currentRuntime
        ? await Ajax().Runtimes.runtimeV2(workspaceId, currentRuntime.runtimeName).details()
        : undefined;
      setCurrentRuntimeDetails(runtimeDetails);
      setComputeConfig({
        machineType:
          runtimeDetails && isAzureConfig(runtimeDetails.runtimeConfig)
            ? runtimeDetails.runtimeConfig.machineType
            : defaultAzureMachineType,
        persistentDiskSize: runtimeDetails?.diskConfig?.size || defaultAzureDiskSize,
        persistentDiskType:
          runtimeDetails &&
          runtimeDetails.diskConfig?.diskType &&
          isAzureDiskType(runtimeDetails.runtimeConfig, runtimeDetails.diskConfig.diskType)
            ? runtimeDetails?.diskConfig?.diskType
            : defaultAzurePersistentDiskType,
        // Azure workspace containers will pass the 'location' param as an Azure armRegionName, which can be used directly as the computeRegion
        region:
          runtimeDetails && isAzureConfig(runtimeDetails.runtimeConfig)
            ? runtimeDetails?.runtimeConfig?.region || location
            : defaultAzureRegion,
        autopauseThreshold: runtimeDetails
          ? runtimeDetails.autopauseThreshold || autopauseDisabledValue
          : defaultAutopauseThreshold,
      });
    });
    refreshRuntime();
  }, [currentRuntime, location, onError, workspaceId]);

  // Once all data is loaded, check if default computeConfig need to be adjusted based on billing project limits.
  useEffect(() => {
    // If there's an existing runtime, computeConfig will be based on its configuration and should be not be changed.
    if (!loading && !currentRuntimeDetails && resourceLimits) {
      if (resourceLimits.availableMachineTypes) {
        const selectedMachineType = computeConfig.machineType;
        if (!resourceLimits.availableMachineTypes.includes(selectedMachineType)) {
          updateComputeConfig('machinetypes', resourceLimits.availableMachineTypes[0]);
        }
      }

      if (resourceLimits.maxAutopause) {
        const autopauseConfig = computeConfig.autopauseThreshold;
        updateComputeConfig('autopauseThreshold', _.clamp(minAutopause, resourceLimits.maxAutopause, autopauseConfig));
      }

      if (resourceLimits.maxPersistentDiskSize) {
        const diskSize = computeConfig.persistentDiskSize;
        const maxPersistentDiskSize = resourceLimits.maxPersistentDiskSize;
        if (diskSize > resourceLimits.maxPersistentDiskSize) {
          updateComputeConfig(
            'persistentDiskSize',
            azureDiskSizes.findLast((size) => size <= maxPersistentDiskSize)
          );
        }
      }
    }
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderTitleAndTagline = () => {
    return h(Fragment, [
      h(TitleBar, {
        id: titleId,
        hideCloseButton,
        style: { marginBottom: '0.5rem' },
        title: 'Azure Cloud Environment',
        onDismiss,
      }),
      div(['A cloud environment consists of application configuration, cloud compute and persistent disk(s).']),
    ]);
  };

  const renderBottomButtons = () => {
    return div({ style: { display: 'flex', marginTop: '2rem' } }, [
      (doesRuntimeExist() || !!persistentDiskExists) &&
        h(
          ButtonOutline,
          {
            onClick: () => setViewMode('deleteEnvironment'),
            disabled: loading,
          },
          [
            Utils.cond(
              [doesRuntimeExist(), () => 'Delete Environment'],
              [persistentDiskExists, () => 'Delete Persistent Disk'],
              () => 'Delete Environment'
            ),
          ]
        ),
      div({ style: { flex: 1 } }),

      renderActionButton(),
    ]);
  };

  // Will be used once we support update
  // const hasChanges = () => {
  //   const existingConfig = adaptRuntimeDetailsToFormConfig()
  //
  //   return !_.isEqual(existingConfig, computeConfig)
  // }
  //
  // const adaptRuntimeDetailsToFormConfig = () => {
  //   return currentRuntimeDetails ? {
  //     machineType: currentRuntimeDetails.runtimeConfig?.machineType || defaultAzureMachineType,
  //     persistentDiskSize: currentRuntimeDetails.diskConfig?.size || defaultAzureDiskSize,
  //     region: currentRuntimeDetails.runtimeConfig?.region || defaultAzureRegion
  //   } : {}
  // }

  const doesRuntimeExist = () => !!currentRuntimeDetails;

  interface ActionButtonProps {
    readonly tooltipSide: Side;
    readonly disabled: boolean;
    readonly tooltip?: string | undefined;
  }

  const renderActionButton = () => {
    const actionButtonProps: ActionButtonProps = {
      tooltipSide: 'left',
      disabled: Utils.cond(
        [loading, true],
        [
          viewMode === 'deleteEnvironment',
          () => (currentRuntimeDetails ? getIsRuntimeBusy(currentRuntimeDetails) : false),
        ],
        () => doesRuntimeExist()
      ),
      tooltip: Utils.cond(
        [loading, 'Loading cloud environments'],
        [
          viewMode === 'deleteEnvironment',
          () =>
            currentRuntimeDetails && getIsRuntimeBusy(currentRuntimeDetails)
              ? 'Cannot delete a runtime while it is busy'
              : undefined,
        ],
        [doesRuntimeExist(), () => 'Update not supported for azure runtimes'],
        () => undefined
      ),
    };

    return h(
      ButtonPrimary,
      {
        ...actionButtonProps,
        tooltip:
          persistentDiskExists && viewMode !== 'deleteEnvironment'
            ? 'Mount existing Persistent disk to a new Virtual Machine.'
            : undefined,
        onClick: () => applyChanges(),
      },
      [
        Utils.cond(
          [viewMode === 'deleteEnvironment', () => 'Delete'],
          [doesRuntimeExist(), () => 'Update'],
          () => 'Create'
        ),
      ]
    );
  };

  const sendCloudEnvironmentMetrics = () => {
    const metricsEvent = Utils.cond(
      [viewMode === 'deleteEnvironment', () => 'cloudEnvironmentDelete'],
      // TODO: IA-4163 -When update is available, include in metrics
      // [(!!existingRuntime), () => 'cloudEnvironmentUpdate'],
      () => 'cloudEnvironmentCreate'
    );

    // TODO: IA-4163 When update is available include existingRuntime in metrics.
    Ajax().Metrics.captureEvent(Events[metricsEvent], {
      ...extractWorkspaceDetails(workspace),
      ..._.mapKeys((key) => `desiredRuntime_${key}`, computeConfig),
      desiredRuntime_region: computeConfig.region,
      desiredRuntime_machineType: computeConfig.machineType,
      desiredPersistentDisk_size: computeConfig.persistentDiskSize,
      desiredPersistentDisk_type: 'Standard', // IA-4164 - Azure disks are currently only Standard (HDD), when we add types update this.
      desiredPersistentDisk_costPerMonth: getAzureDiskCostEstimate(computeConfig),
      desiredRuntime_gpuEnabled: machineTypeHasGpu(computeConfig.machineType),
      tool: runtimeToolLabels.JupyterLab,
      application: runtimeToolLabels.JupyterLab,
    });
  };

  // Helper functions -- begin
  const applyChanges = _.flow(
    Utils.withBusyState(setLoading),
    // If you update this text, update `run-analysis-azure`
    withErrorReportingInModal('Error modifying cloud environment', onError)
  )(async () => {
    sendCloudEnvironmentMetrics();

    // each branch of the cond should return a promise
    await Utils.cond(
      [
        viewMode === 'deleteEnvironment',
        () =>
          Utils.cond(
            [
              doesRuntimeExist(),
              () =>
                currentRuntime
                  ? Ajax().Runtimes.runtimeV2(workspaceId, currentRuntime.runtimeName).delete(deleteDiskSelected)
                  : {},
            ], // delete runtime
            [
              !!persistentDiskExists && currentPersistentDiskDetails,
              () => (currentPersistentDiskDetails ? leoDiskProvider.delete(currentPersistentDiskDetails) : {}),
            ] // delete disk
          ),
      ],
      [
        Utils.DEFAULT,
        () => {
          const disk = {
            size: computeConfig.persistentDiskSize,
            name: generatePersistentDiskName(),
            labels: { saturnWorkspaceNamespace: namespace, saturnWorkspaceName: workspaceName },
          };

          return Ajax()
            .Runtimes.runtimeV2(workspaceId, generateRuntimeName())
            .create(
              {
                autopauseThreshold: computeConfig.autopauseThreshold,
                machineSize: computeConfig.machineType,
                labels: {
                  saturnWorkspaceNamespace: namespace,
                  saturnWorkspaceName: workspaceName,
                },
                disk,
              },
              persistentDiskExists
            );
        },
      ]
    );

    onSuccess();
  });

  const renderMainForm = () => {
    return h(Fragment, [
      div({ style: { padding: '1.5rem', borderBottom: `1px solid ${colors.dark(0.4)}` } }, [
        renderTitleAndTagline(),
        renderCostBreakdown(),
      ]),
      div({ style: { padding: '1.5rem', overflowY: 'auto', flex: 'auto' } }, [
        h(AzureApplicationConfigurationSection),
        div({ style: { ...computeStyles.whiteBoxContainer, marginTop: '1.5rem' } }, [
          h(AzureComputeProfileSelect, {
            disabled: doesRuntimeExist(),
            machineType: computeConfig.machineType,
            machineTypeOptions: availableMachineTypes,
            style: { marginBottom: '1.5rem' },
            onChangeMachineType: (v) => updateComputeConfig('machineType', v),
          }),
          h(AutopauseConfiguration, {
            autopauseRequired: resourceLimits?.maxAutopause !== undefined,
            autopauseThreshold: computeConfig.autopauseThreshold,
            disabled: doesRuntimeExist(),
            minThreshold: minAutopause,
            maxThreshold: resourceLimits?.maxAutopause,
            style: { gridColumnEnd: 'span 6' },
            onChangeAutopauseThreshold: (v) => updateComputeConfig('autopauseThreshold', v),
          }),
        ]),
        h(AzurePersistentDiskSection, {
          maxPersistentDiskSize: resourceLimits?.maxPersistentDiskSize,
          persistentDiskExists,
          onClickAbout: () => {
            setViewMode('aboutPersistentDisk');
            Ajax().Metrics.captureEvent(Events.aboutPersistentDiskView, { cloudPlatform: cloudProviderTypes.AZURE });
          },
          persistentDiskSize: computeConfig.persistentDiskSize,
          persistentDiskType: computeConfig.persistentDiskType,
          onChangePersistentDiskSize: (v) => updateComputeConfig('persistentDiskSize', v),
          onChangePersistentDiskType: (v) => updateComputeConfig('persistentDiskType', v),
        }),
        renderBottomButtons(),
      ]),
    ]);
  };

  // TODO [IA-3348] parameterize and make it a shared function between the equivalent in GcpComputeModal
  const renderCostBreakdown = () => {
    return div(
      {
        style: {
          backgroundColor: colors.accent(0.2),
          display: 'flex',
          borderRadius: 5,
          padding: '0.5rem 1rem',
          marginTop: '1rem',
        },
      },
      [
        _.map(
          ({ cost, label, unitLabel }) => {
            return div({ key: label, style: { flex: 1, ...computeStyles.label } }, [
              div({ style: { fontSize: 10 } }, [label]),
              div({ style: { color: colors.accent(1.1), marginTop: '0.25rem' } }, [
                span({ style: { fontSize: 20 } }, [cost]),
                span([' ', unitLabel]),
              ]),
            ]);
          },
          [
            {
              label: 'Running cloud compute cost',
              cost: Utils.formatUSD(getAzureComputeCostEstimate(computeConfig)),
              unitLabel: 'per hr',
            },
            { label: 'Paused cloud compute cost', cost: Utils.formatUSD(0), unitLabel: 'per hr' }, // TODO: [IA-4105] update cost
            {
              label: 'Persistent disk cost',
              cost: Utils.formatUSD(getAzureDiskCostEstimate(computeConfig)),
              unitLabel: 'per month',
            },
          ]
        ),
      ]
    );
  };

  return h(Fragment, [
    Utils.switchCase(
      viewMode,
      [
        'aboutPersistentDisk',
        () =>
          h(AboutPersistentDiskView, {
            titleId,
            tool: tool && isRuntimeToolLabel(tool) ? tool : runtimeToolLabels.JupyterLab,
            onDismiss,
            onPrevious: () => setViewMode(undefined),
          }),
      ],
      [
        'deleteEnvironment',
        () =>
          h(DeleteEnvironment, {
            id: titleId,
            runtimeConfig: currentRuntimeDetails && currentRuntimeDetails.runtimeConfig,
            persistentDiskId: currentPersistentDiskDetails?.id,
            persistentDiskCostDisplay: Utils.formatUSD(getAzureDiskCostEstimate(computeConfig)),
            deleteDiskSelected,
            setDeleteDiskSelected,
            renderActionButton,
            hideCloseButton: false,
            onDismiss,
            onPrevious: () => setViewMode(undefined),
            toolLabel: currentRuntimeDetails && currentRuntimeDetails.labels.tool,
          }),
      ],
      [Utils.DEFAULT, renderMainForm]
    ),
    loading && spinnerOverlay,
  ]);
};

export const AzureComputeModal = withModalDrawer({ width: 675, 'aria-labelledby': titleId })(AzureComputeModalBase);
