import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { div, h, label, p, span } from 'react-hyperscript-helpers';
import { AboutPersistentDiskView } from 'src/analysis/modals/ComputeModal/AboutPersistentDiskView';
import { AzurePersistentDiskSection } from 'src/analysis/modals/ComputeModal/AzureComputeModal/AzurePersistentDiskSection';
import { DeleteEnvironment } from 'src/analysis/modals/DeleteEnvironment';
import { computeStyles } from 'src/analysis/modals/modalStyles';
import { getAzureComputeCostEstimate, getAzureDiskCostEstimate } from 'src/analysis/utils/cost-utils';
import {
  autopauseDisabledValue,
  defaultAutopauseThreshold,
  getAutopauseThreshold,
  getIsRuntimeBusy,
  isAutopauseEnabled,
} from 'src/analysis/utils/runtime-utils';
import { runtimeToolLabels } from 'src/analysis/utils/tool-utils';
import { ButtonOutline, ButtonPrimary, IdContainer, LabeledCheckbox, Link, Select, spinnerOverlay } from 'src/components/common';
import { icon } from 'src/components/icons';
import { NumberInput } from 'src/components/input';
import { withModalDrawer } from 'src/components/ModalDrawer';
import { InfoBox } from 'src/components/PopupTrigger';
import TitleBar from 'src/components/TitleBar';
import { Ajax } from 'src/libs/ajax';
import {
  azureMachineTypes,
  defaultAzureComputeConfig,
  defaultAzureDiskSize,
  defaultAzureMachineType,
  defaultAzurePersistentDiskType,
  defaultAzureRegion,
  getMachineTypeLabel,
} from 'src/libs/azure-utils';
import colors from 'src/libs/colors';
import { withErrorReportingInModal } from 'src/libs/error';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { useOnMount } from 'src/libs/react-utils';
import * as Utils from 'src/libs/utils';
import { cloudProviderTypes } from 'src/libs/workspace-utils';

const titleId = 'azure-compute-modal-title';

