import { ButtonOutline, ButtonPrimary, IdContainer, Select, spinnerOverlay } from 'src/components/common'
import { ComputeModalBase } from 'src/components/ComputeModal'
import { withModalDrawer } from 'src/components/ModalDrawer'
import { isUSLocation } from 'src/components/region-common'
import TitleBar from 'src/components/TitleBar'
import { Fragment, useState } from 'react'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorReporting, withErrorReportingInModal } from 'src/libs/error'
import { useOnMount } from 'src/libs/react-utils'
import {
  azureMachineTypes,
  computeStyles, defaultAutopauseThreshold, defaultAzureMachineType, defaultComputeRegion, defaultComputeZone, defaultDataprocMachineType,
  defaultDataprocWorkerDiskSize,
  defaultGceBootDiskSize,
  defaultGceMachineType,
  defaultGcePersistentDiskSize, defaultGpuType,
  defaultNumDataprocPreemptibleWorkers,
  defaultNumDataprocWorkers, defaultNumGpus, getCurrentRuntime, getIsRuntimeBusy, getValidGpuTypesForZone, renderCostBreakdown
} from 'src/libs/runtime-utils'
import { div, h, label } from 'react-hyperscript-helpers'
import * as Utils from 'src/libs/utils'


// Change to true to enable a debugging panel (intended for dev mode only)
const showDebugPanel = false
const titleId = 'azure-compute-modal-title'

