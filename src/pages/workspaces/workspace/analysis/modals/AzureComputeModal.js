import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, label, p, span } from 'react-hyperscript-helpers'
import { ButtonOutline, ButtonPrimary, IdContainer, LabeledCheckbox, Link, Select, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { NumberInput } from 'src/components/input'
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
import { WarningTitle } from 'src/pages/workspaces/workspace/analysis/modals/WarningTitle'
import { getAzureComputeCostEstimate, getAzureDiskCostEstimate } from 'src/pages/workspaces/workspace/analysis/utils/cost-utils'
import {
  autopauseDisabledValue, defaultAutopauseThreshold, getAutopauseThreshold, getCurrentRuntime, getIsRuntimeBusy, isAutopauseEnabled
} from 'src/pages/workspaces/workspace/analysis/utils/runtime-utils'

import { computeStyles } from './modalStyles'


const titleId = 'azure-compute-modal-title'

export const AzureComputeModalBase = ({
  onDismiss, onSuccess, onError = onDismiss, workspace: { workspace: { namespace, name: workspaceName, workspaceId } }, runtimes, location, hideCloseButton = false
}) => {
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState(undefined)
  const [currentRuntimeDetails, setCurrentRuntimeDetails] = useState(() => getCurrentRuntime(runtimes))
  const [computeConfig, setComputeConfig] = useState(defaultAzureComputeConfig)
  const updateComputeConfig = (key, value) => {
    setComputeConfig(prevState => ({ ...prevState, [key]: value }))
  }

  // Lifecycle
  useOnMount(_.flow(
    withErrorReportingInModal('Error loading cloud environment', onError),
    Utils.withBusyState(setLoading)
  )(async () => {
    const currentRuntime = getCurrentRuntime(runtimes)
    const runtimeDetails = currentRuntime ? await Ajax().Runtimes.runtimeV2(workspaceId, currentRuntime.runtimeName).details() : null
    setCurrentRuntimeDetails(runtimeDetails)
    setComputeConfig({
      machineType: runtimeDetails?.runtimeConfig?.machineType || defaultAzureMachineType,
      diskSize: runtimeDetails?.diskConfig?.size || defaultAzureDiskSize,
      // Azure workspace containers will pass the 'location' param as an Azure armRegionName, which can be used directly as the computeRegion
      region: runtimeDetails?.runtimeConfig?.region || location || defaultAzureRegion,
      autopauseThreshold: runtimeDetails ? (runtimeDetails.autopauseThreshold || autopauseDisabledValue) : defaultAutopauseThreshold,
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
    const autoPauseCheckboxEnabled = !doesRuntimeExist()
    const gridStyle = { display: 'grid', gridGap: '1rem', alignItems: 'center', marginTop: '1rem' }

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
      div({ style: { marginBottom: '2rem' } }, [
        h(IdContainer, [
          id => h(Fragment, [
            div({ style: { marginBottom: '.5rem' } }, [
              label({ htmlFor: id, style: computeStyles.label }, ['Disk Size (GB)'])
            ]),
            div({ style: { width: 75 } }, [
              h(NumberInput, {
                id,
                min: 50,
                max: 64000,
                isClearable: false,
                onlyInteger: true,
                value: computeConfig.diskSize,
                onChange: v => updateComputeConfig('diskSize', v)
              })
            ])
          ])
        ])
      ]),
      div({ style: { gridColumnEnd: 'span 6', marginTop: '1.5rem' } }, [
        h(IdContainer, [
          id1 => h(Fragment, [
            h(LabeledCheckbox, {
              id1,
              checked: isAutopauseEnabled(computeConfig.autopauseThreshold),
              disabled: !autoPauseCheckboxEnabled,
              onChange: v => updateComputeConfig('autopauseThreshold', getAutopauseThreshold(v))
            }, ['Enable autopause']),
          ])
        ]),
        h(Link, {
          style: { marginLeft: '1rem', verticalAlign: 'top' },
          href: 'https://support.terra.bio/hc/en-us/articles/360029761352-Preventing-runaway-costs-with-Cloud-Environment-autopause-#h_27c11f46-a6a7-4860-b5e7-fac17df2b2b5', ...Utils.newTabLinkProps
        }, [
          'Learn more about autopause.',
          icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })
        ]),
        div({ style: { ...gridStyle, gridGap: '0.7rem', gridTemplateColumns: '4.5rem 9.5rem', marginTop: '0.75rem' } }, [
          h(IdContainer, [
            id => h(Fragment, [
              h(NumberInput, {
                id,
                min: 1,
                max: 999,
                isClearable: false,
                onlyInteger: true,
                disabled: !autoPauseCheckboxEnabled,
                value: computeConfig.autopauseThreshold,
                hidden: !isAutopauseEnabled(computeConfig.autopauseThreshold),
                tooltip: !isAutopauseEnabled(computeConfig.autopauseThreshold) ? 'Autopause must be enabled to configure pause time.' : undefined,
                onChange: v => updateComputeConfig('autopauseThreshold', Number(v)),
                'aria-label': 'Minutes of inactivity before autopausing'
              }),
              label({
                htmlFor: id,
                hidden: !isAutopauseEnabled(computeConfig.autopauseThreshold)
              }, ['minutes of inactivity'])
            ])
          ])
        ])
      ])
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

  const doesRuntimeExist = () => !!currentRuntimeDetails

  const renderActionButton = () => {
    const commonButtonProps = {
      tooltipSide: 'left',
      disabled: Utils.cond(
        [viewMode === 'deleteEnvironment', () => getIsRuntimeBusy(currentRuntimeDetails)],
        () => doesRuntimeExist()),
      tooltip: Utils.cond(
        [viewMode === 'deleteEnvironment',
          () => getIsRuntimeBusy(currentRuntimeDetails) ? 'Cannot delete a runtime while it is busy' : undefined],
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
        () => Ajax().Runtimes.runtimeV2(workspaceId, currentRuntimeDetails.runtimeName).delete()], //delete runtime
      [Utils.DEFAULT, () => {
        const disk = {
          size: computeConfig.diskSize,
          //We do not currently support re-attaching azure disks
          name: Utils.generatePersistentDiskName(),
          labels: { saturnWorkspaceNamespace: namespace, saturnWorkspaceName: workspaceName }
        }

        Ajax().Metrics.captureEvent(Events.analysisAzureJupyterLabCreate, {
          region: computeConfig.region,
          machineSize: computeConfig.machineType,
          saturnWorkspaceNamespace: namespace,
          saturnWorkspaceName: workspaceName,
          diskSize: disk.size,
          workspaceId
        })

        return Ajax().Runtimes.runtimeV2(workspaceId, Utils.generateRuntimeName()).create({
          autopauseThreshold: computeConfig.autopauseThreshold,
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

  const renderDeleteEnvironment = () => {
    return div({ style: { ...computeStyles.drawerContent, ...computeStyles.warningView } }, [
      h(TitleBar, {
        id: titleId,
        hideCloseButton,
        style: computeStyles.titleBar,
        title: h(WarningTitle, ['Delete environment']),
        onDismiss,
        onPrevious: () => setViewMode(undefined)
      }),
      div({ style: { lineHeight: '1.5rem' } }, [
        p([
          'Deleting your application configuration and cloud compute profile will also ',
          span({ style: { fontWeight: 600 } }, ['delete all files on the built-in hard disk.'])
        ])
      ]),
      div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
        renderActionButton()
      ])
    ])
  }

  return h(Fragment, [
    Utils.switchCase(viewMode,
      ['deleteEnvironment', renderDeleteEnvironment],
      [Utils.DEFAULT, renderMainForm]
    ),
    loading && spinnerOverlay
  ])
}

export const AzureComputeModal = withModalDrawer({ width: 675, 'aria-labelledby': titleId })(
  AzureComputeModalBase
)
