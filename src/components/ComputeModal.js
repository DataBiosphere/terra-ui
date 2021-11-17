import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { b, br, code, div, fieldset, h, label, legend, li, p, span, strong, ul } from 'react-hyperscript-helpers'
import {
  ButtonOutline, ButtonPrimary, ButtonSecondary, GroupedSelect, IdContainer, LabeledCheckbox, Link, Select, spinnerOverlay, WarningTitle
} from 'src/components/common'
import { icon } from 'src/components/icons'
import { ImageDepViewer } from 'src/components/ImageDepViewer'
import { NumberInput, TextInput, ValidatedInput } from 'src/components/input'
import { withModalDrawer } from 'src/components/ModalDrawer'
import { tools } from 'src/components/notebook-utils'
import { InfoBox } from 'src/components/PopupTrigger'
import { getAvailableComputeRegions, getRegionInfo, isUSLocation, locationTypes } from 'src/components/region-common'
import { SaveFilesHelp, SaveFilesHelpRStudio } from 'src/components/runtime-common'
import TitleBar from 'src/components/TitleBar'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { cloudServices, machineTypes } from 'src/data/machines'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import Events, { extractWorkspaceDetails } from 'src/libs/events'
import { betaVersionTag } from 'src/libs/logos'
import * as Nav from 'src/libs/nav'
import {
  computeStyles, defaultComputeRegion, defaultComputeZone, defaultDataprocDiskSize, defaultDataprocMachineType, defaultGceBootDiskSize,
  defaultGceMachineType, defaultGcePersistentDiskSize, defaultGpuType, defaultLocation, defaultNumDataprocPreemptibleWorkers,
  defaultNumDataprocWorkers, defaultNumGpus, displayNameForGpuType, findMachineType, getCurrentRuntime, getDefaultMachineType,
  getPersistentDiskCostMonthly, getValidGpuTypes, getValidGpuTypesForZone, RadioBlock, runtimeConfigBaseCost, runtimeConfigCost
} from 'src/libs/runtime-utils'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import validate from 'validate.js'


// Change to true to enable a debugging panel (intended for dev mode only)
const showDebugPanel = false
const titleId = 'cloud-compute-modal-title'

const customMode = '__custom_mode__'
const terraDockerBaseGithubUrl = 'https://github.com/databiosphere/terra-docker'
const terraBaseImages = `${terraDockerBaseGithubUrl}#terra-base-images`
const safeImageDocumentation = 'https://support.terra.bio/hc/en-us/articles/360034669811'

// Distilled from https://github.com/docker/distribution/blob/95daa793b83a21656fe6c13e6d5cf1c3999108c7/reference/regexp.go
const imageValidationRegexp = /^[A-Za-z0-9]+[\w./-]+(?::\w[\w.-]+)?(?:@[\w+.-]+:[A-Fa-f0-9]{32,})?$/

// Enums -- start
const sparkInterfaces = {
  yarn: {
    label: 'yarn',
    displayName: 'YARN Resource Manager',
    synopsis: `YARN Resource Manager provides information about cluster status and metrics as well as information about the scheduler, nodes, and applications on the cluster.`
  },
  appHistory: {
    label: 'apphistory',
    displayName: 'YARN Application Timeline',
    synopsis: `YARN Application Timeline provides information about current and historic applications executed on the cluster.`
  },
  sparkHistory: {
    label: 'sparkhistory',
    displayName: 'Spark History Server',
    synopsis: `Spark History Server provides information about completed Spark applications on the cluster.`
  },
  jobHistory: {
    label: 'jobhistory',
    displayName: 'MapReduce History Server',
    synopsis: `MapReduce History Server displays information about completed MapReduce applications on a cluster.`
  }
}
// Enums -- end

// Auxiliary components -- begin
const WorkerSelector = ({ value, machineTypeOptions, onChange }) => {
  const { cpu: currentCpu, memory: currentMemory } = findMachineType(value)
  return h(Fragment, [
    h(IdContainer, [
      id => h(Fragment, [
        label({ htmlFor: id, style: computeStyles.label }, ['CPUs']),
        div([
          h(Select, {
            id,
            isSearchable: false,
            value: currentCpu,
            onChange: option => onChange(_.find({ cpu: option.value }, machineTypeOptions)?.name || value),
            options: _.flow(_.map('cpu'), _.union([currentCpu]), _.sortBy(_.identity))(machineTypeOptions)
          })
        ])
      ])
    ]),
    h(IdContainer, [
      id => h(Fragment, [
        label({ htmlFor: id, style: computeStyles.label }, ['Memory (GB)']),
        div([
          h(Select, {
            id,
            isSearchable: false,
            value: currentMemory,
            onChange: option => onChange(_.find({ cpu: currentCpu, memory: option.value }, machineTypeOptions)?.name || value),
            options: _.flow(_.filter({ cpu: currentCpu }), _.map('memory'), _.union([currentMemory]), _.sortBy(_.identity))(machineTypeOptions)
          })
        ])
      ])
    ])
  ])
}

const DataprocDiskSelector = ({ value, onChange }) => {
  return h(IdContainer, [
    id => h(Fragment, [
      label({ htmlFor: id, style: computeStyles.label }, ['Disk size (GB)']),
      h(NumberInput, {
        id,
        min: 100, // less than this size causes failures in cluster creation
        max: 64000,
        isClearable: false,
        onlyInteger: true,
        value,
        onChange
      })
    ])
  ])
}

const SparkInterface = ({ sparkInterface, namespace, name, onDismiss }) => {
  const { label, displayName, synopsis } = sparkInterface

  return div(
    { style: { ...computeStyles.whiteBoxContainer, marginBottom: '1rem', backgroundColor: colors.accent(0.1), boxShadow: Style.standardShadow } }, [
      div({ style: { flex: '1', lineHeight: '1.5rem', minWidth: 0, display: 'flex' } }, [
        div([
          div({ style: { ...computeStyles.headerText, marginTop: '0.5rem' } }, [displayName]),
          p([synopsis]),
          div({ style: { display: 'flex', marginTop: '1rem' } }, [
            h(ButtonOutline, {
              href: Nav.getLink('workspace-spark-interface-launch', { namespace, name, application: 'spark', sparkInterface: label }),
              style: { marginRight: 'auto' },
              onClick: onDismiss,
              ...Utils.newTabLinkProps
            }, ['Launch', icon('pop-out', { size: 12, style: { marginLeft: '0.5rem' } })])
          ])
        ])
      ])
    ])
}
// Auxiliary components -- end

const getImageUrl = runtimeDetails => {
  return _.find(({ imageType }) => _.includes(imageType, ['Jupyter', 'RStudio']), runtimeDetails?.runtimeImages)?.imageUrl
}

const getCurrentPersistentDisk = (runtimes, persistentDisks) => {
  const currentRuntime = getCurrentRuntime(runtimes)
  const id = currentRuntime?.runtimeConfig.persistentDiskId
  const attachedIds = _.without([undefined], _.map(runtime => runtime.runtimeConfig.persistentDiskId, runtimes))

  return id ?
    _.find({ id }, persistentDisks) :
    _.last(_.sortBy('auditInfo.createdDate', _.filter(({ id, status }) => status !== 'Deleting' && !_.includes(id, attachedIds), persistentDisks)))
}

const shouldUsePersistentDisk = (sparkMode, runtimeDetails, upgradeDiskSelected) => !sparkMode &&
  (!runtimeDetails?.runtimeConfig?.diskSize || upgradeDiskSelected)

