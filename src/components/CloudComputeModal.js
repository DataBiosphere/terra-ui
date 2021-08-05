import _ from 'lodash/fp'
import { Fragment, useEffect, useState } from 'react'
import { b, br, code, div, fieldset, h, label, legend, li, p, span, ul } from 'react-hyperscript-helpers'
import {
  ButtonOutline, ButtonPrimary, ButtonSecondary, GroupedSelect, IdContainer, LabeledCheckbox, Link, Select, spinnerOverlay, WarningTitle
} from 'src/components/common'
import { icon } from 'src/components/icons'
import { ImageDepViewer } from 'src/components/ImageDepViewer'
import { NumberInput, TextInput, ValidatedInput } from 'src/components/input'
import { withModalDrawer } from 'src/components/ModalDrawer'
import { tools } from 'src/components/notebook-utils'
import { InfoBox } from 'src/components/PopupTrigger'
import { SaveFilesHelp } from 'src/components/runtime-common'
import TitleBar from 'src/components/TitleBar'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { cloudServices, machineTypes } from 'src/data/machines'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import Events, { extractWorkspaceDetails } from 'src/libs/events'
import { versionTag } from 'src/libs/logos'
import {
  currentRuntime, DEFAULT_DATAPROC_DISK_SIZE, DEFAULT_DISK_SIZE, DEFAULT_GCE_BOOT_DISK_SIZE, DEFAULT_GCE_PERSISTENT_DISK_SIZE, DEFAULT_GPU_TYPE,
  DEFAULT_NUM_GPUS,
  defaultDataprocMachineType,
  defaultGceMachineType, displayNameForGpuType,
  findMachineType,
  getDefaultMachineType, getValidGpuTypes,
  persistentDiskCostMonthly,
  RadioBlock,
  runtimeConfigBaseCost, runtimeConfigCost
} from 'src/libs/runtime-utils'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import validate from 'validate.js'


// Change to true to enable a debugging panel (intended for dev mode only)
const showDebugPanel = false
const titleId = 'cloud-compute-modal-title'

// TODO Factor out common pieces with NewGalaxyModal.styles into runtime-utils
const styles = {
  label: { fontWeight: 600, whiteSpace: 'pre' },
  titleBar: { marginBottom: '1rem' },
  drawerContent: { display: 'flex', flexDirection: 'column', flex: 1, padding: '1.5rem' },
  warningView: { backgroundColor: colors.warning(0.1) },
  whiteBoxContainer: { padding: '1.5rem', borderRadius: 3, backgroundColor: 'white' }
}

const CUSTOM_MODE = '__custom_mode__'

// TODO Capitalize the constants below?
const terraDockerBaseGithubUrl = 'https://github.com/databiosphere/terra-docker'
const terraBaseImages = `${terraDockerBaseGithubUrl}#terra-base-images`
const safeImageDocumentation = 'https://support.terra.bio/hc/en-us/articles/360034669811'

// Distilled from https://github.com/docker/distribution/blob/95daa793b83a21656fe6c13e6d5cf1c3999108c7/reference/regexp.go
const imageValidationRegexp = /^[A-Za-z0-9]+[\w./-]+(?::\w[\w.-]+)?(?:@[\w+.-]+:[A-Fa-f0-9]{32,})?$/