export const AzureComputeModalBase = ({
  onDismiss, onSuccess, runtimes, workspace, workspace: { workspace: { namespace, name: workspaceName, workspaceId } }, location, isAnalysisMode = false, shouldHideCloseButton = isAnalysisMode
}) => {
  const [loading, setLoading] = useState(false)
  const [currentRuntimeDetails, setCurrentRuntimeDetails] = useState(() => getCurrentRuntime(runtimes))

  //TODO: move to utils
  const defaultAzureComputeConfig = {
    machineType: defaultAzureMachineType,
    masterDiskSize: defaultGceBootDiskSize,
    computeZone: defaultComputeZone
  }
  const [computeConfig, setComputeConfig] = useState(defaultAzureComputeConfig)
  const updateComputeConfig = _.curry((key, value) => setComputeConfig(_.set(key, value)))

  // Lifecycle
  useOnMount(() => {
    // Can't pass an async function into useEffect so we define the function in the body and then call it
    const doUseOnMount = _.flow(
      withErrorReporting('Error loading cloud environment'),
      Utils.withBusyState(setLoading)
    )(async () => {
      //TODO get azure runtime
      const currentRuntime = getCurrentRuntime(runtimes)
      setCurrentRuntimeDetails(currentRuntime ? Ajax().Runtimes.runtime(currentRuntime.googleProject, currentRuntime.runtimeName).details() : null)

      currentRuntime ? setComputeConfig({

      })
    })

    doUseOnMount()
  })

  const renderTitleAndTagline = () => {
    return h(Fragment, [
      h(TitleBar, {
        id: titleId,
        style: { marginBottom: '0.5rem' },
        title: 'Azure Cloud Environment',
        hideCloseButton: shouldHideCloseButton,
        onDismiss
      }),
      div(['A cloud environment consists of application configuration, cloud compute and persistent disk(s).'])
    ])
  }

  const renderBottomButtons = () => {
    return div({ style: { display: 'flex', marginTop: '2rem' } }, [
      !!existingRuntime && h(ButtonOutline, {
        onClick: () => setViewMode('deleteEnvironment')
      }, [
        Utils.cond(
          [!!existingRuntime, () => 'Delete Runtime'],
          () => 'Delete Environment'
        )
      ]),
      div({ style: { flex: 1 } }),
      renderActionButton()
    ])
  }

  const renderApplicationConfigurationSection = () => {
    return div({ style: computeStyles.whiteBoxContainer }, [
      div({ style: { marginBottom: '0.5rem' } }, [
        label({ htmlFor: id, style: computeStyles.label }, ['Application configuration'])
      ])
    ])
  }

  const renderComputeProfileSection = () => {
    const gridStyle = { display: 'grid', gridGap: '1.3rem', alignItems: 'center', marginTop: '1rem' }

    return div({ style: { ...computeStyles.whiteBoxContainer, marginTop: '1rem' } }, [
      div({ style: { fontSize: '0.875rem', fontWeight: 600 } }, ['Cloud compute profile']),
      div([
        div({ style: { ...gridStyle, gridTemplateColumns: '0.25fr 5rem 1fr 6rem 1fr 5rem' } }, [
          h(IdContainer, [
            id => h(Fragment, [
              label({ htmlFor: id, style: computeStyles.label }, ['Machine Type']),
              div([
                h(Select, {
                  id,
                  isSearchable: false,
                  value: computeConfig.machineType,
                  onChange: ({ value }) => {
                    updateComputeConfig('machineType', value)
                  },
                  options: _.keys(azureMachineTypes)
                })
              ])
            ])
          ]),
        ])


      ])
    ])
    // CPU & Memory Selection
  }

  const hasChanges = () => {
    const existingConfig = getExistingEnvironmentConfig()

    return !_.isEqual(existingConfig, computeConfig)
  }

  const canUpdateRuntime = () => {
    const { runtime: existingRuntime } = getExistingEnvironmentConfig()
    return !(
      !existingRuntime ||
        computeConfig.masterDiskSize < computeConfig.masterDiskSize ||
        computeConfig.machineType !== computeConfig.machineType
    )
  }

  const getExistingEnvironmentConfig = () => {
    return {
      runtime: currentRuntimeDetails ? {
        computeConfig
      } : undefined
    }
  }


  //TODO
  const renderActionButton = () => {
    const { runtime: existingRuntime, hasGpu } = getExistingEnvironmentConfig()
    const commonButtonProps = Utils.cond([
        hasGpu && viewMode !== 'deleteEnvironment',
        () => ({ disabled: true, tooltip: 'Cloud compute with GPU(s) cannot be updated. Please delete it and create a new one.' })
      ], [
        computeConfig.gpuEnabled && _.isEmpty(getValidGpuTypesForZone(computeConfig.computeZone)) && viewMode !== 'deleteEnvironmentOptions',
        () => ({ disabled: true, tooltip: 'GPUs not available in this location.' })
      ], [
        !!currentPersistentDiskDetails && currentPersistentDiskDetails.zone.toUpperCase() !== computeConfig.computeZone && viewMode !==
        'deleteEnvironment',
        () => ({ disabled: true, tooltip: 'Cannot create environment in location differing from existing persistent disk location.' })
      ],
      () => ({ disabled: !hasChanges() || !!errors, tooltip: Utils.summarizeErrors(errors) })
    )

    const isRuntimeError = existingRuntime?.status === 'Error'
    const shouldErrorDisableUpdate = existingRuntime?.toolDockerImage === desiredRuntime?.toolDockerImage
    const isUpdateDisabled = getIsRuntimeBusy(currentRuntimeDetails) || (shouldErrorDisableUpdate && isRuntimeError)

    const canShowWarning = viewMode === undefined
    const canShowEnvironmentWarning = _.includes(viewMode, [undefined, 'customImageWarning'])
    return Utils.cond([
        canShowWarning && isCustomImage && existingRuntime?.toolDockerImage !== desiredRuntime?.toolDockerImage,
        () => h(ButtonPrimary, { ...commonButtonProps, onClick: () => setViewMode('customImageWarning') }, ['Next'])
      ], [
        canShowEnvironmentWarning && (willDeleteBuiltinDisk() || willDeletePersistentDisk() || willRequireDowntime() || willDetachPersistentDisk()),
        () => h(ButtonPrimary, { ...commonButtonProps, onClick: () => setViewMode('environmentWarning') }, ['Next'])
      ], [
        canShowWarning && isDifferentLocation(),
        () => h(ButtonPrimary, { ...commonButtonProps, onClick: () => setViewMode('differentLocationWarning') }, ['Next'])
      ], [
        canShowWarning && !isUSLocation(computeConfig.computeRegion),
        () => h(ButtonPrimary, { ...commonButtonProps, onClick: () => setViewMode('nonUSLocationWarning') }, ['Next'])
      ],
      () => h(ButtonPrimary, {
        ...commonButtonProps,
        onClick: () => {
          applyChanges()
        },
        disabled: isUpdateDisabled,
        tooltipSide: 'left',
        tooltip: isUpdateDisabled ? `Cannot perform change on environment in (${currentRuntimeDetails.status}) status` : 'Update Environment'
      }, [
        Utils.cond(
          [viewMode === 'deleteEnvironment', () => 'Delete'],
          [existingRuntime, () => 'Update'],
          () => 'Create'
        )
      ])
    )
  }

  // Helper functions -- begin
  const applyChanges = _.flow(
    Utils.withBusyState(setLoading),
    withErrorReportingInModal('Error modifying cloud environment', onDismiss)
  )(async () => {
    const { runtime: existingRuntime } = getExistingEnvironmentConfig()
    const shouldUpdateRuntime = canUpdateRuntime() && !_.isEqual(computeConfig, existingRuntime)
    const shouldDeleteRuntime = existingRuntime && !canUpdateRuntime()
    const shouldCreateRuntime = !canUpdateRuntime() && computeConfig

    //TODO: metrics onclick
    sendCloudEnvironmentMetrics()

  })

  const renderMainForm = () => {
    const { runtime: existingRuntime } = getExistingEnvironmentConfig()
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

  return h(Fragment, [
    Utils.switchCase(viewMode,
      ['deleteEnvironment', renderDeleteEnvironment],
      [Utils.DEFAULT, renderMainForm]
    )
    loading && spinnerOverlay
  ])


}



export const AzureComputeModal = withModalDrawer({ width: 675, 'aria-labelledby': titleId })(
  ComputeModalBase
)