export const AzureComputeModalBase = ({
  onDismiss,
  onSuccess,
  onError = onDismiss,
  workspace,
  currentRuntime,
  currentDisk,
  location,
  tool,
  hideCloseButton = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState(undefined);
  const [currentRuntimeDetails, setCurrentRuntimeDetails] = useState(currentRuntime);
  const [currentPersistentDiskDetails] = useState(currentDisk);
  const [computeConfig, setComputeConfig] = useState(defaultAzureComputeConfig);
  const updateComputeConfig = (key, value) => setComputeConfig({ ...computeConfig, [key]: value });
  const { namespace, name: workspaceName, workspaceId } = workspace.workspace;
  const persistentDiskExists = !!currentPersistentDiskDetails;
  const [deleteDiskSelected, setDeleteDiskSelected] = useState(false);
  const [hasGpu, setHasGpu] = useState(false);
  // Lifecycle
  useOnMount(
    _.flow(
      withErrorReportingInModal('Error loading cloud environment', onError),
      Utils.withBusyState(setLoading)
    )(async () => {
      const runtimeDetails = currentRuntime ? await Ajax().Runtimes.runtimeV2(workspaceId, currentRuntime.runtimeName).details() : null;
      Ajax().Metrics.captureEvent(Events.cloudEnvironmentConfigOpen, {
        existingConfig: !!currentRuntime,
        ...extractWorkspaceDetails(workspace.workspace),
      });
      setCurrentRuntimeDetails(runtimeDetails);
      setComputeConfig({
        machineType: runtimeDetails?.runtimeConfig?.machineType || defaultAzureMachineType,
        persistentDiskSize: runtimeDetails?.diskConfig?.size || defaultAzureDiskSize,
        persistentDiskType: runtimeDetails?.diskConfig?.type || defaultAzurePersistentDiskType,
        // Azure workspace containers will pass the 'location' param as an Azure armRegionName, which can be used directly as the computeRegion
        region: runtimeDetails?.runtimeConfig?.region || location || defaultAzureRegion,
        autopauseThreshold: runtimeDetails ? runtimeDetails.autopauseThreshold || autopauseDisabledValue : defaultAutopauseThreshold,
      });
      setHasGpu(!!azureMachineTypes[runtimeDetails?.runtimeConfig?.machineType]?.hasGpu);
    })
  );

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

  const renderApplicationConfigurationSection = () => {
    return div({ style: computeStyles.whiteBoxContainer }, [
      h(IdContainer, [
        (id) =>
          h(Fragment, [
            div({ style: { marginBottom: '1rem' } }, [
              label({ htmlFor: id, style: computeStyles.label }, ['Application configuration']),
              h(InfoBox, { style: { marginLeft: '0.5rem' } }, ['Currently, the Azure VM is pre-configured. ']),
            ]),
            p({ style: { marginBottom: '1.5rem' } }, ['Azure Data Science Virtual Machine']),
            div([
              h(
                Link,
                {
                  href: 'https://azure.microsoft.com/en-us/services/virtual-machines/data-science-virtual-machines/#product-overview',
                  ...Utils.newTabLinkProps,
                },
                ['Learn more about this Azure Data Science VMs', icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })]
              ),
            ]),
          ]),
      ]),
    ]);
  };

  const onChangeComputeConfig = (value) => {
    setHasGpu(!!azureMachineTypes[value]?.hasGpu);
    updateComputeConfig('machineType', value);
  };

  const renderComputeProfileSection = () => {
    const autoPauseCheckboxEnabled = !doesRuntimeExist();
    const gridStyle = { display: 'grid', gridGap: '1rem', alignItems: 'center', marginTop: '1rem' };

    return div({ style: { ...computeStyles.whiteBoxContainer, marginTop: '1.5rem' } }, [
      div({ style: { marginBottom: '2rem' } }, [
        h(IdContainer, [
          (id) =>
            h(Fragment, [
              div({ style: { marginBottom: '1rem' } }, [label({ htmlFor: id, style: computeStyles.label }, ['Cloud compute profile'])]),
              div({ style: { width: 400 } }, [
                h(Select, {
                  id,
                  isSearchable: false,
                  isClearable: false,
                  value: computeConfig.machineType,
                  onChange: ({ value }) => {
                    onChangeComputeConfig(value);
                  },
                  options: _.keys(azureMachineTypes),
                  getOptionLabel: ({ value }) => getMachineTypeLabel(value),
                  styles: { width: '400' },
                }),
              ]),
            ]),
        ]),
        hasGpu &&
          div({ style: { display: 'flex', marginTop: '.5rem' } }, [
            icon('warning-standard', { size: 16, style: { color: colors.warning(), marginRight: '0.5rem' } }),
            h(
              Link,
              { href: 'https://support.terra.bio/hc/en-us/articles/16921184286491-How-to-use-GPUs-in-a-notebook-Azure-', ...Utils.newTabLinkProps },
              [
                'This VM is powered by an NVIDIA GPU. Learn more about enabling GPUs.',
                icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } }),
              ]
            ),
          ]),
        div({ style: { display: 'flex', marginTop: '.5rem' } }, [
          h(Link, { href: 'https://azure.microsoft.com/en-us/pricing/details/virtual-machines/series/', ...Utils.newTabLinkProps }, [
            'Learn more about cloud compute profiles',
            icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } }),
          ]),
        ]),
      ]),
      div({ style: { gridColumnEnd: 'span 6', marginTop: '1.5rem' } }, [
        h(IdContainer, [
          (id1) =>
            h(Fragment, [
              h(
                LabeledCheckbox,
                {
                  id1,
                  checked: isAutopauseEnabled(computeConfig.autopauseThreshold),
                  disabled: !autoPauseCheckboxEnabled,
                  onChange: (v) => updateComputeConfig('autopauseThreshold', getAutopauseThreshold(v)),
                },
                [span({ style: { marginLeft: '0.5rem', ...computeStyles.label, verticalAlign: 'top' } }, [span(['Enable autopause'])])]
              ),
            ]),
        ]),
        h(
          Link,
          {
            style: { marginLeft: '1rem', verticalAlign: 'bottom' },
            href: 'https://support.terra.bio/hc/en-us/articles/360029761352-Preventing-runaway-costs-with-Cloud-Environment-autopause-#h_27c11f46-a6a7-4860-b5e7-fac17df2b2b5',
            ...Utils.newTabLinkProps,
          },
          ['Learn more about autopause.', icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })]
        ),
        div({ style: { ...gridStyle, gridGap: '0.7rem', gridTemplateColumns: '4.5rem 9.5rem', marginTop: '0.75rem' } }, [
          h(IdContainer, [
            (id) =>
              h(Fragment, [
                h(NumberInput, {
                  id,
                  min: 10,
                  max: 999,
                  isClearable: false,
                  onlyInteger: true,
                  disabled: !autoPauseCheckboxEnabled,
                  value: computeConfig.autopauseThreshold,
                  hidden: !isAutopauseEnabled(computeConfig.autopauseThreshold),
                  tooltip: !isAutopauseEnabled(computeConfig.autopauseThreshold) ? 'Autopause must be enabled to configure pause time.' : undefined,
                  onChange: (v) => updateComputeConfig('autopauseThreshold', Number(v)),
                  'aria-label': 'Minutes of inactivity before autopausing',
                }),
                label(
                  {
                    htmlFor: id,
                    hidden: !isAutopauseEnabled(computeConfig.autopauseThreshold),
                  },
                  ['minutes of inactivity']
                ),
              ]),
          ]),
        ]),
      ]),
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

  const renderActionButton = () => {
    const commonButtonProps = {
      tooltipSide: 'left',
      disabled: Utils.cond([viewMode === 'deleteEnvironment', () => getIsRuntimeBusy(currentRuntimeDetails)], () => doesRuntimeExist()),
      tooltip: Utils.cond(
        [viewMode === 'deleteEnvironment', () => (getIsRuntimeBusy(currentRuntimeDetails) ? 'Cannot delete a runtime while it is busy' : undefined)],
        [doesRuntimeExist(), () => 'Update not supported for azure runtimes'],
        () => undefined
      ),
    };

    return h(
      ButtonPrimary,
      {
        ...commonButtonProps,
        tooltip: persistentDiskExists && viewMode !== 'deleteEnvironment' ? 'Mount existing Persistent disk to a new Virtual Machine.' : undefined,
        onClick: () => applyChanges(),
      },
      [Utils.cond([viewMode === 'deleteEnvironment', () => 'Delete'], [doesRuntimeExist(), () => 'Update'], () => 'Create')]
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
      tool: runtimeToolLabels.JupyterLab,
      application: runtimeToolLabels.JupyterLab,
    });
  };

  // Helper functions -- begin
  const applyChanges = _.flow(
    Utils.withBusyState(setLoading),
    withErrorReportingInModal('Error modifying cloud environment', onError)
  )(async () => {
    sendCloudEnvironmentMetrics();

    // each branch of the cond should return a promise
    await Utils.cond(
      [
        viewMode === 'deleteEnvironment',
        () =>
          Utils.cond(
            [doesRuntimeExist(), () => Ajax().Runtimes.runtimeV2(workspaceId, currentRuntime.runtimeName).delete(deleteDiskSelected)], // delete runtime
            [!!persistentDiskExists, () => Ajax().Disks.disksV2().delete(currentPersistentDiskDetails.id)] // delete disk
          ),
      ],
      [
        Utils.DEFAULT,
        () => {
          const disk = {
            size: computeConfig.persistentDiskSize,
            name: Utils.generatePersistentDiskName(),
            labels: { saturnWorkspaceNamespace: namespace, saturnWorkspaceName: workspaceName },
          };

          return Ajax()
            .Runtimes.runtimeV2(workspaceId, Utils.generateRuntimeName())
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
      div({ style: { padding: '1.5rem', borderBottom: `1px solid ${colors.dark(0.4)}` } }, [renderTitleAndTagline(), renderCostBreakdown()]),
      div({ style: { padding: '1.5rem', overflowY: 'auto', flex: 'auto' } }, [
        renderApplicationConfigurationSection(),
        renderComputeProfileSection(),
        h(AzurePersistentDiskSection, {
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
            { label: 'Running cloud compute cost', cost: Utils.formatUSD(getAzureComputeCostEstimate(computeConfig)), unitLabel: 'per hr' },
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
      ['aboutPersistentDisk', () => AboutPersistentDiskView({ titleId, setViewMode, onDismiss, tool })],
      [
        'deleteEnvironment',
        () =>
          DeleteEnvironment({
            id: titleId,
            runtimeConfig: currentRuntimeDetails && currentRuntimeDetails.runtimeConfig,
            persistentDiskId: currentPersistentDiskDetails?.id,
            persistentDiskCostDisplay: Utils.formatUSD(getAzureDiskCostEstimate(computeConfig)),
            deleteDiskSelected,
            setDeleteDiskSelected,
            setViewMode,
            renderActionButton,
            hideCloseButton: false,
            onDismiss,
            toolLabel: currentRuntimeDetails && currentRuntimeDetails.labels.tool,
          }),
      ],
      [Utils.DEFAULT, renderMainForm]
    ),
    loading && spinnerOverlay,
  ]);
};

export const AzureComputeModal = withModalDrawer({ width: 675, 'aria-labelledby': titleId })(AzureComputeModalBase);