const WorkerSelector = ({ value, machineTypeOptions, onChange }) => {
  const { cpu: currentCpu, memory: currentMemory } = findMachineType(value)
  return h(Fragment, [
    h(IdContainer, [
      id => h(Fragment, [
        label({ htmlFor: id, style: styles.label }, ['CPUs']),
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
        label({ htmlFor: id, style: styles.label }, ['Memory (GB)']),
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
      label({ htmlFor: id, style: styles.label }, ['Disk size (GB)']),
      h(NumberInput, {
        id,
        min: 60, // less than this size causes failures in cluster creation
        max: 64000,
        isClearable: false,
        onlyInteger: true,
        value,
        onChange
      })
    ])
  ])
}

const getImageUrl = runtimeDetails => {
  return _.find(({ imageType }) => _.includes(imageType, ['Jupyter', 'RStudio']), runtimeDetails?.runtimeImages)?.imageUrl
}

const getCurrentRuntime = runtimes => currentRuntime(runtimes)

const getCurrentPersistentDisk = (runtimes, persistentDisks) => {
  const currentRuntime = getCurrentRuntime()
  const id = currentRuntime?.runtimeConfig.persistentDiskId
  const attachedIds = _.without([undefined], _.map(runtime => runtime.runtimeConfig.persistentDiskId, runtimes))
  return id ?
    _.find({ id }, persistentDisks) :
    _.last(_.sortBy('auditInfo.createdDate', _.filter(({ id, status }) => status !== 'Deleting' && !_.includes(id, attachedIds), persistentDisks)))
}

export const CloudComputeModalBase = Utils.withDisplayName('CloudComputeModal')(
  ({ onDismiss, onSuccess, runtimes, persistentDisks, tool, workspace, isAnalysisMode = false }) => {
    // TODO Should be able to remove some of the block below before merging
    const getWorkspaceObj = () => workspace.workspace
    const isDataproc = (sparkMode, runtimeConfig) => !sparkMode && !runtimeConfig?.diskSize

    const googleProject = getWorkspaceObj()

    // State -- begin

    const [showDebugger, setShowDebugger] = useState(false)
    const [loading, setLoading] = useState(false)
    const [currentRuntimeDetails, setCurrentRuntimeDetails] = useState(getCurrentRuntime(runtimes))
    const [currentPersistentDiskDetails, setCurrentPersistentDiskDetails] = useState(getCurrentPersistentDisk(runtimes, persistentDisks))
    const [viewMode, setViewMode] = useState(undefined)
    const [deleteDiskSelected, setDeleteDiskSelected] = useState(false)
    const [upgradeDiskSelected, setUpgradeDiskSelected] = useState(false)
    const [simplifiedForm, setSimplifiedForm] = useState(!currentRuntimeDetails)
    const [leoImages, setLeoImages] = useState([])
    const [selectedLeoImage, setSelectedLeoImage] = useState(undefined)
    const [customEnvImage, setCustomEnvImage] = useState(undefined)
    const [jupyterUserScriptUri, setJupyterUserScriptUri] = useState(undefined)

    const runtimeConfig = currentRuntimeDetails?.runtimeConfig
    const gpuConfig = runtimeConfig?.gpuConfig

    const [selectedPersistentDiskSize, setSelectedPersistentDiskSize] = useState(currentPersistentDiskDetails?.size || DEFAULT_GCE_PERSISTENT_DISK_SIZE)
    const [sparkMode, setSparkMode] = useState(runtimeConfig?.cloudService === cloudServices.DATAPROC ? (runtimeConfig.numberOfWorkers === 0 ? 'master' : 'cluster') : false)
    const [masterMachineType, setMasterMachineType] = useState(runtimeConfig?.masterMachineType || runtimeConfig?.machineType)
    const [masterDiskSize, setMasterDiskSize] = useState(runtimeConfig?.masterDiskSize || runtimeConfig?.diskSize || (isDataproc(sparkMode, runtimeConfig) ? DEFAULT_DATAPROC_DISK_SIZE : DEFAULT_GCE_BOOT_DISK_SIZE))
    const [numberOfWorkers, setNumberOfWorkers] = useState(runtimeConfig?.numberOfWorkers || 2)
    const [numberOfPreemptibleWorkers, setNumberOfPreemptibleWorkers] = useState(runtimeConfig?.numberOfPreemptibleWorkers || 0)
    const [workerMachineType, setWorkerMachineType] = useState(runtimeConfig?.workerMachineType || defaultDataprocMachineType)
    const [workerDiskSize, setWorkerDiskSize] = useState(runtimeConfig?.workerDiskSize || DEFAULT_DATAPROC_DISK_SIZE)
    const [gpuEnabled, setGpuEnabled] = useState((!!gpuConfig && !sparkMode) || false)
    const [hasGpu, setHasGpu] = useState(!!gpuConfig)
    const [gpuType, setGpuType] = useState(gpuConfig?.gpuType || DEFAULT_GPU_TYPE)
    const [numGpus, setNumGpus] = useState(gpuConfig?.numOfGpus || DEFAULT_NUM_GPUS)

    // State -- end

    const isCustomImage = selectedLeoImage === CUSTOM_MODE
    const { version, updated, packages, requiresSpark, label: packageLabel } = _.find({ image: selectedLeoImage }, leoImages) || {}

    const minRequiredMemory = sparkMode ? 7.5 : 3.75
    const validMachineTypes = _.filter(({ memory }) => memory >= minRequiredMemory, machineTypes)
    const mainMachineType = _.find({ name: masterMachineType }, validMachineTypes)?.name || getDefaultMachineType(sparkMode)
    const machineTypeConstraints = { inclusion: { within: _.map('name', validMachineTypes), message: 'is not supported' } }
    const errors = validate(
      { mainMachineType, workerMachineType, customEnvImage },
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

    const makeImageInfo = style => div({ style: { whiteSpace: 'pre', ...style } }, [
      div({ style: Style.proportionalNumbers }, ['Updated: ', updated ? Utils.makeStandardDate(updated) : null]),
      div(['Version: ', version || null])
    ])

    const getCurrentMountDirectory = currentRuntimeDetails => {
      const rstudioMountPoint = '/home/rstudio'
      const jupyterMountPoint = '/home/jupyter/notebooks'
      const noMountDirectory = `${jupyterMountPoint} for Jupyter environments and ${rstudioMountPoint} for RStudio environments`
      return currentRuntimeDetails?.labels.tool ? (currentRuntimeDetails?.labels.tool === 'RStudio' ? rstudioMountPoint : jupyterMountPoint) : noMountDirectory
    }

    const willDetachPersistentDisk = () => {
      const { runtime: desiredRuntime } = getDesiredEnvironmentConfig()
      return desiredRuntime.cloudService === cloudServices.DATAPROC && hasAttachedDisk()
    }

    const shouldUsePersistentDisk = () => {
      return !sparkMode && (!currentRuntimeDetails?.runtimeConfig.diskSize || upgradeDiskSelected)
    }

    const willDeletePersistentDisk = () => {
      const { persistentDisk: existingPersistentDisk } = getExistingEnvironmentConfig()
      return existingPersistentDisk && !canUpdatePersistentDisk()
    }

    const willDeleteBuiltinDisk = () => {
      const { runtime: existingRuntime } = getExistingEnvironmentConfig()
      return (existingRuntime?.diskSize || existingRuntime?.masterDiskSize) && !canUpdateRuntime()
    }

    const willRequireDowntime = () => {
      const { runtime: existingRuntime } = getExistingEnvironmentConfig()
      return existingRuntime && (!canUpdateRuntime() || isStopRequired())
    }

    const hasAttachedDisk = () => {
      const { runtime: existingRuntime } = getExistingEnvironmentConfig()
      return existingRuntime?.persistentDiskAttached
    }

    const canUpdateNumberOfWorkers = () => {
      return !currentRuntimeDetails || currentRuntimeDetails.status === 'Running'
    }

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

    const hasChanges = () => {
      const existingConfig = getExistingEnvironmentConfig()
      const desiredConfig = getDesiredEnvironmentConfig()

      return !_.isEqual(existingConfig, desiredConfig)
    }

    // Original diagram (without PD) for update runtime logic: https://drive.google.com/file/d/1mtFFecpQTkGYWSgPlaHksYaIudWHa0dY/view
    const isStopRequired = () => {
      const { runtime: existingRuntime } = getExistingEnvironmentConfig()
      const { runtime: desiredRuntime } = getDesiredEnvironmentConfig()

      return canUpdateRuntime() &&
        (existingRuntime.cloudService === cloudServices.GCE ?
          existingRuntime.machineType !== desiredRuntime.machineType :
          existingRuntime.masterMachineType !== desiredRuntime.masterMachineType)
    }

    const getExistingEnvironmentConfig = () => {
      const runtimeConfig = currentRuntimeDetails?.runtimeConfig
      const cloudService = runtimeConfig?.cloudService
      const numberOfWorkers = runtimeConfig?.numberOfWorkers || 0
      const gpuConfig = runtimeConfig?.gpuConfig
      return {
        hasGpu,
        runtime: currentRuntimeDetails ? {
          cloudService,
          toolDockerImage: getImageUrl(currentRuntimeDetails),
          ...(currentRuntimeDetails?.jupyterUserScriptUri && { jupyterUserScriptUri: currentRuntimeDetails?.jupyterUserScriptUri }),
          ...(cloudService === cloudServices.GCE ? {
            machineType: runtimeConfig.machineType || defaultGceMachineType,
            ...(hasGpu && gpuConfig ? { gpuConfig } : {}),
            bootDiskSize: runtimeConfig.bootDiskSize,
            ...(runtimeConfig.persistentDiskId ? {
              persistentDiskAttached: true
            } : {
              diskSize: runtimeConfig.diskSize
            })
          } : {
            masterMachineType: runtimeConfig.masterMachineType || defaultDataprocMachineType,
            masterDiskSize: runtimeConfig.masterDiskSize || 100,
            numberOfWorkers,
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
      const desiredNumberOfWorkers = sparkMode === 'cluster' ? numberOfWorkers : 0
      return {
        hasGpu,
        runtime: Utils.cond(
          [(viewMode !== 'deleteEnvironmentOptions'), () => {
            return {
              cloudService,
              toolDockerImage: selectedLeoImage === CUSTOM_MODE ? customEnvImage : selectedLeoImage,
              ...(jupyterUserScriptUri && { jupyterUserScriptUri }),
              ...(cloudService === cloudServices.GCE ? {
                machineType: masterMachineType || defaultGceMachineType,
                ...(gpuEnabled ? { gpuConfig: { gpuType, numOfGpus: numGpus } } : {}),
                bootDiskSize: existingRuntime?.bootDiskSize,
                ...(shouldUsePersistentDisk() ? {
                  persistentDiskAttached: true
                } : {
                  diskSize: masterDiskSize
                })
              } : {
                masterMachineType: masterMachineType || defaultDataprocMachineType,
                masterDiskSize,
                numberOfWorkers: desiredNumberOfWorkers,
                ...(desiredNumberOfWorkers && {
                  numberOfPreemptibleWorkers,
                  workerMachineType: workerMachineType || defaultDataprocMachineType,
                  workerDiskSize
                })
              })
            }
          }],
          [!deleteDiskSelected || existingRuntime?.persistentDiskAttached, () => undefined],
          () => existingRuntime
        ),
        persistentDisk: Utils.cond(
          [deleteDiskSelected, () => undefined],
          [viewMode !== 'deleteEnvironmentOptions' && shouldUsePersistentDisk(), () => ({ size: selectedPersistentDiskSize })],
          () => existingPersistentDisk
        )
      }
    }

    /**
     * Transforms the new environment config into the shape of runtime config
     * returned from leonardo. The cost calculation functions expect that shape,
     * so this is necessary to compute the cost for potential new configurations.
     */
    const getPendingRuntimeConfig = () => {
      const { runtime: desiredRuntime } = getDesiredEnvironmentConfig()

      return {
        cloudService: desiredRuntime.cloudService,
        ...(desiredRuntime.cloudService === cloudServices.GCE ? {
          machineType: desiredRuntime.machineType || defaultGceMachineType,
          bootDiskSize: desiredRuntime.bootDiskSize,
          ...(desiredRuntime.gpuConfig ? { gpuConfig: desiredRuntime.gpuConfig } : {}),
          ...(desiredRuntime.diskSize ? { diskSize: desiredRuntime.diskSize } : {})
        } : {
          masterMachineType: desiredRuntime.masterMachineType || defaultDataprocMachineType,
          masterDiskSize: desiredRuntime.masterDiskSize,
          numberOfWorkers: desiredRuntime.numberOfWorkers,
          ...(desiredRuntime.numberOfWorkers && {
            numberOfPreemptibleWorkers: desiredRuntime.numberOfPreemptibleWorkers,
            workerMachineType: desiredRuntime.workerMachineType,
            workerDiskSize: desiredRuntime.workerDiskSize
          })
        })
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

    const sendCloudEnvironmentMetrics = () => {
      const { runtime: desiredRuntime, persistentDisk: desiredPersistentDisk } = getDesiredEnvironmentConfig()
      const { runtime: existingRuntime, persistentDisk: existingPersistentDisk } = getExistingEnvironmentConfig()
      const desiredMachineType = desiredRuntime && (desiredRuntime.cloudService === cloudServices.GCE ? desiredRuntime.machineType : desiredRuntime.masterMachineType)
      const existingMachineType = existingRuntime && (existingRuntime?.cloudService === cloudServices.GCE ? existingRuntime.machineType : existingRuntime.masterMachineType)
      const { cpu: desiredRuntimeCpus, memory: desiredRuntimeMemory } = findMachineType(desiredMachineType)
      const { cpu: existingRuntimeCpus, memory: existingRuntimeMemory } = findMachineType(existingMachineType)
      const metricsEvent = Utils.cond(
        [(viewMode === 'deleteEnvironmentOptions'), () => 'cloudEnvironmentDelete'],
        [(!!existingRuntime), () => 'cloudEnvironmentUpdate'],
        () => 'cloudEnvironmentCreate'
      )

      Ajax().Metrics.captureEvent(Events[metricsEvent], {
        ...extractWorkspaceDetails(getWorkspaceObj()),
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
        desiredPersistentDisk_costPerMonth: (desiredPersistentDisk && persistentDiskCostMonthly(getPendingDisk())),
        ..._.mapKeys(key => `existingPersistentDisk_${key}`, existingPersistentDisk),
        isDefaultConfig: !!simplifiedForm
      })
    }

    const applyChanges = _.flow(
      Utils.withBusyState(() => setLoading(true)),
      withErrorReporting('Error creating cloud environment')
    )(async () => {
      const { runtime: existingRuntime, persistentDisk: existingPersistentDisk } = getExistingEnvironmentConfig()
      const { runtime: desiredRuntime, persistentDisk: desiredPersistentDisk } = getDesiredEnvironmentConfig()
      const shouldUpdatePersistentDisk = canUpdatePersistentDisk() && !_.isEqual(desiredPersistentDisk, existingPersistentDisk)
      const shouldDeletePersistentDisk = existingPersistentDisk && !canUpdatePersistentDisk()
      const shouldUpdateRuntime = canUpdateRuntime() && !_.isEqual(desiredRuntime, existingRuntime)
      const shouldDeleteRuntime = existingRuntime && !canUpdateRuntime()
      const shouldCreateRuntime = !canUpdateRuntime() && desiredRuntime
      const { name, bucketName, googleProject } = getWorkspaceObj()

      const runtimeConfig = desiredRuntime && {
        cloudService: desiredRuntime.cloudService,
        ...(desiredRuntime.cloudService === cloudServices.GCE ? {
          machineType: desiredRuntime.machineType || defaultGceMachineType,
          ...(desiredRuntime.diskSize ? {
            diskSize: desiredRuntime.diskSize
          } : {
            persistentDisk: existingPersistentDisk && !shouldDeletePersistentDisk ? {
              name: currentPersistentDiskDetails.name
            } : {
              name: Utils.generatePersistentDiskName(),
              size: desiredPersistentDisk.size,
              labels: { saturnWorkspaceName: name }
            }
          }),
          ...(gpuEnabled && { gpuConfig: { gpuType, numOfGpus: numGpus } })
        } : {
          masterMachineType: desiredRuntime.masterMachineType || defaultDataprocMachineType,
          masterDiskSize: desiredRuntime.masterDiskSize,
          numberOfWorkers: desiredRuntime.numberOfWorkers,
          ...(desiredRuntime.numberOfWorkers && {
            numberOfPreemptibleWorkers: desiredRuntime.numberOfPreemptibleWorkers,
            workerMachineType: desiredRuntime.workerMachineType,
            workerDiskSize: desiredRuntime.workerDiskSize
          })
        })
      }

      const customEnvVars = {
        WORKSPACE_NAME: name,
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
          labels: { saturnWorkspaceName: name },
          customEnvironmentVariables: customEnvVars,
          ...(desiredRuntime.jupyterUserScriptUri ? { jupyterUserScriptUri: desiredRuntime.jupyterUserScriptUri } : {})
        })
      }

      onSuccess()
    })

    // Helper functions -- end

    // componentDidMount() logic
    useEffect(() => _.flow(
      withErrorReporting('Error loading cloud environment'),
      Utils.withBusyState(v => setLoading(v))
    )(async () => {
      const { googleProject } = getWorkspaceObj()
      const currentRuntime = getCurrentRuntime()
      const currentPersistentDisk = getCurrentPersistentDisk()

      Ajax().Metrics.captureEvent(Events.cloudEnvironmentConfigOpen, {
        existingConfig: !!currentRuntime, ...extractWorkspaceDetails(getWorkspaceObj())
      })
      const [currentRuntimeDetails, newLeoImages, currentPersistentDiskDetails] = await Promise.all([
        currentRuntime ? Ajax().Runtimes.runtime(currentRuntime.googleProject, currentRuntime.runtimeName).details() : null,
        Ajax().Buckets.getObjectPreview('terra-docker-image-documentation', 'terra-docker-versions.json', googleProject, true).then(res => res.json()),
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
          return CUSTOM_MODE
        }
      }

      setSelectedLeoImage(getSelectedImage())
      setLeoImages(filteredNewLeoImages)
      setCurrentRuntimeDetails(currentRuntimeDetails)
      setCurrentPersistentDiskDetails(currentPersistentDiskDetails)
      setCustomEnvImage(!foundImage ? imageUrl : '')
      setJupyterUserScriptUri(currentRuntimeDetails?.jupyterUserScriptUri || '')

      const runtimeConfig = currentRuntimeDetails?.runtimeConfig
      const gpuConfig = runtimeConfig?.gpuConfig

      setSelectedPersistentDiskSize(currentPersistentDiskDetails?.size || DEFAULT_GCE_PERSISTENT_DISK_SIZE)
      setSparkMode(runtimeConfig?.cloudService === cloudServices.DATAPROC ? (runtimeConfig.numberOfWorkers === 0 ? 'master' : 'cluster') : false)
      setMasterMachineType(runtimeConfig?.masterMachineType || runtimeConfig?.machineType)
      setMasterDiskSize(runtimeConfig?.masterDiskSize || runtimeConfig?.diskSize || (isDataproc(sparkMode, runtimeConfig) ? DEFAULT_DATAPROC_DISK_SIZE : DEFAULT_GCE_BOOT_DISK_SIZE))
      setNumberOfWorkers(runtimeConfig?.numberOfWorkers || 2)
      setNumberOfPreemptibleWorkers(runtimeConfig?.numberOfPreemptibleWorkers || 0)
      setWorkerMachineType(runtimeConfig?.workerMachineType || defaultDataprocMachineType)
      setWorkerDiskSize(runtimeConfig?.workerDiskSize || DEFAULT_DATAPROC_DISK_SIZE)
      setGpuEnabled((!!gpuConfig && !sparkMode) || false)
      setHasGpu(!!gpuConfig)
      setGpuType(gpuConfig?.gpuType || DEFAULT_GPU_TYPE)
      setNumGpus(gpuConfig?.numOfGpus || DEFAULT_NUM_GPUS)
    }), [])

    // Render functions -- begin

    const renderDebugger = () => {
      const makeHeader = text => div({ style: { fontSize: 20, margin: '0.5rem 0' } }, [text])
      const makeJSON = value => div({ style: { whiteSpace: 'pre-wrap', fontFamily: 'Menlo, monospace' } }, [JSON.stringify(value, null, 2)])
      return showDebugger ?
        div({ style: { position: 'fixed', top: 0, left: 0, bottom: 0, right: '50vw', backgroundColor: 'white', padding: '1rem', overflowY: 'auto' } }, [
          h(Link, { onClick: () => setShowDebugger(false), style: { position: 'absolute', top: 0, right: 0 } }, ['x']),
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
        h(Link, { onClick: () => setShowDebugger(true), style: { position: 'fixed', top: 0, left: 0, color: 'white' } }, ['D'])
    }

    const renderDeleteDiskChoices = () => {
      return h(Fragment, [
        h(RadioBlock, {
          name: 'keep-persistent-disk',
          labelText: 'Keep persistent disk, delete application configuration and compute profile',
          checked: !deleteDiskSelected,
          onChange: () => setDeleteDiskSelected(false)
        }, [
          p(['Please save your analysis data in the directory ', code({ style: { fontWeight: 600 } }, [getCurrentMountDirectory(currentRuntimeDetails)]), ' to ensure it’s stored on your disk.']),
          p([
            'Deletes your application configuration and cloud compute profile, but detaches your persistent disk and saves it for later. ',
            'The disk will be automatically reattached the next time you create a cloud environment using the standard VM compute type.'
          ]),
          p({ style: { marginBottom: 0 } }, [
            'You will continue to incur persistent disk cost at ',
            span({ style: { fontWeight: 600 } }, [Utils.formatUSD(persistentDiskCostMonthly(currentPersistentDiskDetails)), ' per month.'])
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
        h(SaveFilesHelp)
      ])
    }

    const renderImageSelect = ({ includeCustom, ...props }) => {
      return h(GroupedSelect, {
        ...props,
        maxMenuHeight: '25rem',
        value: selectedLeoImage,
        onChange: ({ value }) => {
          const requiresSpark = _.find({ image: value }, leoImages)?.requiresSpark
          setSelectedLeoImage(value)
          setCustomEnvImage('')
          setSparkMode(requiresSpark ? (sparkMode || 'master') : false)
        },
        isSearchable: true,
        isClearable: false,
        options: [
          {
            label: 'TERRA-MAINTAINED JUPYTER ENVIRONMENTS',
            options: _.map(({ label, image }) => ({ label, value: image }), _.filter(({ isCommunity, isRStudio }) => (!isCommunity && !isRStudio), leoImages))
          },
          {
            label: 'COMMUNITY-MAINTAINED JUPYTER ENVIRONMENTS (verified partners)',
            options: _.map(({ label, image }) => ({ label, value: image }), _.filter(({ isCommunity }) => isCommunity, leoImages))
          },
          {
            label: 'COMMUNITY-MAINTAINED RSTUDIO ENVIRONMENTS (verified partners)',
            options: _.map(({ label, image }) => ({ label, value: image }), _.filter(({ isRStudio }) => isRStudio, leoImages))
          },
          ...(includeCustom ? [{
            label: 'OTHER ENVIRONMENTS',
            options: [{ label: 'Custom Environment', value: CUSTOM_MODE }]
          }] : [])
        ]
      })
    }

    const renderActionButton = () => {
      const { runtime: existingRuntime, hasGpu } = getExistingEnvironmentConfig()
      const { runtime: desiredRuntime } = getDesiredEnvironmentConfig()
      const commonButtonProps = hasGpu && viewMode !== 'deleteEnvironmentOptions' ?
        { disabled: true, tooltip: 'Cloud compute with GPU(s) cannot be updated. Please delete it and create a new one.' } :
        { disabled: !hasChanges() || !!errors, tooltip: Utils.summarizeErrors(errors) }
      const canShowCustomImageWarning = viewMode === undefined
      const canShowEnvironmentWarning = _.includes(viewMode, [undefined, 'customImageWarning'])
      return Utils.cond(
        [canShowCustomImageWarning && isCustomImage && existingRuntime?.toolDockerImage !== desiredRuntime?.toolDockerImage, () => {
          return h(ButtonPrimary, { ...commonButtonProps, onClick: () => setViewMode('customImageWarning') }, ['Next'])
        }],
        [canShowEnvironmentWarning && (willDeleteBuiltinDisk() || willDeletePersistentDisk() || willRequireDowntime() || willDetachPersistentDisk()), () => {
          return h(ButtonPrimary, { ...commonButtonProps, onClick: () => setViewMode('environmentWarning') }, ['Next'])
        }],
        () => {
          return h(ButtonPrimary, {
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
        }
      )
    }

    const renderPackages = () => {
      return div({ style: styles.drawerContent }, [
        h(TitleBar, {
          id: titleId,
          style: styles.titleBar,
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

    const renderAboutPersistentDisk = () => {
      return div({ style: styles.drawerContent }, [
        h(TitleBar, {
          id: titleId,
          style: styles.titleBar,
          title: 'About persistent disk',
          hideCloseButton: isAnalysisMode,
          onDismiss,
          onPrevious: () => setViewMode(undefined)
        }),
        div({ style: { lineHeight: 1.5 } }, [
          p(['Your persistent disk is mounted in the directory ', code({ style: { fontWeight: 600 } }, [getCurrentMountDirectory(currentRuntimeDetails)]), br(), 'Please save your analysis data in this directory to ensure it’s stored on your disk.']),
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

    const renderCustomImageWarning = () => {
      return div({ style: { ...styles.drawerContent, ...styles.warningView } }, [
        h(TitleBar, {
          id: titleId,
          hideCloseButton: isAnalysisMode,
          style: styles.titleBar,
          title: h(WarningTitle, ['Unverified Docker image']),
          onDismiss,
          onPrevious: () => setViewMode(undefined)
        }),
        div({ style: { lineHeight: 1.5 } }, [
          p([
            'You are about to create a virtual machine using an unverified Docker image. ',
            'Please make sure that it was created by you or someone you trust, using one of our ',
            h(Link, { href: terraBaseImages, ...Utils.newTabLinkProps }, ['base images.']),
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

    const renderEnvironmentWarning = () => {
      return div({ style: { ...styles.drawerContent, ...styles.warningView } }, [
        h(TitleBar, {
          id: titleId,
          style: styles.titleBar,
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
              h(SaveFilesHelp)
            ])],
            [willDeletePersistentDisk(), () => h(Fragment, [
              p([
                'Reducing the size of a persistent disk requires it to be deleted and recreated. This will ',
                span({ style: { fontWeight: 600 } }, ['delete all files on the disk.'])
              ]),
              h(SaveFilesHelp)
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

    // Render functions -- end

    return h(Fragment, [
      Utils.switchCase(viewMode,
        ['packages', renderPackages],
        ['aboutPersistentDisk', renderAboutPersistentDisk],
        ['customImageWarning', renderCustomImageWarning],
        ['environmentWarning', renderEnvironmentWarning]
        // ['deleteEnvironmentOptions', renderDeleteEnvironmentOptions],
        // [Utils.DEFAULT, renderMainForm]
      ),
      loading && spinnerOverlay,
      showDebugPanel && renderDebugger()
    ])
  })

export const CloudComputeModal = withModalDrawer({ width: 675, 'aria-labelledby': titleId })(
  CloudComputeModalBase
)
