import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, label, p, span } from 'react-hyperscript-helpers'
import { ButtonOutline, ButtonPrimary, IdContainer, Link, Select, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { withModalDrawer } from 'src/components/ModalDrawer'
import { InfoBox } from 'src/components/PopupTrigger'
import TitleBar from 'src/components/TitleBar'
import { Ajax } from 'src/libs/ajax'
import {
  azureMachineTypes,
  defaultAzureComputeConfig, defaultAzureDiskSize, defaultAzureMachineType, defaultAzureRegion, getMachineTypeLabel
} from 'src/libs/azure-utils'
import colors from 'src/libs/colors'
import { withErrorReportingInModal } from 'src/libs/error'
import Events from 'src/libs/events'
import { useOnMount } from 'src/libs/react-utils'
import * as Utils from 'src/libs/utils'
import { DeleteEnvironment } from 'src/pages/workspaces/workspace/analysis/modals/DeleteDiskChoices'
import { getCurrentPersistentDisk } from 'src/pages/workspaces/workspace/analysis/runtime-utils'
import { getAzureComputeCostEstimate, getAzureDiskCostEstimate } from 'src/pages/workspaces/workspace/analysis/utils/cost-utils'
import {
  getCurrentRuntime, getIsRuntimeBusy
} from 'src/pages/workspaces/workspace/analysis/utils/runtime-utils'

import { computeStyles } from './modalStyles'
import { AboutPersistentDisk, PersistentDiskSection } from './persistent-disk-controls'


const titleId = 'azure-compute-modal-title'

export const AzureComputeModalBase = ({
  onDismiss, onSuccess, onError = onDismiss, workspace: { workspace: { namespace, name: workspaceName, workspaceId } }, runtimes, persistentDisks, location, tool, hideCloseButton = false
}) => {
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState(undefined)
  const [currentRuntime, setCurrentRuntime] = useState(() => getCurrentRuntime(runtimes))
  const [computeConfig, setComputeConfig] = useState(defaultAzureComputeConfig)
  const updateComputeConfig = _.curry((key, value) => setComputeConfig(_.set(key, value)))
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentPersistentDisk, setCurrentPersistentDisk] = useState(getCurrentPersistentDisk(runtimes, persistentDisks))

  const persistentDiskExists = !!currentPersistentDisk
  const [deleteDiskSelected, setDeleteDiskSelected] = useState(false)

  // Lifecycle
  useOnMount(_.flow(
    withErrorReportingInModal('Error loading cloud environment', onError),
    Utils.withBusyState(setLoading)
  )(async () => {
    const currentRuntime = getCurrentRuntime(runtimes)

    const runtimeDetails = currentRuntime ? await Ajax().Runtimes.runtimeV2(workspaceId, currentRuntime.runtimeName).details() : null
    setCurrentRuntime(runtimeDetails)
    setComputeConfig({
      machineType: runtimeDetails?.runtimeConfig?.machineType || defaultAzureMachineType,
      persistentDiskSize: runtimeDetails?.diskConfig?.size || defaultAzureDiskSize,
      // Azure workspace containers will pass the 'location' param as an Azure armRegionName, which can be used directly as the computeRegion
      region: runtimeDetails?.runtimeConfig?.region || location || defaultAzureRegion
    })
  }))

  const renderTitleAndTagline = () => {
    return h(Fragment, [
      h(TitleBar, {
        id: titleId,
        hideCloseButton,
        style: { marginBottom: '0.5rem' },
        title: 'Azure Cloud Environment',
        onDismiss
      }),
      div(['A cloud environment consists of application configuration, cloud compute and persistent disk(s).'])
    ])
  }

  const renderBottomButtons = () => {
    return div({ style: { display: 'flex', marginTop: '2rem' } }, [
      doesRuntimeExist() && h(ButtonOutline, {
        onClick: () => setViewMode('deleteEnvironment')
      }, ['Delete Environment']),
      div({ style: { flex: 1 } }),
      renderActionButton()
    ])
  }

  const renderApplicationConfigurationSection = () => {
    return div({ style: computeStyles.whiteBoxContainer }, [
      h(IdContainer, [
        id => h(Fragment, [
          div({ style: { marginBottom: '1rem' } }, [
            label({ htmlFor: id, style: computeStyles.label }, ['Application configuration']),
            h(InfoBox, { style: { marginLeft: '0.5rem' } }, [
              'Currently, the Azure VM is pre-configured. '
            ])
          ]),
          p({ style: { marginBottom: '1.5rem' } }, ['Azure Data Science Virtual Machine']),
          div([
            h(Link, { href: 'https://azure.microsoft.com/en-us/services/virtual-machines/data-science-virtual-machines/#product-overview', ...Utils.newTabLinkProps }, [
              'Learn more about this Azure Data Science VMs',
              icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })
            ])
          ])
        ])
      ])
    ])
  }

  const renderComputeProfileSection = () => {
    return div({ style: { ...computeStyles.whiteBoxContainer, marginTop: '1.5rem' } }, [
      div({ style: { marginBottom: '2rem' } }, [
        h(IdContainer, [
          id => h(Fragment, [
            div({ style: { marginBottom: '1rem' } }, [
              label({ htmlFor: id, style: computeStyles.label }, ['Cloud compute profile'])
            ]),
            div({ style: { width: 400 } }, [
              h(Select, {
                id,
                isSearchable: false,
                isClearable: false,
                value: computeConfig.machineType,
                onChange: ({ value }) => updateComputeConfig('machineType', value),
                options: _.keys(azureMachineTypes),
                getOptionLabel: ({ value }) => getMachineTypeLabel(value),
                styles: { width: '400' }
              })
            ])
          ])
        ]),
        div({ style: { display: 'flex', marginTop: '.5rem' } }, [
          h(Link, { href: 'https://azure.microsoft.com/en-us/pricing/details/virtual-machines/series/', ...Utils.newTabLinkProps }, [
            'Learn more about cloud compute profiles',
            icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })
          ])
        ])
      ]),
    ])
  }

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
  //     diskSize: currentRuntimeDetails.diskConfig?.size || defaultAzureDiskSize,
  //     region: currentRuntimeDetails.runtimeConfig?.region || defaultAzureRegion
  //   } : {}
  // }

  const doesRuntimeExist = () => !!currentRuntime

  const renderActionButton = () => {
    const commonButtonProps = {
      tooltipSide: 'left',
      disabled: Utils.cond(
        [viewMode === 'deleteEnvironment', () => getIsRuntimeBusy(currentRuntime)],
        () => doesRuntimeExist()),
      tooltip: Utils.cond(
        [viewMode === 'deleteEnvironment',
          () => getIsRuntimeBusy(currentRuntime) ? 'Cannot delete a runtime while it is busy' : undefined],
        [doesRuntimeExist(), () => 'Update not supported for azure runtimes'],
        () => undefined)
    }

    return h(ButtonPrimary, {
      ...commonButtonProps,
      onClick: () => applyChanges()
    }, [Utils.cond(
      [viewMode === 'deleteEnvironment', () => 'Delete'],
      [doesRuntimeExist(), () => 'Update'],
      () => 'Create'
    )]
    )
  }

  // Helper functions -- begin
  const applyChanges = _.flow(
    Utils.withBusyState(setLoading),
    withErrorReportingInModal('Error modifying cloud environment', onError)
  )(async () => {
    //TODO: metrics onclick
    //sendCloudEnvironmentMetrics()

    //each branch of the cond should return a promise
    await Utils.cond(
      [viewMode === 'deleteEnvironment',
        () => Ajax().Runtimes.runtimeV2(workspaceId, currentRuntime.runtimeName).delete(deleteDiskSelected)], //delete runtime
      [Utils.DEFAULT, () => {
        // TODO [IA-4052]: We DO currently support re-attaching azure disks
        const disk = {
          size: computeConfig.persistentDiskSize,
          name: Utils.generatePersistentDiskName(),
          labels: { saturnWorkspaceNamespace: namespace, saturnWorkspaceName: workspaceName }
        }

        Ajax().Metrics.captureEvent(Events.analysisAzureJupyterLabCreate, {
          region: computeConfig.region,
          machineSize: computeConfig.machineType,
          saturnWorkspaceNamespace: namespace,
          saturnWorkspaceName: workspaceName,
          diskSize: disk.size, // left as diskSize for backwards-compatible metrics gathering
          workspaceId // TODO [IA-4052]: track persistent disk use here also
        })

        return Ajax().Runtimes.runtimeV2(workspaceId, Utils.generateRuntimeName()).create({
          machineSize: computeConfig.machineType,
          labels: {
            saturnWorkspaceNamespace: namespace,
            saturnWorkspaceName: workspaceName
          },
          disk
        })
      }]
    )

    onSuccess()
  })

  const renderMainForm = () => {
    return h(Fragment, [
      div({ style: { padding: '1.5rem', borderBottom: `1px solid ${colors.dark(0.4)}` } }, [
        renderTitleAndTagline(),
        renderCostBreakdown()
      ]),
      div({ style: { padding: '1.5rem', overflowY: 'auto', flex: 'auto' } }, [
        renderApplicationConfigurationSection(),
        renderComputeProfileSection(),
        h(PersistentDiskSection, { persistentDiskExists, computeConfig, updateComputeConfig, setViewMode, tool }),
        renderBottomButtons()
      ])
    ])
  }

  // TODO [IA-3348] parameterize and make it a shared function between the equivalent in ComputeModal
  const renderCostBreakdown = () => {
    return div({
      style: {
        backgroundColor: colors.accent(0.2),
        display: 'flex',
        borderRadius: 5,
        padding: '0.5rem 1rem',
        marginTop: '1rem'
      }
    }, [
      _.map(({ cost, label, unitLabel }) => {
        return div({ key: label, style: { flex: 1, ...computeStyles.label } }, [
          div({ style: { fontSize: 10 } }, [label]),
          div({ style: { color: colors.accent(1.1), marginTop: '0.25rem' } }, [
            span({ style: { fontSize: 20 } }, [cost]),
            span([' ', unitLabel])
          ])
        ])
      }, [
        { label: 'Running cloud compute cost', cost: Utils.formatUSD(getAzureComputeCostEstimate(computeConfig)), unitLabel: 'per hr' },
        { label: 'Paused cloud compute cost', cost: Utils.formatUSD(0), unitLabel: 'per hr' }, //TODO: [IA-4105] update cost
        {
          label: 'Persistent disk cost',
          cost: Utils.formatUSD(getAzureDiskCostEstimate(computeConfig)),
          unitLabel: 'per month'
        }
      ])
    ])
  }

  return h(Fragment, [
    Utils.switchCase(viewMode,
      ['aboutPersistentDisk', () => AboutPersistentDisk({ titleId, setViewMode, onDismiss, tool })],
      ['deleteEnvironment', () => DeleteEnvironment({
        id: titleId,
        runtimeConfig: currentRuntime.runtimeConfig,
        persistentDisk: currentPersistentDisk,
        deleteDiskSelected,
        setDeleteDiskSelected,
        setViewMode,
        renderActionButton,
        hideCloseButton: false,
        onDismiss,
        toolLabel: currentRuntime.labels.tool
      })],
      [Utils.DEFAULT, renderMainForm]
    ),
    loading && spinnerOverlay
  ])
}

export const AzureComputeModal = withModalDrawer({ width: 675, 'aria-labelledby': titleId })(
  AzureComputeModalBase
)