export const ComputeModalBase = ({ onDismiss, onSuccess, runtimes, persistentDisks, tool, workspace, location, isAnalysisMode = false }) => {
  // State -- begin
  const [showDebugger, setShowDebugger] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentRuntimeDetails, setCurrentRuntimeDetails] = useState(() => getCurrentRuntime(runtimes))
  const [currentPersistentDiskDetails, setCurrentPersistentDiskDetails] = useState(() => getCurrentPersistentDisk(runtimes, persistentDisks))
  const [viewMode, setViewMode] = useState(undefined)
  const [deleteDiskSelected, setDeleteDiskSelected] = useState(false)
  const [upgradeDiskSelected, setUpgradeDiskSelected] = useState(false)
  const [simplifiedForm, setSimplifiedForm] = useState(!currentRuntimeDetails)
  const [leoImages, setLeoImages] = useState([])
  const [selectedLeoImage, setSelectedLeoImage] = useState(undefined)
  const [customEnvImage, setCustomEnvImage] = useState('')
  const [jupyterUserScriptUri, setJupyterUserScriptUri] = useState('')
  const [sparkMode, setSparkMode] = useState(false)
  const [bucketLocation, setBucketLocation] = useState(defaultLocation)
  const [computeConfig, setComputeConfig] = useState({
    selectedPersistentDiskSize: defaultGcePersistentDiskSize,
    masterMachineType: defaultGceMachineType,
    masterDiskSize: defaultGceBootDiskSize,
    numberOfWorkers: defaultNumDataprocWorkers,
    numberOfPreemptibleWorkers: defaultNumDataprocPreemptibleWorkers,
    workerMachineType: defaultDataprocMachineType,
    workerDiskSize: defaultDataprocDiskSize,
    componentGatewayEnabled: true, // We enable web interfaces (aka Spark console) for all new Dataproc clusters.
    gpuEnabled: false,
    hasGpu: false,
    gpuType: defaultGpuType,
    numGpus: defaultNumGpus,
    computeRegion: defaultComputeRegion,
    computeZone: defaultComputeZone
  })
  // State -- end

  const isPersistentDisk = shouldUsePersistentDisk(sparkMode, currentRuntimeDetails, upgradeDiskSelected)

  const isCustomImage = selectedLeoImage === customMode
  const { version, updated, packages, requiresSpark, label: packageLabel } = _.find({ image: selectedLeoImage }, leoImages) || {}

  const minRequiredMemory = sparkMode ? 7.5 : 3.75
  const validMachineTypes = _.filter(({ memory }) => memory >= minRequiredMemory, machineTypes)
  const mainMachineType = _.find({ name: computeConfig.masterMachineType }, validMachineTypes)?.name || getDefaultMachineType(sparkMode)
  const machineTypeConstraints = { inclusion: { within: _.map('name', validMachineTypes), message: 'is not supported' } }

  const errors = validate(
    { mainMachineType, workerMachineType: computeConfig.workerMachineType, customEnvImage },
    {
      masterMachineType: machineTypeConstraints,
      workerMachineType: machineTypeConstraints,
      customEnvImage: isCustomImage ? { format: { pattern: imageValidationRegexp } } : {}
    },
    {
      prettify: v => ({ customEnvImage: 'Container image', masterMachineType: 'Main CPU/memory', workerMachineType: 'Worker CPU/memory' }[v] ||
        validate.prettify(v))
    }
  )

  // Helper functions -- begin
  const applyChanges = _.flow(
    Utils.withBusyState(setLoading),
    withErrorReporting('Error creating cloud environment')
  )(async () => {
    const { runtime: existingRuntime, persistentDisk: existingPersistentDisk } = getExistingEnvironmentConfig()
    const { runtime: desiredRuntime, persistentDisk: desiredPersistentDisk } = getDesiredEnvironmentConfig()
    const shouldUpdatePersistentDisk = canUpdatePersistentDisk() && !_.isEqual(desiredPersistentDisk, existingPersistentDisk)
    const shouldDeletePersistentDisk = existingPersistentDisk && !canUpdatePersistentDisk()
    const shouldUpdateRuntime = canUpdateRuntime() && !_.isEqual(desiredRuntime, existingRuntime)
    const shouldDeleteRuntime = existingRuntime && !canUpdateRuntime()
    const shouldCreateRuntime = !canUpdateRuntime() && desiredRuntime
    const { namespace, name, bucketName, googleProject } = getWorkspaceObject()

    const runtimeConfig = desiredRuntime && {
      cloudService: desiredRuntime.cloudService,
      ...(desiredRuntime.cloudService === cloudServices.GCE ? {
        zone: desiredRuntime.zone.toLowerCase(),
        machineType: desiredRuntime.machineType || defaultGceMachineType,
        ...(desiredRuntime.diskSize ? {
          diskSize: desiredRuntime.diskSize
        } : {
          persistentDisk: existingPersistentDisk && !shouldDeletePersistentDisk ? {
            name: currentPersistentDiskDetails.name
          } : {
            name: Utils.generatePersistentDiskName(),
            size: desiredPersistentDisk.size,
            labels: { saturnWorkspaceNamespace: namespace, saturnWorkspaceName: name }
          }
        }),
        ...(computeConfig.gpuEnabled && { gpuConfig: { gpuType: computeConfig.gpuType, numOfGpus: computeConfig.numGpus } })
      } : {
        region: desiredRuntime.region.toLowerCase(),
        masterMachineType: desiredRuntime.masterMachineType || defaultDataprocMachineType,
        masterDiskSize: desiredRuntime.masterDiskSize,
        numberOfWorkers: desiredRuntime.numberOfWorkers,
        componentGatewayEnabled: desiredRuntime.componentGatewayEnabled,
        ...(desiredRuntime.numberOfWorkers && {
          numberOfPreemptibleWorkers: desiredRuntime.numberOfPreemptibleWorkers,
          workerMachineType: desiredRuntime.workerMachineType,
          workerDiskSize: desiredRuntime.workerDiskSize
        })
      })
    }

    const customEnvVars = {
      WORKSPACE_NAME: name,
      WORKSPACE_NAMESPACE: namespace,
      WORKSPACE_BUCKET: `gs://${bucketName}`,
      GOOGLE_PROJECT: googleProject
    }

    sendCloudEnvironmentMetrics()

    if (shouldDeleteRuntime) {
      await Ajax().Runtimes.runtime(googleProject, currentRuntimeDetails.runtimeName).delete(hasAttachedDisk() && shouldDeletePersistentDisk)
    }
    if (shouldDeletePersistentDisk && !hasAttachedDisk()) {
      await Ajax().Disks.disk(googleProject, currentPersistentDiskDetails.name).delete()
    }
    if (shouldUpdatePersistentDisk) {
      await Ajax().Disks.disk(googleProject, currentPersistentDiskDetails.name).update(desiredPersistentDisk.size)
    }
    if (shouldUpdateRuntime) {
      await Ajax().Runtimes.runtime(googleProject, currentRuntimeDetails.runtimeName).update({ runtimeConfig })
    }
    if (shouldCreateRuntime) {
      await Ajax().Runtimes.runtime(googleProject, Utils.generateRuntimeName()).create({
        runtimeConfig,
        toolDockerImage: desiredRuntime.toolDockerImage,
        labels: { saturnWorkspaceNamespace: namespace, saturnWorkspaceName: name },
        customEnvironmentVariables: customEnvVars,
        ...(desiredRuntime.jupyterUserScriptUri ? { jupyterUserScriptUri: desiredRuntime.jupyterUserScriptUri } : {})
      })
    }

    onSuccess()
  })

  const isRuntimeRunning = () => currentRuntimeDetails?.status === 'Running'

  const shouldDisplaySparkConsoleLink = () => !!sparkMode && currentRuntimeDetails?.runtimeConfig?.componentGatewayEnabled

  const canManageSparkConsole = () => shouldDisplaySparkConsoleLink() && isRuntimeRunning()

  const canUpdateNumberOfWorkers = () => !currentRuntimeDetails || isRuntimeRunning()

  const canUpdateRuntime = () => {
    const { runtime: existingRuntime } = getExistingEnvironmentConfig()
    const { runtime: desiredRuntime } = getDesiredEnvironmentConfig()

    return !(
      !existingRuntime ||
      !desiredRuntime ||
      desiredRuntime.cloudService !== existingRuntime.cloudService ||
      desiredRuntime.toolDockerImage !== existingRuntime.toolDockerImage ||
      desiredRuntime.jupyterUserScriptUri !== existingRuntime.jupyterUserScriptUri ||
      (desiredRuntime.cloudService === cloudServices.GCE ? (
        desiredRuntime.persistentDiskAttached !== existingRuntime.persistentDiskAttached ||
        (desiredRuntime.persistentDiskAttached ? !canUpdatePersistentDisk() : desiredRuntime.diskSize < existingRuntime.diskSize)
      ) : (
        desiredRuntime.masterDiskSize < existingRuntime.masterDiskSize ||
        (desiredRuntime.numberOfWorkers > 0 && existingRuntime.numberOfWorkers === 0) ||
        (desiredRuntime.numberOfWorkers === 0 && existingRuntime.numberOfWorkers > 0) ||
        desiredRuntime.workerMachineType !== existingRuntime.workerMachineType ||
        desiredRuntime.workerDiskSize !== existingRuntime.workerDiskSize
      ))
    )
  }

  const canUpdatePersistentDisk = () => {
    const { persistentDisk: existingPersistentDisk } = getExistingEnvironmentConfig()
    const { persistentDisk: desiredPersistentDisk } = getDesiredEnvironmentConfig()

    return !(
      !existingPersistentDisk ||
      !desiredPersistentDisk ||
      desiredPersistentDisk.size < existingPersistentDisk.size
    )
  }

  const getCurrentMountDirectory = currentRuntimeDetails => {
    const rstudioMountPoint = '/home/rstudio'
    const jupyterMountPoint = '/home/jupyter/notebooks'
    const noMountDirectory = `${jupyterMountPoint} for Jupyter environments and ${rstudioMountPoint} for RStudio environments`
    return currentRuntimeDetails?.labels.tool ?
      (currentRuntimeDetails?.labels.tool === 'RStudio' ? rstudioMountPoint : jupyterMountPoint) :
      noMountDirectory
  }

  const getExistingEnvironmentConfig = () => {
    const runtimeConfig = currentRuntimeDetails?.runtimeConfig
    const cloudService = runtimeConfig?.cloudService
    const numberOfWorkers = runtimeConfig?.numberOfWorkers || 0
    const gpuConfig = runtimeConfig?.gpuConfig
    const tool = currentRuntimeDetails?.labels?.tool

    return {
      hasGpu: computeConfig.hasGpu,
      runtime: currentRuntimeDetails ? {
        cloudService,
        toolDockerImage: getImageUrl(currentRuntimeDetails),
        tool,
        ...(currentRuntimeDetails?.jupyterUserScriptUri && { jupyterUserScriptUri: currentRuntimeDetails?.jupyterUserScriptUri }),
        ...(cloudService === cloudServices.GCE ? {
          zone: computeConfig.computeZone,
          machineType: runtimeConfig.machineType || defaultGceMachineType,
          ...(computeConfig.hasGpu && gpuConfig ? { gpuConfig } : {}),
          bootDiskSize: runtimeConfig.bootDiskSize,
          ...(runtimeConfig.persistentDiskId ? {
            persistentDiskAttached: true
          } : {
            diskSize: runtimeConfig.diskSize
          })
        } : {
          region: computeConfig.computeRegion,
          masterMachineType: runtimeConfig.masterMachineType || defaultDataprocMachineType,
          masterDiskSize: runtimeConfig.masterDiskSize || 100,
          numberOfWorkers,
          componentGatewayEnabled: runtimeConfig.componentGatewayEnabled || !!sparkMode,
          ...(numberOfWorkers && {
            numberOfPreemptibleWorkers: runtimeConfig.numberOfPreemptibleWorkers || 0,
            workerMachineType: runtimeConfig.workerMachineType || defaultDataprocMachineType,
            workerDiskSize: runtimeConfig.workerDiskSize || 100
          })
        })
      } : undefined,
      persistentDisk: currentPersistentDiskDetails ? { size: currentPersistentDiskDetails.size } : undefined
    }
  }

  const getDesiredEnvironmentConfig = () => {
    const { persistentDisk: existingPersistentDisk, runtime: existingRuntime } = getExistingEnvironmentConfig()
    const cloudService = sparkMode ? cloudServices.DATAPROC : cloudServices.GCE
    const desiredNumberOfWorkers = sparkMode === 'cluster' ? computeConfig.numberOfWorkers : 0

    return {
      hasGpu: computeConfig.hasGpu,
      runtime: Utils.cond(
        [(viewMode !== 'deleteEnvironmentOptions'), () => {
          return {
            cloudService,
            toolDockerImage: selectedLeoImage === customMode ? customEnvImage : selectedLeoImage,
            ...(jupyterUserScriptUri && { jupyterUserScriptUri }),
            ...(cloudService === cloudServices.GCE ? {
              zone: computeConfig.computeZone,
              region: computeConfig.computeRegion,
              machineType: computeConfig.masterMachineType || defaultGceMachineType,
              ...(computeConfig.gpuEnabled ? { gpuConfig: { gpuType: computeConfig.gpuType, numOfGpus: computeConfig.numGpus } } : {}),
              bootDiskSize: existingRuntime?.bootDiskSize,
              ...(shouldUsePersistentDisk(sparkMode, currentRuntimeDetails, upgradeDiskSelected) ? {
                persistentDiskAttached: true
              } : {
                diskSize: computeConfig.masterDiskSize
              })
            } : {
              region: computeConfig.computeRegion,
              masterMachineType: computeConfig.masterMachineType || defaultDataprocMachineType,
              masterDiskSize: computeConfig.masterDiskSize,
              numberOfWorkers: desiredNumberOfWorkers,
              componentGatewayEnabled: computeConfig.componentGatewayEnabled,
              ...(desiredNumberOfWorkers && {
                numberOfPreemptibleWorkers: computeConfig.numberOfPreemptibleWorkers,
                workerMachineType: computeConfig.workerMachineType || defaultDataprocMachineType,
                workerDiskSize: computeConfig.workerDiskSize
              })
            })
          }
        }],
        [!deleteDiskSelected || existingRuntime?.persistentDiskAttached, () => undefined],
        () => existingRuntime
      ),
      persistentDisk: Utils.cond(
        [deleteDiskSelected, () => undefined],
        [viewMode !== 'deleteEnvironmentOptions' && shouldUsePersistentDisk(sparkMode, currentRuntimeDetails, upgradeDiskSelected),
          () => ({ size: computeConfig.selectedPersistentDiskSize })],
        () => existingPersistentDisk
      )
    }
  }

  /**
   * Transforms the new environment config into the shape of a disk returned
   * from leonardo. The cost calculation functions expect that shape, so this
   * is necessary to compute the cost for potential new disk configurations.
   */
  const getPendingDisk = () => {
    const { persistentDisk: desiredPersistentDisk } = getDesiredEnvironmentConfig()
    return { size: desiredPersistentDisk.size, status: 'Ready' }
  }

  /**
   * Transforms the desired environment config into the shape of runtime config
   * returned from Leonardo. The cost calculation functions expect that shape,
   * so this is necessary to compute the cost for potential new configurations.
   */
  const getPendingRuntimeConfig = () => {
    const { runtime: desiredRuntime } = getDesiredEnvironmentConfig()

    return {
      cloudService: desiredRuntime.cloudService,
      ...(desiredRuntime.cloudService === cloudServices.GCE ? {
        machineType: desiredRuntime.machineType || defaultGceMachineType,
        bootDiskSize: desiredRuntime.bootDiskSize,
        region: desiredRuntime.region,
        zone: desiredRuntime.zone,
        ...(desiredRuntime.gpuConfig ? { gpuConfig: desiredRuntime.gpuConfig } : {}),
        ...(desiredRuntime.diskSize ? { diskSize: desiredRuntime.diskSize } : {})
      } : {
        region: desiredRuntime.region,
        masterMachineType: desiredRuntime.masterMachineType || defaultDataprocMachineType,
        masterDiskSize: desiredRuntime.masterDiskSize,
        numberOfWorkers: desiredRuntime.numberOfWorkers,
        componentGatewayEnabled: computeConfig.componentGatewayEnabled,
        ...(desiredRuntime.numberOfWorkers && {
          numberOfPreemptibleWorkers: desiredRuntime.numberOfPreemptibleWorkers,
          workerMachineType: desiredRuntime.workerMachineType,
          workerDiskSize: desiredRuntime.workerDiskSize
        })
      })
    }
  }

  const getWorkspaceObject = () => workspace?.workspace

  const handleLearnMoreAboutPersistentDisk = () => {
    setViewMode('aboutPersistentDisk')
    Ajax().Metrics.captureEvent(Events.aboutPersistentDiskView, {
      ...extractWorkspaceDetails(getWorkspaceObject()), currentlyHasAttachedDisk: !!hasAttachedDisk()
    })
  }

  const hasAttachedDisk = () => {
    const { runtime: existingRuntime } = getExistingEnvironmentConfig()
    return existingRuntime?.persistentDiskAttached
  }

  const hasChanges = () => {
    const existingConfig = getExistingEnvironmentConfig()
    const desiredConfig = getDesiredEnvironmentConfig()

    return !_.isEqual(existingConfig, desiredConfig)
  }

  /**
   * Original diagram (without PD) for update runtime logic:
   * https://drive.google.com/file/d/1mtFFecpQTkGYWSgPlaHksYaIudWHa0dY/view
   */
  const isStopRequired = () => {
    const { runtime: existingRuntime } = getExistingEnvironmentConfig()
    const { runtime: desiredRuntime } = getDesiredEnvironmentConfig()

    return canUpdateRuntime() &&
      (existingRuntime.cloudService === cloudServices.GCE ?
        existingRuntime.machineType !== desiredRuntime.machineType :
        existingRuntime.masterMachineType !== desiredRuntime.masterMachineType)
  }

  const makeImageInfo = style => div({ style: { whiteSpace: 'pre', ...style } }, [
    div({ style: Style.proportionalNumbers }, ['Updated: ', updated ? Utils.makeStandardDate(updated) : null]),
    div(['Version: ', version || null])
  ])

  const sendCloudEnvironmentMetrics = () => {
    const { runtime: desiredRuntime, persistentDisk: desiredPersistentDisk } = getDesiredEnvironmentConfig()
    const { runtime: existingRuntime, persistentDisk: existingPersistentDisk } = getExistingEnvironmentConfig()
    const desiredMachineType = desiredRuntime &&
      (desiredRuntime.cloudService === cloudServices.GCE ? desiredRuntime.machineType : desiredRuntime.masterMachineType)
    const existingMachineType = existingRuntime &&
      (existingRuntime?.cloudService === cloudServices.GCE ? existingRuntime.machineType : existingRuntime.masterMachineType)
    const { cpu: desiredRuntimeCpus, memory: desiredRuntimeMemory } = findMachineType(desiredMachineType)
    const { cpu: existingRuntimeCpus, memory: existingRuntimeMemory } = findMachineType(existingMachineType)
    const metricsEvent = Utils.cond(
      [(viewMode === 'deleteEnvironmentOptions'), () => 'cloudEnvironmentDelete'],
      [(!!existingRuntime), () => 'cloudEnvironmentUpdate'],
      () => 'cloudEnvironmentCreate'
    )

    Ajax().Metrics.captureEvent(Events[metricsEvent], {
      ...extractWorkspaceDetails(getWorkspaceObject()),
      ..._.mapKeys(key => `desiredRuntime_${key}`, desiredRuntime),
      desiredRuntime_exists: !!desiredRuntime,
      desiredRuntime_cpus: desiredRuntime && desiredRuntimeCpus,
      desiredRuntime_memory: desiredRuntime && desiredRuntimeMemory,
      desiredRuntime_costPerHour: desiredRuntime && runtimeConfigCost(getPendingRuntimeConfig()),
      desiredRuntime_pausedCostPerHour: desiredRuntime && runtimeConfigBaseCost(getPendingRuntimeConfig()),
      ..._.mapKeys(key => `existingRuntime_${key}`, existingRuntime),
      existingRuntime_exists: !!existingRuntime,
      existingRuntime_cpus: existingRuntime && existingRuntimeCpus,
      existingRuntime_memory: existingRuntime && existingRuntimeMemory,
      ..._.mapKeys(key => `desiredPersistentDisk_${key}`, desiredPersistentDisk),
      desiredPersistentDisk_costPerMonth: (desiredPersistentDisk && getPersistentDiskCostMonthly(getPendingDisk(), computeConfig.computeRegion)),
      ..._.mapKeys(key => `existingPersistentDisk_${key}`, existingPersistentDisk),
      isDefaultConfig: !!simplifiedForm
    })
  }

  const updateComputeConfig = _.curry((key, value) => setComputeConfig(_.set(key, value)))

  const willDeleteBuiltinDisk = () => {
    const { runtime: existingRuntime } = getExistingEnvironmentConfig()
    return (existingRuntime?.diskSize || existingRuntime?.masterDiskSize) && !canUpdateRuntime()
  }

  const willDeletePersistentDisk = () => {
    const { persistentDisk: existingPersistentDisk } = getExistingEnvironmentConfig()
    return existingPersistentDisk && !canUpdatePersistentDisk()
  }

  const willDetachPersistentDisk = () => {
    const { runtime: desiredRuntime } = getDesiredEnvironmentConfig()
    return desiredRuntime.cloudService === cloudServices.DATAPROC && hasAttachedDisk()
  }

  const willRequireDowntime = () => {
    const { runtime: existingRuntime } = getExistingEnvironmentConfig()
    return existingRuntime && (!canUpdateRuntime() || isStopRequired())
  }

  const updateComputeLocation = (location, locationType) => {
    const { computeZone, computeRegion } = getRegionInfo(location, locationType)
    updateComputeConfig('computeZone', computeZone)
    updateComputeConfig('computeRegion', computeRegion)
  }

  const isDifferentLocation = () => {
    // If the bucket is regional, we can easily compare the bucketLocation with the compute region.
    // bucketLocation === 'US' means the bucket is US multi-regional.
    // For a US multi-regional bucket, the computeRegion needs to be US-CENTRAL1 in order to be considered "in the same location".
    // Currently, US is the only multi-region supported in Terra
    if (bucketLocation === defaultLocation) {
      return computeConfig.computeRegion !== defaultComputeRegion
    } else {
      return computeConfig.computeRegion !== bucketLocation
    }
  }
  // Helper functions -- end

  // Lifecycle
  Utils.useOnMount(() => {
    // Can't pass an async function into useEffect so we define the function in the body and then call it
    const doUseOnMount = _.flow(
      withErrorReporting('Error loading cloud environment'),
      Utils.withBusyState(setLoading)
    )(async () => {
      const { googleProject } = getWorkspaceObject()
      const currentRuntime = getCurrentRuntime(runtimes)
      const currentPersistentDisk = getCurrentPersistentDisk(runtimes, persistentDisks)

      Ajax().Metrics.captureEvent(Events.cloudEnvironmentConfigOpen, {
        existingConfig: !!currentRuntime, ...extractWorkspaceDetails(getWorkspaceObject())
      })
      const [currentRuntimeDetails, newLeoImages, currentPersistentDiskDetails] = await Promise.all([
        currentRuntime ? Ajax().Runtimes.runtime(currentRuntime.googleProject, currentRuntime.runtimeName).details() : null,
        Ajax()
          .Buckets
          .getObjectPreview(googleProject, 'terra-docker-image-documentation', 'terra-docker-versions.json', true)
          .then(res => res.json()),
        currentPersistentDisk ? Ajax().Disks.disk(currentPersistentDisk.googleProject, currentPersistentDisk.name).details() : null
      ])
      const filteredNewLeoImages = !!tool ? _.filter(image => _.includes(image.id, tools[tool].imageIds), newLeoImages) : newLeoImages

      const imageUrl = currentRuntimeDetails ? getImageUrl(currentRuntimeDetails) : _.find({ id: 'terra-jupyter-gatk' }, newLeoImages).image
      const foundImage = _.find({ image: imageUrl }, newLeoImages)

      /* eslint-disable indent */
      // TODO: open to feedback and still thinking about this...
      // Selected Leo image uses the following logic (psuedoCode not written in same way as code for clarity)
      // if found image (aka image associated with user's runtime) NOT in newLeoImages (the image dropdown list from bucket)
      //   user is using custom image
      // else if found Image NOT in filteredNewLeoImages (filtered based on analysis tool selection) and isAnalysisMode
      //   use default image for selected tool
      // else
      //   use imageUrl derived from users current runtime
      /* eslint-disable indent */
      const getSelectedImage = () => {
        if (foundImage) {
          if (!_.includes(foundImage, filteredNewLeoImages) && isAnalysisMode) {
            return _.find({ id: tools[tool].defaultImageId }, newLeoImages).image
          } else {
            return imageUrl
          }
        } else {
          return customMode
        }
      }

      setSelectedLeoImage(getSelectedImage())
      setLeoImages(filteredNewLeoImages)
      setCurrentRuntimeDetails(currentRuntimeDetails)
      setCurrentPersistentDiskDetails(currentPersistentDiskDetails)
      setCustomEnvImage(!foundImage ? imageUrl : '')
      setJupyterUserScriptUri(currentRuntimeDetails?.jupyterUserScriptUri || '')
      setBucketLocation(location)

      const locationType = location === defaultLocation ? locationTypes.default : locationTypes.region
      const { computeZone, computeRegion } = getRegionInfo(location || defaultLocation, locationType)
      const runtimeConfig = currentRuntimeDetails?.runtimeConfig
      const gpuConfig = runtimeConfig?.gpuConfig
      const newSparkMode = Utils.switchCase(runtimeConfig?.cloudService,
        [cloudServices.DATAPROC, () => runtimeConfig.numberOfWorkers === 0 ? 'master' : 'cluster'],
        [cloudServices.GCE, () => false],
        [Utils.DEFAULT, () => false] // for when there's no existing runtime
      )
      const isDataproc = !sparkMode && !runtimeConfig?.diskSize

      setSparkMode(newSparkMode)
      setComputeConfig({
        selectedPersistentDiskSize: currentPersistentDiskDetails?.size || defaultGcePersistentDiskSize,
        masterMachineType: runtimeConfig?.masterMachineType || runtimeConfig?.machineType,
        masterDiskSize: runtimeConfig?.masterDiskSize || runtimeConfig?.diskSize ||
          (isDataproc ? defaultDataprocDiskSize : defaultGceBootDiskSize),
        numberOfWorkers: runtimeConfig?.numberOfWorkers || 2,
        componentGatewayEnabled: runtimeConfig?.componentGatewayEnabled || !!newSparkMode,
        numberOfPreemptibleWorkers: runtimeConfig?.numberOfPreemptibleWorkers || 0,
        workerMachineType: runtimeConfig?.workerMachineType || defaultDataprocMachineType,
        workerDiskSize: runtimeConfig?.workerDiskSize || defaultDataprocDiskSize,
        gpuEnabled: (!!gpuConfig && !sparkMode) || false,
        hasGpu: !!gpuConfig,
        gpuType: gpuConfig?.gpuType || defaultGpuType,
        numGpus: gpuConfig?.numOfGpus || defaultNumGpus,
        computeZone,
        computeRegion
      })
    })

    doUseOnMount()
  })

  // Render functions -- begin
  const renderAboutPersistentDisk = () => {
    return div({ style: computeStyles.drawerContent }, [
      h(TitleBar, {
        id: titleId,
        style: computeStyles.titleBar,
        title: 'About persistent disk',
        hideCloseButton: isAnalysisMode,
        onDismiss,
        onPrevious: () => setViewMode()
      }),
      div({ style: { lineHeight: 1.5 } }, [
        p(['Your persistent disk is mounted in the directory ',
          code({ style: { fontWeight: 600 } }, [getCurrentMountDirectory(currentRuntimeDetails)]), br(),
          'Please save your analysis data in this directory to ensure it’s stored on your disk.']),
        p(['Terra attaches a persistent disk (PD) to your cloud compute in order to provide an option to keep the data on the disk after you delete your compute. PDs also act as a safeguard to protect your data in the case that something goes wrong with the compute.']),
        p(['A minimal cost per hour is associated with maintaining the disk even when the cloud compute is paused or deleted.']),
        p(['If you delete your cloud compute, but keep your PD, the PD will be reattached when creating the next cloud compute.']),
        h(Link, { href: 'https://support.terra.bio/hc/en-us/articles/360047318551', ...Utils.newTabLinkProps }, [
          'Learn more about persistent disks',
          icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })
        ])
      ])
    ])
  }

  const renderActionButton = () => {
    const { runtime: existingRuntime, hasGpu } = getExistingEnvironmentConfig()
    const { runtime: desiredRuntime } = getDesiredEnvironmentConfig()
    const commonButtonProps = Utils.cond([
        hasGpu && viewMode !== 'deleteEnvironmentOptions',
        () => ({ disabled: true, tooltip: 'Cloud compute with GPU(s) cannot be updated. Please delete it and create a new one.' })
      ], [
        computeConfig.gpuEnabled && _.isEmpty(getValidGpuTypesForZone(computeConfig.computeZone)) && viewMode !== 'deleteEnvironmentOptions',
        () => ({ disabled: true, tooltip: 'GPUs not available in this location.' })
      ], [
        !!currentPersistentDiskDetails && currentPersistentDiskDetails.zone.toUpperCase() !== computeConfig.computeZone && viewMode !==
        'deleteEnvironmentOptions',
        () => ({ disabled: true, tooltip: 'Cannot create environment in location differing from existing persistent disk location.' })
      ],
      () => ({ disabled: !hasChanges() || !!errors, tooltip: Utils.summarizeErrors(errors) })
    )
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
        }
      }, [
        Utils.cond(
          [viewMode === 'deleteEnvironmentOptions', () => 'Delete'],
          [existingRuntime, () => 'Update'],
          () => 'Create'
        )
      ])
    )
  }

  const renderApplicationConfigurationSection = () => {
    return div({ style: computeStyles.whiteBoxContainer }, [
      h(IdContainer, [
        id => h(Fragment, [
          div({ style: { marginBottom: '0.5rem' } }, [
            label({ htmlFor: id, style: computeStyles.label }, ['Application configuration']),
            h(InfoBox, { style: { marginLeft: '0.5rem' } }, [
              'The software application + programming languages + packages used when you create your cloud environment. '
            ])
          ]),
          div({ style: { height: 45 } }, [renderImageSelect({ id, includeCustom: true })])
        ])
      ]),
      Utils.switchCase(selectedLeoImage,
        [customMode, () => {
          return h(Fragment, [
            h(IdContainer, [
              id => h(Fragment, [
                label({ htmlFor: id, style: { ...computeStyles.label, display: 'block', margin: '0.5rem 0' } }, ['Container image']),
                div({ style: { height: 52 } }, [
                  h(ValidatedInput, {
                    inputProps: {
                      id,
                      placeholder: '<image name>:<tag>',
                      value: customEnvImage,
                      onChange: setCustomEnvImage
                    },
                    error: Utils.summarizeErrors(customEnvImage && errors?.customEnvImage)
                  })
                ])
              ])
            ]),
            div([
              'Custom environments ', b(['must ']), 'be based off one of the ',
              h(Link, { href: terraBaseImages, ...Utils.newTabLinkProps }, ['Terra Jupyter Notebook base images'])
            ])
          ])
        }],
        [Utils.DEFAULT, () => {
          return h(Fragment, [
            div({ style: { display: 'flex' } }, [
              h(Link, { onClick: () => setViewMode('packages') }, ['What’s installed on this environment?']),
              makeImageInfo({ marginLeft: 'auto' })
            ])
          ])
        }]
      )
    ])
  }

  const renderComputeProfileSection = computeExists => {
    const { cpu: currentNumCpus, memory: currentMemory } = findMachineType(mainMachineType)
    const validGpuOptions = getValidGpuTypes(currentNumCpus, currentMemory, computeConfig.computeZone)
    const validGpuNames = _.flow(_.map('name'), _.uniq, _.sortBy('price'))(validGpuOptions)
    const validGpuName = _.includes(displayNameForGpuType(computeConfig.gpuType), validGpuNames) ?
      displayNameForGpuType(computeConfig.gpuType) :
      _.head(validGpuNames)
    const validNumGpusOptions = _.flow(_.filter({ name: validGpuName }), _.map('numGpus'))(validGpuOptions)
    const validNumGpus = _.includes(computeConfig.numGpus, validNumGpusOptions) ? computeConfig.numGpus : _.head(validNumGpusOptions)
    const gpuCheckboxDisabled = computeExists ? !computeConfig.gpuEnabled : sparkMode
    const enableGpusSpan = span(
      ['Enable GPUs ', betaVersionTag])
    const gridStyle = { display: 'grid', gridGap: '1.3rem', alignItems: 'center', marginTop: '1rem' }

    return div({ style: { ...computeStyles.whiteBoxContainer, marginTop: '1rem' } }, [
      div({ style: { fontSize: '0.875rem', fontWeight: 600 } }, ['Cloud compute profile']),
      div([
        div({ style: { ...gridStyle, gridTemplateColumns: '0.25fr 4.5rem 1fr 5.5rem 1fr 5rem' } }, [
          // CPU & Memory Selection
          h(IdContainer, [
            id => h(Fragment, [
              label({ htmlFor: id, style: computeStyles.label }, ['CPUs']),
              div([
                h(Select, {
                  id,
                  isSearchable: false,
                  value: currentNumCpus,
                  onChange: ({ value }) => updateComputeConfig('masterMachineType',
                    _.find({ cpu: value }, validMachineTypes)?.name || mainMachineType),
                  options: _.flow(_.map('cpu'), _.union([currentNumCpus]), _.sortBy(_.identity))(validMachineTypes)
                })
              ])
            ])
          ]),
          h(IdContainer, [
            id => h(Fragment, [
              label({ htmlFor: id, style: computeStyles.label }, ['Memory (GB)']),
              div([
                h(Select, {
                  id,
                  isSearchable: false,
                  value: currentMemory,
                  onChange: ({ value }) => updateComputeConfig('masterMachineType',
                    _.find({ cpu: currentNumCpus, memory: value }, validMachineTypes)?.name || mainMachineType),
                  options: _.flow(_.filter({ cpu: currentNumCpus }), _.map('memory'), _.union([currentMemory]), _.sortBy(_.identity))(
                    validMachineTypes)
                })
              ])
            ])
          ]),
          // Disk Selection
          !isPersistentDisk ?
            h(DataprocDiskSelector, { value: computeConfig.masterDiskSize, onChange: updateComputeConfig('masterDiskSize') }) :
            div({ style: { gridColumnEnd: 'span 2' } })
        ]),
        // GPU Enabling
        !sparkMode && div({ style: { gridColumnEnd: 'span 6', marginTop: '1.5rem' } }, [
          h(LabeledCheckbox, {
            checked: computeConfig.gpuEnabled,
            disabled: gpuCheckboxDisabled,
            onChange: v => updateComputeConfig('gpuEnabled', v || computeConfig.hasGpu)
          }, [
            span({ style: { marginLeft: '0.5rem', ...computeStyles.label, verticalAlign: 'top' } }, [
              gpuCheckboxDisabled ?
                h(TooltipTrigger, { content: ['GPUs can be added only to Standard VM compute at creation time.'], side: 'right' }, [enableGpusSpan]) :
                enableGpusSpan
            ]),
            h(Link, {
              style: { marginLeft: '1rem', verticalAlign: 'top' },
              href: 'https://support.terra.bio/hc/en-us/articles/4403006001947', ...Utils.newTabLinkProps
            }, [
              'Learn more about GPU cost and restrictions.',
              icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })
            ])
          ])
        ]),
        // GPU Selection
        computeConfig.gpuEnabled && !sparkMode && div({ style: { ...gridStyle, gridTemplateColumns: '0.75fr 12rem 1fr 5.5rem 1fr 5.5rem' } }, [
          h(Fragment, [
            h(IdContainer, [
              id => h(Fragment, [
                label({ htmlFor: id, style: computeStyles.label }, ['GPU type']),
                div({ style: { height: 45 } }, [
                  h(Select, {
                    id,
                    isSearchable: false,
                    value: validGpuName,
                    onChange: ({ value }) => updateComputeConfig('gpuType', _.find({ name: value }, validGpuOptions)?.type),
                    options: validGpuNames
                  })
                ])
              ])
            ]),
            h(IdContainer, [
              id => h(Fragment, [
                label({ htmlFor: id, style: computeStyles.label }, ['GPUs']),
                div([
                  h(Select, {
                    id,
                    isSearchable: false,
                    value: validNumGpus,
                    onChange: ({ value }) => updateComputeConfig('numGpus',
                      _.find({ type: computeConfig.gpuType, numGpus: value }, validGpuOptions)?.numGpus),
                    options: validNumGpusOptions
                  })
                ])
              ])
            ])
          ])
        ]),
        div({ style: gridStyle }, [
          h(IdContainer, [
            id => div({ style: { gridColumnEnd: 'span 6', marginTop: '0.5rem' } }, [
              label({ htmlFor: id, style: computeStyles.label }, ['Startup script']),
              div({ style: { marginTop: '0.5rem' } }, [
                h(TextInput, {
                  id,
                  placeholder: 'URI',
                  value: jupyterUserScriptUri,
                  onChange: setJupyterUserScriptUri
                })
              ])
            ])
          ]),
          h(IdContainer, [
            id => div({ style: { gridColumnEnd: 'span 4', marginTop: '0.5rem' } }, [
              label({ htmlFor: id, style: computeStyles.label }, ['Compute type']),
              div({ style: { display: 'flex', alignItems: 'center', marginTop: '0.5rem' } }, [
                div({ style: { flex: 1, marginRight: '2rem' } }, [
                  h(Select, {
                    id,
                    isSearchable: false,
                    value: sparkMode,
                    onChange: ({ value }) => {
                      setSparkMode(value)
                      updateComputeConfig('componentGatewayEnabled', !!value)
                    },
                    options: [
                      { value: false, label: 'Standard VM', isDisabled: requiresSpark },
                      { value: 'master', label: 'Spark master node' },
                      { value: 'cluster', label: 'Spark cluster' }
                    ]
                  })
                ]),
                shouldDisplaySparkConsoleLink() && span([
                  h(Link, {
                    disabled: !canManageSparkConsole(),
                    tooltip: !canManageSparkConsole() && 'You must have a running Spark cluster or a master node.',
                    onClick: () => setViewMode('sparkConsole')
                  }, ['Manage and monitor Spark console'])
                ])
              ])
            ])
          ])
        ])
      ]),
      sparkMode === 'cluster' && fieldset({ style: { margin: '1.5rem 0 0', border: 'none', padding: 0 } }, [
        legend({ style: { padding: 0, ...computeStyles.label } }, ['Worker config']),
        // grid styling in a div because of display issues in chrome: https://bugs.chromium.org/p/chromium/issues/detail?id=375693
        div({ style: { ...gridStyle, gridTemplateColumns: '0.75fr 4.5rem 1fr 5rem 1fr 5rem', marginTop: '0.75rem' } }, [
          h(IdContainer, [
            id => h(Fragment, [
              label({ htmlFor: id, style: computeStyles.label }, ['Workers']),
              h(NumberInput, {
                id,
                min: 2,
                isClearable: false,
                onlyInteger: true,
                value: computeConfig.numberOfWorkers,
                disabled: !canUpdateNumberOfWorkers(),
                tooltip: !canUpdateNumberOfWorkers() ? 'Cloud Compute must be in Running status to change number of workers.' : undefined,
                onChange: updateComputeConfig('numberOfWorkers')
              })
            ])
          ]),
          h(IdContainer, [
            id => h(Fragment, [
              label({ htmlFor: id, style: computeStyles.label }, ['Preemptibles']),
              h(NumberInput, {
                id,
                min: 0,
                isClearable: false,
                onlyInteger: true,
                value: computeConfig.numberOfPreemptibleWorkers,
                disabled: !canUpdateNumberOfWorkers(),
                tooltip: !canUpdateNumberOfWorkers() ? 'Cloud Compute must be in Running status to change number of preemptibles' : undefined,
                onChange: updateComputeConfig('numberOfPreemptibleWorkers')
              })
            ])
          ]),
          div({ style: { gridColumnEnd: 'span 2' } }),
          h(WorkerSelector, {
            value: computeConfig.workerMachineType, machineTypeOptions: validMachineTypes, onChange: updateComputeConfig('workerMachineType')
          }),
          h(DataprocDiskSelector, { value: computeConfig.workerDiskSize, onChange: updateComputeConfig('workerDiskSize') })
        ])
      ]),
      div({ style: { ...gridStyle, gridTemplateColumns: '0.25fr 8.5rem 1fr 5.5rem 1fr 5rem', marginTop: '1.5rem' } }, [
        h(IdContainer, [
          id => div({ style: { gridColumnEnd: 'span 3' } }, [
            label({ htmlFor: id, style: computeStyles.label }, ['Location ']),
            betaVersionTag,
            h(InfoBox, { style: { marginLeft: '0.5rem' } }, [
              'Cloud environments run in the same region as the workspace bucket and can be changed as a beta feature.'
            ]),
            div({ style: { marginTop: '0.5rem' } }, [
              h(Select, {
                id,
                // Location dropdown is disabled for:
                // 1) If editing an existing environment (can't update location of existing environments)
                // 2) Workspace buckets that are either us-central1 or us multi-regional
                isDisabled: computeExists || isUSLocation(bucketLocation),
                isSearchable: false,
                value: computeConfig.computeRegion,
                onChange: ({ value, locationType }) => updateComputeLocation(value, locationType),
                options: _.flow(_.filter(l => l.value !== defaultLocation), _.sortBy('label'))(getAvailableComputeRegions(bucketLocation))
              })
            ])
          ])
        ])
      ])
    ])
  }

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
        { label: 'Running cloud compute cost', cost: Utils.formatUSD(runtimeConfigCost(getPendingRuntimeConfig())), unitLabel: 'per hr' },
        { label: 'Paused cloud compute cost', cost: Utils.formatUSD(runtimeConfigBaseCost(getPendingRuntimeConfig())), unitLabel: 'per hr' },
        {
          label: 'Persistent disk cost',
          cost: isPersistentDisk ? Utils.formatUSD(getPersistentDiskCostMonthly(getPendingDisk(), computeConfig.computeRegion)) : 'N/A',
          unitLabel: isPersistentDisk ? 'per month' : ''
        }
      ])
    ])
  }

  const renderCustomImageWarning = () => {
    return div({ style: { ...computeStyles.drawerContent, ...computeStyles.warningView } }, [
      h(TitleBar, {
        id: titleId,
        hideCloseButton: isAnalysisMode,
        style: computeStyles.titleBar,
        title: h(WarningTitle, ['Unverified Docker image']),
        onDismiss,
        onPrevious: () => setViewMode(undefined)
      }),
      div({ style: { lineHeight: 1.5 } }, [
        p([
          'You are about to create a virtual machine using an unverified Docker image. ',
          'Please make sure that it was created by you or someone you trust, using one of our ',
          h(Link, { href: terraBaseImages, ...Utils.newTabLinkProps }, ['Terra base images.']),
          ' Custom Docker images could potentially cause serious security issues.'
        ]),
        h(Link, { href: safeImageDocumentation, ...Utils.newTabLinkProps }, ['Learn more about creating safe and secure custom Docker images.']),
        p(['If you\'re confident that your image is safe, you may continue using it. Otherwise, go back to select another image.'])
      ]),
      div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
        renderActionButton()
      ])
    ])
  }

  const renderDifferentLocationWarning = () => {
    return div({ style: { ...computeStyles.drawerContent, ...computeStyles.warningView } }, [
      h(TitleBar, {
        id: titleId,
        hideCloseButton: isAnalysisMode,
        style: computeStyles.titleBar,
        title: h(WarningTitle, ['Compute location differs from workspace bucket location']),
        onDismiss,
        onPrevious: () => setViewMode(undefined)
      }),
      div({ style: { lineHeight: 1.5 } }, [
        p([
          'This cloud environment will be created in the region ',
          strong(`${computeConfig.computeRegion.toLowerCase()}.`),
          ' Copying data from your workspace bucket in ',
          strong(`${bucketLocation.toLowerCase()}`),
          ' may incur network egress charges.'
        ]),
        h(Link, { href: 'https://support.terra.bio/hc/en-us/articles/360058964552', ...Utils.newTabLinkProps }, [
          'For more information please read the documentation.',
          icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })
        ]),
        p(['If you want your VM in ',
          strong(`${computeConfig.computeRegion.toLowerCase()}`),
          ' continue. Otherwise, go back to select another location.'])
      ]),
      div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
        renderActionButton()
      ])
    ])
  }

  const renderNonUSLocationWarning = () => {
    return div({ style: { ...computeStyles.drawerContent, ...computeStyles.warningView } }, [
      h(TitleBar, {
        id: titleId,
        hideCloseButton: isAnalysisMode,
        style: computeStyles.titleBar,
        title: h(WarningTitle, ['Non-US Compute Location']),
        onDismiss,
        onPrevious: () => setViewMode(undefined)
      }),
      div({ style: { lineHeight: 1.5 } }, [
        p(['Having a Cloud Environment outside of the US is currently a beta feature.']),
        h(Link, { href: 'https://support.terra.bio/hc/en-us/articles/360058964552', ...Utils.newTabLinkProps }, [
          'For more information please read the documentation.',
          icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })
        ]),
        p(['If you want your VM in ',
          strong(`${computeConfig.computeRegion.toLowerCase()}`),
          ' continue. Otherwise, go back to select a US location.'])
      ]),
      div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
        renderActionButton()
      ])
    ])
  }

  const renderDebugger = () => {
    const makeHeader = text => div({ style: { fontSize: 20, margin: '0.5rem 0' } }, [text])
    const makeJSON = value => div({ style: { whiteSpace: 'pre-wrap', fontFamily: 'Menlo, monospace' } }, [JSON.stringify(value, null, 2)])
    return showDebugger ?
      div({ style: { position: 'fixed', top: 0, left: 0, bottom: 0, right: '50vw', backgroundColor: 'white', padding: '1rem', overflowY: 'auto' } }, [
        h(Link, { 'aria-label': 'Hide debugger', onClick: () => setShowDebugger(false), style: { position: 'absolute', top: 0, right: 0 } }, ['x']),
        makeHeader('Old Environment Config'),
        makeJSON(getExistingEnvironmentConfig()),
        makeHeader('New Environment Config'),
        makeJSON(getDesiredEnvironmentConfig()),
        makeHeader('Misc'),
        makeJSON({
          canUpdateRuntime: !!canUpdateRuntime(),
          willDeleteBuiltinDisk: !!willDeleteBuiltinDisk(),
          willDeletePersistentDisk: !!willDeletePersistentDisk(),
          willRequireDowntime: !!willRequireDowntime()
        })
      ]) :
      h(Link, { 'aria-label': 'Show debugger', onClick: () => setShowDebugger(true), style: { position: 'fixed', top: 0, left: 0, color: 'white' } },
        ['D'])
  }

  const renderDeleteDiskChoices = () => {
    const { runtime: existingRuntime } = getExistingEnvironmentConfig()

    return h(Fragment, [
      h(RadioBlock, {
        name: 'keep-persistent-disk',
        labelText: 'Keep persistent disk, delete application configuration and compute profile',
        checked: !deleteDiskSelected,
        onChange: () => setDeleteDiskSelected(false)
      }, [
        p(['Please save your analysis data in the directory ',
          code({ style: { fontWeight: 600 } }, [getCurrentMountDirectory(currentRuntimeDetails)]), ' to ensure it’s stored on your disk.']),
        p([
          'Deletes your application configuration and cloud compute profile, but detaches your persistent disk and saves it for later. ',
          'The disk will be automatically reattached the next time you create a cloud environment using the standard VM compute type.'
        ]),
        p({ style: { marginBottom: 0 } }, [
          'You will continue to incur persistent disk cost at ',
          span({ style: { fontWeight: 600 } },
            [Utils.formatUSD(getPersistentDiskCostMonthly(currentPersistentDiskDetails, computeConfig.computeRegion)), ' per month.'])
        ])
      ]),
      h(RadioBlock, {
        name: 'delete-persistent-disk',
        labelText: 'Delete everything, including persistent disk',
        checked: deleteDiskSelected,
        onChange: () => setDeleteDiskSelected(true),
        style: { marginTop: '1rem' }
      }, [
        p([
          'Deletes your persistent disk, which will also ', span({ style: { fontWeight: 600 } }, ['delete all files on the disk.'])
        ]),
        p({ style: { marginBottom: 0 } }, [
          'Also deletes your application configuration and cloud compute profile.'
        ])
      ]),
      existingRuntime.tool === 'RStudio' ? h(SaveFilesHelpRStudio) : h(SaveFilesHelp)
    ])
  }

  const renderDeleteEnvironmentOptions = () => {
    const { runtime: existingRuntime, persistentDisk: existingPersistentDisk } = getExistingEnvironmentConfig()
    return div({ style: { ...computeStyles.drawerContent, ...computeStyles.warningView } }, [
      h(TitleBar, {
        id: titleId,
        style: computeStyles.titleBar,
        title: h(WarningTitle, ['Delete environment options']),
        hideCloseButton: isAnalysisMode,
        onDismiss,
        onPrevious: () => {
          setViewMode(undefined)
          setDeleteDiskSelected(false)
        }
      }),
      div({ style: { lineHeight: '1.5rem' } }, [
        Utils.cond(
          [existingRuntime && existingPersistentDisk && !existingRuntime.persistentDiskAttached, () => {
            return h(Fragment, [
              h(RadioBlock, {
                name: 'delete-persistent-disk',
                labelText: 'Delete application configuration and cloud compute profile',
                checked: !deleteDiskSelected,
                onChange: () => setDeleteDiskSelected(false)
              }, [
                p({ style: { marginBottom: 0 } }, [
                  'Deletes your application configuration and cloud compute profile. This will also ',
                  span({ style: { fontWeight: 600 } }, ['delete all files on the built-in hard disk.'])
                ])
              ]),
              h(RadioBlock, {
                name: 'delete-persistent-disk',
                labelText: 'Delete persistent disk',
                checked: deleteDiskSelected,
                onChange: () => setDeleteDiskSelected(true),
                style: { marginTop: '1rem' }
              }, [
                p([
                  'Deletes your persistent disk, which will also ', span({ style: { fontWeight: 600 } }, ['delete all files on the disk.'])
                ]),
                p({ style: { marginBottom: 0 } }, [
                  'Since the persistent disk is not attached, the application configuration and cloud compute profile will remain.'
                ])
              ]),
              existingRuntime.tool === 'RStudio' ? h(SaveFilesHelpRStudio) : h(SaveFilesHelp)
            ])
          }],
          [existingRuntime && existingPersistentDisk, () => renderDeleteDiskChoices()],
          [!existingRuntime && existingPersistentDisk, () => {
            return h(Fragment, [
              h(RadioBlock, {
                name: 'delete-persistent-disk',
                labelText: 'Delete persistent disk',
                checked: deleteDiskSelected,
                onChange: () => setDeleteDiskSelected(true)
              }, [
                p([
                  'Deletes your persistent disk, which will also ', span({ style: { fontWeight: 600 } }, ['delete all files on the disk.'])
                ]),
                p({ style: { marginBottom: 0 } }, [
                  'If you want to permanently save some files from the disk before deleting it, you will need to create a new cloud environment to access it.'
                ])
              ]),
              // At this point there is no runtime (we're in the !existingRuntime block) to check the tool
              h(SaveFilesHelpRStudio)
            ])
          }],
          () => {
            return h(Fragment, [
              p([
                'Deleting your application configuration and cloud compute profile will also ',
                span({ style: { fontWeight: 600 } }, ['delete all files on the built-in hard disk.'])
              ]),
              existingRuntime.tool === 'RStudio' ? h(SaveFilesHelpRStudio) : h(SaveFilesHelp)
            ])
          }
        )
      ]),
      div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
        renderActionButton()
      ])
    ])
  }

  const renderEnvironmentWarning = () => {
    const { runtime: existingRuntime } = getExistingEnvironmentConfig()

    return div({ style: { ...computeStyles.drawerContent, ...computeStyles.warningView } }, [
      h(TitleBar, {
        id: titleId,
        style: computeStyles.titleBar,
        hideCloseButton: isAnalysisMode,
        title: h(WarningTitle, [
          Utils.cond(
            [willDetachPersistentDisk(), () => 'Replace application configuration and cloud compute profile for Spark'],
            [willDeleteBuiltinDisk() || willDeletePersistentDisk(), () => 'Data will be deleted'],
            [willRequireDowntime(), () => 'Downtime required']
          )
        ]),
        onDismiss,
        onPrevious: () => {
          setViewMode(undefined)
          setDeleteDiskSelected(false)
        }
      }),
      div({ style: { lineHeight: 1.5 } }, [
        Utils.cond(
          [willDetachPersistentDisk(), () => h(Fragment, [
            div([
              'You have requested to replace your existing application configuration and cloud compute profile to ones that support Spark. ',
              'This type of cloud compute does not support the persistent disk feature.'
            ]),
            div({ style: { margin: '1rem 0 0.5rem', fontSize: 16, fontWeight: 600 } }, ['What would you like to do with your disk?']),
            renderDeleteDiskChoices()
          ])],
          [willDeleteBuiltinDisk(), () => h(Fragment, [
            p([
              'This change requires rebuilding your cloud environment, which will ',
              span({ style: { fontWeight: 600 } }, ['delete all files on built-in hard disk.'])
            ]),
            existingRuntime.tool === 'RStudio' ? h(SaveFilesHelpRStudio) : h(SaveFilesHelp)
          ])],
          [willDeletePersistentDisk(), () => h(Fragment, [
            p([
              'To reduce the size of the PD, the existing PD will be deleted and a new one will be created and attached to your virtual machine instance. This will ',
              span({ style: { fontWeight: 600 } }, ['delete all files on the disk.'])
            ]),
            existingRuntime.tool === 'RStudio' ? h(SaveFilesHelpRStudio) : h(SaveFilesHelp)
          ])],
          [willRequireDowntime(), () => h(Fragment, [
            p(['This change will require temporarily shutting down your cloud environment. You will be unable to perform analysis for a few minutes.']),
            p(['Your existing data will be preserved during this update.'])
          ])]
        )
      ]),
      div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
        renderActionButton()
      ])
    ])
  }

  const renderImageSelect = ({ includeCustom, ...props }) => {
    const getImages = predicate => _.flow(
      _.filter(predicate),
      _.map(({ label, image }) => ({ label, value: image }))
    )(leoImages)

    return h(GroupedSelect, {
      ...props,
      maxMenuHeight: '25rem',
      value: selectedLeoImage,
      onChange: ({ value }) => {
        const requiresSpark = _.find({ image: value }, leoImages)?.requiresSpark
        const newSparkMode = requiresSpark ? (sparkMode || 'master') : false
        setSelectedLeoImage(value)
        setCustomEnvImage('')
        setSparkMode(newSparkMode)
        updateComputeConfig('componentGatewayEnabled', !!newSparkMode)
      },
      isSearchable: true,
      isClearable: false,
      options: [
        {
          label: 'TERRA-MAINTAINED JUPYTER ENVIRONMENTS',
          options: getImages(({ isCommunity, isRStudio }) => (!isCommunity && !isRStudio))
        },
        {
          label: 'COMMUNITY-MAINTAINED JUPYTER ENVIRONMENTS (verified partners)',
          options: getImages(_.get(['isCommunity']))
        },
        {
          label: 'COMMUNITY-MAINTAINED RSTUDIO ENVIRONMENTS (verified partners)',
          options: getImages(_.get(['isRStudio']))
        },
        ...(includeCustom ? [{
          label: 'OTHER ENVIRONMENTS',
          options: [{ label: 'Custom Environment', value: customMode }]
        }] : [])
      ]
    })
  }

  const renderMainForm = () => {
    const { runtime: existingRuntime, persistentDisk: existingPersistentDisk } = getExistingEnvironmentConfig()
    const { cpu, memory } = findMachineType(mainMachineType)
    const renderTitleAndTagline = () => {
      return h(Fragment, [
        h(TitleBar, {
          id: titleId,
          style: { marginBottom: '0.5rem' },
          title: 'Cloud Environment',
          hideCloseButton: isAnalysisMode,
          onDismiss
        }),
        div(['A cloud environment consists of application configuration, cloud compute and persistent disk(s).'])
      ])
    }
    const renderBottomButtons = () => {
      return div({ style: { display: 'flex', marginTop: '2rem' } }, [
        (!!existingRuntime || !!existingPersistentDisk) && h(ButtonSecondary, {
          onClick: () => setViewMode('deleteEnvironmentOptions')
        }, [
          Utils.cond(
            [!!existingRuntime && !existingPersistentDisk, () => 'Delete Runtime'],
            [!existingRuntime && !!existingPersistentDisk, () => 'Delete Persistent Disk'],
            () => 'Delete Environment Options'
          )
        ]),
        div({ style: { flex: 1 } }),
        !simplifiedForm && renderActionButton()
      ])
    }
    const renderDiskText = () => {
      return span({ style: { fontWeight: 600 } }, [computeConfig.selectedPersistentDiskSize, ' GB persistent disk'])
    }
    return simplifiedForm ?
      div({ style: computeStyles.drawerContent }, [
        renderTitleAndTagline(),
        div({ style: { ...computeStyles.whiteBoxContainer, marginTop: '1rem' } }, [
          div({ style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' } }, [
            div({ style: { marginRight: '2rem' } }, [
              div({ style: { fontSize: 16, fontWeight: 600 } }, ['Use default environment']),
              ul({ style: { paddingLeft: '1rem', marginBottom: 0, lineHeight: 1.5 } }, [
                li([
                  div([packageLabel]),
                  h(Link, { onClick: () => setViewMode('packages') }, ['What’s installed on this environment?'])
                ]),
                li({ style: { marginTop: '1rem' } }, [
                  'Default compute size of ', span({ style: { fontWeight: 600 } }, [cpu, ' CPU(s)']), ', ',
                  span({ style: { fontWeight: 600 } }, [memory, ' GB memory']), ', and ',
                  existingPersistentDisk ?
                    h(Fragment, ['your existing ', renderDiskText()]) :
                    h(Fragment, ['a ', renderDiskText(), ' to keep your data even after you delete your compute'])
                ]),
                li({ style: { marginTop: '1rem' } }, [
                  h(Link, { onClick: handleLearnMoreAboutPersistentDisk }, ['Learn more about Persistent disks and where your disk is mounted'])
                ]),
                li({ style: { marginTop: '1rem' } }, [
                  p([
                    'This cloud environment will be created in the region ',
                    strong(computeConfig.computeRegion.toLowerCase()), '. ',
                    'Copying data from a bucket in a different region may incur network egress charges. ',
                    'For more information, particularly if you work with data stored in multiple cloud regions, please read the ',
                    h(Link, { href: 'https://support.terra.bio/hc/en-us/articles/360058964552', ...Utils.newTabLinkProps }, [
                      'documentation.',
                      icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })
                    ])
                  ])
                ])
              ])
            ]),
            renderActionButton()
          ]),
          renderCostBreakdown()
        ]),
        div({ style: { ...computeStyles.whiteBoxContainer, marginTop: '1rem' } }, [
          div({ style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } }, [
            div({ style: { fontSize: 16, fontWeight: 600 } }, ['Create custom environment']),
            h(ButtonOutline, { onClick: () => setSimplifiedForm(false) }, ['Customize'])
          ])
        ]),
        renderBottomButtons()
      ]) :
      h(Fragment, [
        div({ style: { padding: '1.5rem', borderBottom: `1px solid ${colors.dark(0.4)}` } }, [
          renderTitleAndTagline(),
          renderCostBreakdown()
        ]),
        div({ style: { padding: '1.5rem', overflowY: 'auto', flex: 'auto' } }, [
          renderApplicationConfigurationSection(),
          renderComputeProfileSection(existingRuntime),
          !!isPersistentDisk && renderPersistentDiskSection(),
          !sparkMode && !isPersistentDisk && div({ style: { ...computeStyles.whiteBoxContainer, marginTop: '1rem' } }, [
            div([
              'Time to upgrade your cloud environment. Terra’s new persistent disk feature will safeguard your work and data. ',
              h(Link, { onClick: handleLearnMoreAboutPersistentDisk }, ['Learn more about Persistent disks and where your disk is mounted'])
            ]),
            h(ButtonOutline, {
              style: { marginTop: '1rem' },
              tooltip: 'Upgrade your environment to use a persistent disk. This will require a one-time deletion of your current built-in disk, but after that your data will be stored and preserved on the persistent disk.',
              onClick: () => setUpgradeDiskSelected(true)
            }, ['Upgrade'])
          ]),
          renderBottomButtons()
        ])
      ])
  }

  const renderPackages = () => {
    return div({ style: computeStyles.drawerContent }, [
      h(TitleBar, {
        id: titleId,
        style: computeStyles.titleBar,
        title: 'Installed packages',
        hideCloseButton: isAnalysisMode,
        onDismiss,
        onPrevious: () => setViewMode(undefined)
      }),
      renderImageSelect({ 'aria-label': 'Select Environment' }),
      makeImageInfo({ margin: '1rem 0 0.5rem' }),
      packages && h(ImageDepViewer, { packageLink: packages })
    ])
  }

  const renderSparkConsole = () => {
    const { namespace, name } = getWorkspaceObject()

    return div({ style: computeStyles.drawerContent }, [
      h(TitleBar, {
        id: titleId,
        title: 'Spark Console',
        style: { marginBottom: '0.5rem' },
        hideCloseButton: isAnalysisMode,
        onDismiss,
        onPrevious: () => setViewMode(undefined)
      }),
      p([
        `Some of the Spark cluster components such as Apache Hadoop and Apache Spark
         provide web interfaces. These interfaces can be used to manage and monitor cluster
         resources and facilities, such as the YARN resource manager, the Hadoop Distributed
         File System (HDFS), MapReduce, and Spark.`
      ]),
      h(SparkInterface, { sparkInterface: sparkInterfaces.yarn, namespace, name, onDismiss }),
      h(SparkInterface, { sparkInterface: sparkInterfaces.appHistory, namespace, name, onDismiss }),
      h(SparkInterface, { sparkInterface: sparkInterfaces.sparkHistory, namespace, name, onDismiss }),
      h(SparkInterface, { sparkInterface: sparkInterfaces.jobHistory, namespace, name, onDismiss })
    ])
  }

  const renderPersistentDiskSection = () => {
    return div({ style: { ...computeStyles.whiteBoxContainer, marginTop: '1rem' } }, [
      h(IdContainer, [
        id => h(div, { style: { display: 'flex', flexDirection: 'column' } }, [
          label({ htmlFor: id, style: computeStyles.label }, ['Persistent disk size (GB)']),
          div({ style: { marginTop: '0.5rem' } }, [
            'Persistent disks store analysis data. ',
            h(Link, { onClick: handleLearnMoreAboutPersistentDisk }, ['Learn more about persistent disks and where your disk is mounted.'])
          ]),
          h(NumberInput, {
            id,
            min: 10,
            max: 64000,
            isClearable: false,
            onlyInteger: true,
            value: computeConfig.selectedPersistentDiskSize,
            style: { marginTop: '0.5rem', width: '5rem' },
            onChange: updateComputeConfig('selectedPersistentDiskSize')
          })
        ])
      ])
    ])
  }
  // Render functions -- end

  // Render
  return h(Fragment, [
    Utils.switchCase(viewMode,
      ['packages', renderPackages],
      ['aboutPersistentDisk', renderAboutPersistentDisk],
      ['sparkConsole', renderSparkConsole],
      ['customImageWarning', renderCustomImageWarning],
      ['environmentWarning', renderEnvironmentWarning],
      ['differentLocationWarning', renderDifferentLocationWarning],
      ['nonUSLocationWarning', renderNonUSLocationWarning],
      ['deleteEnvironmentOptions', renderDeleteEnvironmentOptions],
      [Utils.DEFAULT, renderMainForm]
    ),
    loading && spinnerOverlay,
    showDebugPanel && renderDebugger()
  ])
}

export const ComputeModal = withModalDrawer({ width: 675, 'aria-labelledby': titleId })(
  ComputeModalBase
)
