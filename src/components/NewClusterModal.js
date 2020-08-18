import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Component, Fragment } from 'react'
import { b, div, fieldset, h, input, label, legend, p, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, ButtonSecondary, GroupedSelect, IdContainer, Link, Select, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { ImageDepViewer } from 'src/components/ImageDepViewer'
import { NumberInput, TextInput, ValidatedInput } from 'src/components/input'
import { withModalDrawer } from 'src/components/ModalDrawer'
import { InfoBox } from 'src/components/PopupTrigger'
import TitleBar from 'src/components/TitleBar'
import { cloudServices, machineTypes } from 'src/data/machines'
import { Ajax } from 'src/libs/ajax'
import {
  currentCluster,
  DEFAULT_DISK_SIZE, findMachineType, normalizeRuntimeConfig, ongoingCost, persistentDiskCostMonthly, runtimeConfigCost
} from 'src/libs/cluster-utils'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import Events, { extractWorkspaceDetails } from 'src/libs/events'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import validate from 'validate.js'


const styles = {
  label: { fontWeight: 600, whiteSpace: 'pre' },
  disabledInputs: {
    border: `1px solid ${colors.dark(0.2)}`, borderRadius: 4, padding: '0.5rem'
  },
  titleBar: { marginBottom: '1rem' },
  whiteBoxContainer: { padding: '1rem', borderRadius: 3, backgroundColor: 'white', marginTop: '1rem' }
}

// TODO PD: Consider moving these into a resources file
const terraDockerBaseGithubUrl = 'https://github.com/databiosphere/terra-docker'
const terraBaseImages = `${terraDockerBaseGithubUrl}#terra-base-images`
const safeImageDocumentation = 'https://support.terra.bio/hc/en-us/articles/360034669811'
const rstudioBaseImages = 'https://github.com/anvilproject/anvil-docker'
const zendeskImagePage = 'https://support.terra.bio/hc/en-us/articles/360037269472-Working-with-project-specific-environments-in-Terra#h_b5773619-e264-471c-9647-f9b826c27820'

// distilled from https://github.com/docker/distribution/blob/95daa793b83a21656fe6c13e6d5cf1c3999108c7/reference/regexp.go
const imageValidationRegexp = /^[A-Za-z0-9]+[\w./-]+(?::\w[\w.-]+)?(?:@[\w+.-]+:[A-Fa-f0-9]{32,})?$/

const validMachineTypes = _.filter(({ memory }) => memory >= 4, machineTypes)

// TODO PD: Move MachineSelector and DiskSelector out of this file?
const MachineSelector = ({ value, onChange }) => {
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
            onChange: option => onChange(_.find({ cpu: option.value }, validMachineTypes)?.name || value),
            options: _.flow(_.map('cpu'), _.union([currentCpu]), _.sortBy(_.identity))(validMachineTypes)
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
            onChange: option => onChange(_.find({ cpu: currentCpu, memory: option.value }, validMachineTypes)?.name || value),
            options: _.flow(_.filter({ cpu: currentCpu }), _.map('memory'), _.union([currentMemory]), _.sortBy(_.identity))(validMachineTypes)
          })
        ])
      ])
    ])
  ])
}

const DiskSelector = ({ value, onChange }) => {
  return h(IdContainer, [
    id => h(Fragment, [
      label({ htmlFor: id, style: styles.label }, ['Disk size (GB)']),
      h(NumberInput, {
        id,
        min: 10,
        max: 64000,
        isClearable: false,
        onlyInteger: true,
        value,
        onChange
      })
    ])
  ])
}

// TODO PD: Should this move this into input.js?
const FancyRadio = ({ labelText, children, name, checked, onChange, style = {} }) => {
  return div({
    style: {
      backgroundColor: colors.warning(.2),
      borderRadius: 3, border: `1px solid ${checked ? colors.accent() : 'transparent'}`,
      boxShadow: checked ? Style.standardShadow : undefined,
      display: 'flex', alignItems: 'baseline', padding: '.75rem',
      ...style
    }
  }, [
    h(IdContainer, [id => h(Fragment, [
      input({ type: 'radio', name, checked, onChange, id }),
      div({ style: { marginLeft: '.75rem' } }, [
        label({ style: { fontWeight: 600, fontSize: 16 }, htmlFor: id }, [labelText]),
        children
      ])
    ])])
  ])
}

const CUSTOM_MODE = '__custom_mode__'
const PROJECT_SPECIFIC_MODE = '__project_specific_mode__'

export const NewClusterModal = withModalDrawer({ width: 675 })(class NewClusterModal extends Component {
  static propTypes = {
    currentCluster: PropTypes.object,
    clusters: PropTypes.array,
    persistentDisks: PropTypes.array,
    namespace: PropTypes.string.isRequired,
    onDismiss: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props)
    const currentCluster = this.getCurrentCluster()
    const { cloudService, ...currentConfig } = normalizeRuntimeConfig(currentCluster?.runtimeConfig || { masterMachineType: 'n1-standard-4' })
    const { numberOfWorkers } = currentConfig // want these to be put into state below, unlike cloudService
    const currentPersistentDisk = this.getCurrentPersistentDisk()

    this.state = {
      loading: false,
      selectedPersistentDiskSize: currentPersistentDisk ? currentPersistentDisk.size : DEFAULT_DISK_SIZE,
      jupyterUserScriptUri: '', customEnvImage: '', viewMode: undefined,
      sparkMode: cloudService === cloudServices.GCE ? false : numberOfWorkers === 0 ? 'master' : 'cluster',
      ...currentConfig,
      masterDiskSize: currentCluster?.runtimeConfig?.masterDiskSize || currentCluster?.runtimeConfig?.diskSize || DEFAULT_DISK_SIZE,
      deleteDiskSelected: false
    }
  }

  getCurrentCluster() {
    const { clusters } = this.props
    return currentCluster(clusters)
  }

  getCurrentPersistentDisk() {
    const currentCluster = this.getCurrentCluster()
    const { clusters, persistentDisks } = this.props
    const id = currentCluster?.runtimeConfig.persistentDiskId
    const attachedIds = _.without([undefined], _.map(cluster => cluster.runtimeConfig.persistentDiskId, clusters))
    return id ?
      _.find({ id }, persistentDisks) :
      _.last(_.sortBy('auditInfo.createdDate', _.filter(({ id }) => !_.includes(id, attachedIds), persistentDisks)))
  }

  /**
   * Transform the new environment config into the shape of runtime config
   * returned from leonardo. Specifically used as an input to cost calculation
   * for potential new configurations.
   */
  getPendingRuntimeConfig() {
    const { runtime: newRuntime } = this.getNewEnvironmentConfig()
    return {
      cloudService: newRuntime.cloudService,
      ...(newRuntime.cloudService === cloudServices.GCE ? {
        bootDiskSize: 50, //TODO PD: check if we only expect this on GCE and is 50 the right default value?
        machineType: newRuntime.machineType,
        ...(newRuntime.diskSize ? {
          diskSize: newRuntime.diskSize
        } : {})
      } : {
        masterMachineType: newRuntime.masterMachineType,
        masterDiskSize: newRuntime.masterDiskSize,
        numberOfWorkers: newRuntime.numberOfWorkers,
        ...(newRuntime.numberOfWorkers && {
          numberOfPreemptibleWorkers: newRuntime.numberOfPreemptibleWorkers,
          workerMachineType: newRuntime.workerMachineType,
          workerDiskSize: newRuntime.workerDiskSize
        })
      })
    }
  }

  applyChanges = _.flow(
    Utils.withBusyState(() => this.setState({ loading: true })),
    withErrorReporting('Error creating runtime')
  )(async () => {
    const currentCluster = this.getCurrentCluster()
    const { onSuccess, namespace } = this.props
    const { selectedLeoImage } = this.state
    const currentPersistentDisk = this.getCurrentPersistentDisk()
    const { runtime: oldRuntime, persistentDisk: oldPersistentDisk } = this.getOldEnvironmentConfig()
    const { runtime: newRuntime, persistentDisk: newPersistentDisk } = this.getNewEnvironmentConfig()
    const shouldUpdatePersistentDisk = this.canUpdatePersistentDisk() && !_.isEqual(newPersistentDisk, oldPersistentDisk)
    const shouldDeletePersistentDisk = oldPersistentDisk && !this.canUpdatePersistentDisk()
    const shouldUpdateRuntime = this.canUpdateRuntime() && !_.isEqual(newRuntime, oldRuntime)
    const shouldDeleteRuntime = oldRuntime && !this.canUpdateRuntime()
    const shouldCreateRuntime = !this.canUpdateRuntime() && newRuntime

    // TODO PD: test the generation of runtime config for update vs create
    const runtimeConfig = newRuntime && {
      cloudService: newRuntime.cloudService,
      ...(newRuntime.cloudService === cloudServices.GCE ? {
        machineType: newRuntime.machineType,
        ...(newRuntime.diskSize ? {
          diskSize: newRuntime.diskSize
        } : {
          persistentDisk: oldPersistentDisk && !shouldDeletePersistentDisk ? {
            name: currentPersistentDisk.name
          } : {
            name: Utils.generatePersistentDiskName(),
            size: newPersistentDisk.size // in GB
            // diskType and blockSize are not required per leo team
          }
        })
      } : {
        masterMachineType: newRuntime.masterMachineType,
        masterDiskSize: newRuntime.masterDiskSize,
        numberOfWorkers: newRuntime.numberOfWorkers,
        ...(newRuntime.numberOfWorkers && {
          numberOfPreemptibleWorkers: newRuntime.numberOfPreemptibleWorkers,
          workerMachineType: newRuntime.workerMachineType,
          workerDiskSize: newRuntime.workerDiskSize
        })
      })
    }
    if (shouldDeleteRuntime) {
      await Ajax().Clusters.cluster(namespace, currentCluster.runtimeName).delete(this.hasAttachedDisk() && shouldDeletePersistentDisk)
    }
    if (shouldDeletePersistentDisk && !this.hasAttachedDisk()) {
      await Ajax().Disks.disk(namespace, currentPersistentDisk.name).delete()
    }
    if (shouldUpdatePersistentDisk) {
      await Ajax().Disks.disk(namespace, currentPersistentDisk.name).update(newPersistentDisk.size)
    }
    if (shouldUpdateRuntime) {
      await Ajax().Clusters.cluster(namespace, currentCluster.runtimeName).update({
        runtimeConfig
      })
    }
    if (shouldCreateRuntime) {
      await Ajax().Clusters.cluster(namespace, Utils.generateClusterName()).create({
        runtimeConfig,
        toolDockerImage: newRuntime.toolDockerImage,
        labels: { saturnIsProjectSpecific: `${selectedLeoImage === PROJECT_SPECIFIC_MODE}` },
        ...(newRuntime.jupyterUserScriptUri ? { jupyterUserScriptUri: newRuntime.jupyterUserScriptUri } : {})
      })
    }

    //TODO PD: investigate react setState-after-unmount error
    onSuccess()
  })

  getNewEnvironmentConfig() {
    const {
      deleteDiskSelected, selectedPersistentDiskSize, viewMode, masterMachineType,
      masterDiskSize, sparkMode, numberOfWorkers, numberOfPreemptibleWorkers, workerMachineType,
      workerDiskSize, jupyterUserScriptUri, selectedLeoImage, customEnvImage
    } = this.state
    const { persistentDisk: oldPersistentDisk, runtime: oldRuntime } = this.getOldEnvironmentConfig()
    const cloudService = sparkMode ? cloudServices.DATAPROC : cloudServices.GCE
    return {
      runtime: Utils.cond(
        [(viewMode !== 'deleteEnvironmentOptions'), () => {
          return {
            cloudService,
            ...(cloudService === cloudServices.GCE ? {
              machineType: masterMachineType,
              ...(this.shouldUsePersistentDisk() ? {
                persistentDiskAttached: true
              } : {
                diskSize: masterDiskSize
              })
            } : {
              masterMachineType,
              masterDiskSize,
              numberOfWorkers,
              ...(numberOfWorkers && {
                numberOfPreemptibleWorkers,
                workerMachineType,
                workerDiskSize
              })
            }),
            toolDockerImage: _.includes(selectedLeoImage, [CUSTOM_MODE, PROJECT_SPECIFIC_MODE]) ? customEnvImage : selectedLeoImage,
            ...(jupyterUserScriptUri && { jupyterUserScriptUri })
          }
        }],
        [!deleteDiskSelected || oldRuntime?.persistentDiskAttached, () => undefined],
        () => oldRuntime
      ),
      persistentDisk: Utils.cond(
        [deleteDiskSelected, () => undefined],
        [viewMode !== 'deleteEnvironmentOptions' && this.shouldUsePersistentDisk(), () => ({ size: selectedPersistentDiskSize })],
        () => oldPersistentDisk
      )
    }
  }

  getOldEnvironmentConfig() {
    const currentCluster = this.getCurrentCluster()
    const runtimeConfig = currentCluster?.runtimeConfig
    const { currentClusterDetails } = this.state
    const cloudService = runtimeConfig?.cloudService
    const numberOfWorkers = runtimeConfig?.numberOfWorkers || 0
    const currentPersistentDisk = this.getCurrentPersistentDisk()
    return {
      runtime: currentCluster ? {
        cloudService,
        ...(cloudService === cloudServices.GCE ? {
          machineType: runtimeConfig.machineType,
          ...(runtimeConfig.persistentDiskId ? {
            persistentDiskAttached: true
          } : {
            diskSize: runtimeConfig.diskSize
          })
        } : {
          masterMachineType: runtimeConfig.masterMachineType || 'n1-standard-4',
          masterDiskSize: runtimeConfig.masterDiskSize || 100,
          numberOfWorkers,
          ...(numberOfWorkers && {
            numberOfPreemptibleWorkers: runtimeConfig.numberOfPreemptibleWorkers || 0,
            workerMachineType: runtimeConfig.workerMachineType || 'n1-standard-4',
            workerDiskSize: runtimeConfig.workerDiskSize || 100
          })
        }),
        toolDockerImage: this.getImageUrl(currentClusterDetails),
        ...(currentClusterDetails?.jupyterUserScriptUri && { jupyterUserScriptUri: currentClusterDetails?.jupyterUserScriptUri })
      } : undefined,
      persistentDisk: currentPersistentDisk ? { size: currentPersistentDisk.size } : undefined
    }
  }

  hasAttachedDisk() {
    const currentCluster = this.getCurrentCluster()
    return currentCluster?.runtimeConfig.persistentDiskId
  }

  canUpdateRuntime() {
    const { runtime: oldRuntime } = this.getOldEnvironmentConfig()
    const { runtime: newRuntime } = this.getNewEnvironmentConfig()

    return !(
      !oldRuntime ||
      !newRuntime ||
      newRuntime.cloudService !== oldRuntime.cloudService ||
      newRuntime.toolDockerImage !== oldRuntime.toolDockerImage ||
      newRuntime.jupyterUserScriptUri !== oldRuntime.jupyterUserScriptUri ||
      (newRuntime.cloudService === cloudServices.GCE ? (
        newRuntime.persistentDiskAttached !== oldRuntime.persistentDiskAttached ||
        (newRuntime.persistentDiskAttached ? !this.canUpdatePersistentDisk() : newRuntime.diskSize < oldRuntime.diskSize)
      ) : (
        newRuntime.masterDiskSize < oldRuntime.masterDiskSize ||
        (newRuntime.numberOfWorkers > 0 && oldRuntime.numberOfWorkers === 0) ||
        (newRuntime.numberOfWorkers === 0 && oldRuntime.numberOfWorkers > 0) ||
        newRuntime.workerMachineType !== oldRuntime.workerMachineType ||
        newRuntime.workerDiskSize !== oldRuntime.workerDiskSize
      ))
    )
  }

  canUpdatePersistentDisk() {
    const { persistentDisk: oldPersistentDisk } = this.getOldEnvironmentConfig()
    const { persistentDisk: newPersistentDisk } = this.getNewEnvironmentConfig()

    return !(
      !oldPersistentDisk ||
      !newPersistentDisk ||
      newPersistentDisk.size < oldPersistentDisk.size
    )
  }

  hasChanges() {
    const oldConfig = this.getOldEnvironmentConfig()
    const newConfig = this.getNewEnvironmentConfig()

    return !_.isEqual(oldConfig, newConfig)
  }

  // original diagram (without PD) for update runtime logic: https://drive.google.com/file/d/1mtFFecpQTkGYWSgPlaHksYaIudWHa0dY/view
  isStopRequired() {
    const { runtime: oldRuntime } = this.getOldEnvironmentConfig()
    const { runtime: newRuntime } = this.getNewEnvironmentConfig()

    // TODO PD: should we consider runtime status here? Consider what to do in the case of autopause
    return this.canUpdateRuntime() &&
      (oldRuntime.cloudService === cloudServices.GCE ?
        oldRuntime.machineType !== newRuntime.machineType :
        oldRuntime.masterMachineType !== newRuntime.masterMachineType)
  }

  getImageUrl(clusterDetails) {
    return _.find(({ imageType }) => _.includes(imageType, ['Jupyter', 'RStudio']), clusterDetails?.runtimeImages)?.imageUrl
  }

  componentDidMount = _.flow(
    withErrorReporting('Error loading cluster'),
    // TODO PD: can we be more selective about what we disable while loading this info?
    Utils.withBusyState(v => this.setState({ loading: v }))
  )(async () => {
    const { namespace } = this.props
    const currentCluster = this.getCurrentCluster()

    const [currentClusterDetails, newLeoImages] = await Promise.all([
      currentCluster ? Ajax().Clusters.cluster(currentCluster.googleProject, currentCluster.runtimeName).details() : null,
      Ajax().Buckets.getObjectPreview('terra-docker-image-documentation', 'terra-docker-versions.json', namespace, true).then(res => res.json())
    ])

    this.setState({ leoImages: newLeoImages, currentClusterDetails })
    if (currentClusterDetails) {
      const imageUrl = this.getImageUrl(currentClusterDetails)
      if (_.find({ image: imageUrl }, newLeoImages)) {
        this.setState({ selectedLeoImage: imageUrl })
      } else if (currentClusterDetails.labels.saturnIsProjectSpecific === 'true') {
        this.setState({ selectedLeoImage: PROJECT_SPECIFIC_MODE, customEnvImage: imageUrl })
      } else {
        this.setState({ selectedLeoImage: CUSTOM_MODE, customEnvImage: imageUrl })
      }
    } else {
      this.setState({ selectedLeoImage: _.find({ id: 'terra-jupyter-gatk' }, newLeoImages).image })
    }
  })

  renderDebugger() {
    const { showDebugger } = this.state
    const makeHeader = text => div({ style: { fontSize: 20, margin: '0.5rem 0' } }, [text])
    const makeJSON = value => div({ style: { whiteSpace: 'pre-wrap', fontFamily: 'Menlo, monospace' } }, [JSON.stringify(value, null, 2)])
    return h(Fragment, [
      showDebugger ?
        showDebugger &&
        div({ style: { position: 'fixed', top: 0, left: 0, bottom: 0, right: '50vw', backgroundColor: 'white', padding: '1rem', overflowY: 'auto' } },
          [
            h(Link, { onClick: () => this.setState({ showDebugger: false }), style: { position: 'absolute', top: 0, right: 0 } }, ['x']),
            makeHeader('Old Environment Config'),
            makeJSON(this.getOldEnvironmentConfig()),
            makeHeader('New Environment Config'),
            makeJSON(this.getNewEnvironmentConfig()),
            makeHeader('canUpdateRuntime'),
            makeJSON(this.canUpdateRuntime()),
            makeHeader('willDeleteBuiltinDisk'),
            makeJSON(!!this.willDeleteBuiltinDisk()),
            makeHeader('willDeletePersistentDisk'),
            makeJSON(!!this.willDeletePersistentDisk()),
            makeHeader('willRequireDowntime'),
            makeJSON(!!this.willRequireDowntime())
            //makeHeader('getPendingRuntimeConfig'),
            //makeJSON(this.getPendingRuntimeConfig())
          ]) :
        h(Link, { onClick: () => this.setState({ showDebugger: !showDebugger }), style: { position: 'fixed', top: 0, left: 0, color: 'white' } },
          ['D'])
    ])
  }

  renderDeleteDiskChoices() {
    const { deleteDiskSelected } = this.state
    return h(Fragment, [
      h(FancyRadio, {
        name: 'delete-persistent-disk',
        labelText: 'Keep persistent disk, delete application configuration and cloud compute',
        checked: !deleteDiskSelected,
        onChange: () => this.setState({ deleteDiskSelected: false })
      }, [
        p([
          'Your application configuration and cloud compute are deleted, and your persistent disk (and its associated data) is detached from the environment and saved for later. ',
          'The disk will be automatically reattached the next time you create a cloud environment using the standard VM compute type.'
        ]),
        p([
          'You will continue to incur persistent disk cost at ',
          span({ style: { fontWeight: 600 } }, [Utils.formatUSD(persistentDiskCostMonthly(this.getCurrentPersistentDisk())), ' per month'])
        ])
      ]),
      h(FancyRadio, {
        name: 'delete-persistent-disk',
        labelText: 'Delete cloud environment including persistent disk',
        checked: deleteDiskSelected,
        onChange: () => this.setState({ deleteDiskSelected: true }),
        style: { marginTop: '1rem' }
      }, [
        p([
          'Deletes your persistent disk (and its associated data), application configuration and cloud compute. To permanently save your data, copy it to the workspace bucket.'
        ]),
        h(Link, {
          href: '',
          ...Utils.newTabLinkProps
        }, ['Learn more about workspace buckets']),
        p([
          'Note: Jupyter notebooks are autosaved to the workspace bucket, and deleting your disk will not delete your notebooks.\n',
          'You will no longer incur any costs from this cloud environment.'
        ])
      ])
    ])
  }

  render() {
    const { onDismiss } = this.props
    const currentCluster = this.getCurrentCluster()
    const {
      masterMachineType, masterDiskSize, selectedPersistentDiskSize, sparkMode, workerMachineType,
      numberOfWorkers, numberOfPreemptibleWorkers, workerDiskSize,
      jupyterUserScriptUri, selectedLeoImage, customEnvImage, leoImages, viewMode, loading, deleteDiskSelected
    } = this.state
    const { version, updated, packages, requiresSpark } = _.find({ image: selectedLeoImage }, leoImages) || {}

    const isPersistentDisk = this.shouldUsePersistentDisk()

    const onEnvChange = ({ value }) => {
      const requiresSpark = _.find({ image: value }, leoImages)?.requiresSpark
      const isCluster = sparkMode === 'cluster'
      // TODO PD: Evaluate it going to GCE on change from dataproc to custom image
      this.setState({
        selectedLeoImage: value, customEnvImage: '',
        sparkMode: requiresSpark ? (sparkMode || 'master') : false,
        numberOfWorkers: requiresSpark && isCluster ? (numberOfWorkers || 2) : 0,
        numberOfPreemptibleWorkers: requiresSpark && isCluster ? (numberOfPreemptibleWorkers || 0) : 0
      })
    }

    const makeEnvSelect = id => h(Select, {
      id,
      'aria-label': 'Select Environment',
      value: selectedLeoImage,
      onChange: onEnvChange,
      isSearchable: true,
      isClearable: false,
      options: _.map(({ label, image }) => ({ label, value: image }), leoImages)
    })

    const isCustomImage = selectedLeoImage === CUSTOM_MODE || selectedLeoImage === PROJECT_SPECIFIC_MODE

    const machineTypeConstraints = { inclusion: { within: _.map('name', validMachineTypes), message: 'is not supported' } }
    const errors = validate(
      { masterMachineType, workerMachineType, customEnvImage },
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

    const makeGroupedEnvSelect = id => h(GroupedSelect, {
      id,
      maxMenuHeight: '25rem',
      value: selectedLeoImage,
      onChange: onEnvChange,
      isSearchable: true,
      isClearable: false,
      options: [
        { label: 'JUPYTER ENVIRONMENTS', options: _.map(({ label, image }) => ({ label, value: image }), leoImages) },
        {
          label: 'OTHER ENVIRONMENTS', options: [
            { label: 'Custom Environment', value: CUSTOM_MODE },
            { label: 'Project-Specific Environment', value: PROJECT_SPECIFIC_MODE }
          ]
        }
      ]
    })

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
          return div({ key: label, style: { flex: 1, ...styles.label } }, [
            div({ style: { fontSize: 10 } }, [label]),
            div({ style: { color: colors.accent(), marginTop: '0.25rem' } }, [
              span({ style: { fontSize: 20 } }, [cost]),
              span([' ', unitLabel])
            ])
          ])
        }, [
          { label: 'Running cloud compute cost', cost: Utils.formatUSD(runtimeConfigCost(this.getPendingRuntimeConfig())), unitLabel: 'per hr' },
          { label: 'Paused cloud compute cost', cost: Utils.formatUSD(ongoingCost(this.getPendingRuntimeConfig())), unitLabel: 'per hr' },
          { label: 'Persistent disk cost', cost: isPersistentDisk ? Utils.formatUSD(persistentDiskCostMonthly(this.getNewEnvironmentConfig().persistentDisk)) : 'N/A', unitLabel: isPersistentDisk ? 'per month' : '' }
        ])
      ])
    }

    const renderApplicationSection = () => {
      return div({ style: styles.whiteBoxContainer }, [
        h(IdContainer, [
          id => h(Fragment, [
            div({ style: { marginBottom: '0.5rem' } }, [
              label({ htmlFor: id, style: styles.label }, ['Application configuration']),
              h(InfoBox, { style: { marginLeft: '0.5rem' } }, [
                'The software application + programming languages + packages used when you create your runtime. '
              ])
            ]),
            div({ style: { height: 45 } }, [makeGroupedEnvSelect(id)])
          ])
        ]),
        Utils.switchCase(selectedLeoImage,
          [CUSTOM_MODE, () => {
            return h(Fragment, [
              h(IdContainer, [
                id => h(Fragment, [
                  label({ htmlFor: id, style: { ...styles.label, display: 'block', margin: '0.5rem 0' } }, ['CONTAINER IMAGE']),
                  div({ style: { height: 52 } }, [
                    h(ValidatedInput, {
                      inputProps: {
                        id,
                        placeholder: '<image name>:<tag>',
                        value: customEnvImage,
                        onChange: customEnvImage => this.setState({ customEnvImage })
                      },
                      error: Utils.summarizeErrors(customEnvImage && errors?.customEnvImage)
                    })
                  ])
                ])
              ]),
              div([
                'Custom environments ', b(['must ']), 'be based off one of the ',
                h(Link, { href: terraBaseImages, ...Utils.newTabLinkProps }, ['Terra Jupyter Notebook base images']),
                ' or a ',
                h(Link, { href: zendeskImagePage, ...Utils.newTabLinkProps }, ['Project-Specific image'])
              ])
            ])
          }],
          [PROJECT_SPECIFIC_MODE, () => {
            return div({ style: { lineHeight: 1.5 } }, [
              'Some consortium projects, such as ',
              h(Link, { href: rstudioBaseImages, ...Utils.newTabLinkProps }, ['AnVIL']),
              ', have created environments that are specific to their project. If you want to use one of these:',
              div({ style: { marginTop: '0.5rem' } }, [
                '1. Find the environment image (',
                h(Link, { href: zendeskImagePage, ...Utils.newTabLinkProps }, ['view image list']),
                ') '
              ]),
              div({ style: { margin: '0.5rem 0' } }, ['2. Copy the URL from the github repository']),
              div({ style: { margin: '0.5rem 0' } }, ['3. Enter the URL for the image in the text box below']),
              h(ValidatedInput, {
                inputProps: {
                  placeholder: 'Paste image path here',
                  value: customEnvImage,
                  onChange: customEnvImage => this.setState({ customEnvImage })
                },
                error: Utils.summarizeErrors(customEnvImage && errors?.customEnvImage)
              })
            ])
          }],
          [Utils.DEFAULT, () => {
            return h(Fragment, [
              div({ style: { display: 'flex' } }, [
                h(Link, { onClick: () => this.setState({ viewMode: 'packages' }) }, ['What’s installed on this environment?']),
                makeImageInfo({ marginLeft: 'auto' })
              ])
            ])
          }]
        )
      ])
    }

    const makeImageInfo = style => div({ style: { whiteSpace: 'pre', ...style } }, [
      div({ style: Style.proportionalNumbers }, ['Updated: ', updated ? Utils.makeStandardDate(updated) : null]),
      div(['Version: ', version || null])
    ])

    const renderRuntimeSection = () => {
      return div({ style: styles.whiteBoxContainer }, [
        div({ style: { fontSize: '0.875rem', fontWeight: 600 } }, ['Cloud compute configuration']),
        div({ style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.2fr 1fr 5.5rem', gridGap: '1rem', alignItems: 'center', marginTop: '0.75rem' } }, [
          h(MachineSelector, { value: masterMachineType, onChange: v => this.setState({ masterMachineType: v }) }),
          !isPersistentDisk ?
            h(DiskSelector, { value: masterDiskSize, onChange: v => this.setState({ masterDiskSize: v }) }) :
            div({ style: { gridColumnEnd: 'span 2' } }),
          h(IdContainer, [
            id => h(Fragment, [
              label({ htmlFor: id, style: { gridColumnEnd: 'span 6', ...styles.label } }, ['Startup script']),
              div({ style: { gridColumnEnd: 'span 6' } }, [
                h(TextInput, {
                  id,
                  placeholder: 'URI',
                  value: jupyterUserScriptUri,
                  onChange: v => this.setState({ jupyterUserScriptUri: v })
                })
              ])
            ])
          ]),
          h(IdContainer, [
            id => h(Fragment, [
              label({ htmlFor: id, style: { gridColumnEnd: 'span 6', ...styles.label } }, ['Compute type']),
              div({ style: { gridColumnEnd: 'span 3' } }, [
                h(Select, {
                  id,
                  isSearchable: false,
                  value: sparkMode,
                  // TODO PD: don't reset number of workers
                  onChange: ({ value }) => this.setState({
                    sparkMode: value,
                    numberOfWorkers: value === 'cluster' ? 2 : 0,
                    numberOfPreemptibleWorkers: 0
                  }),
                  options: [
                    { value: false, label: 'Standard VM', isDisabled: requiresSpark },
                    { value: 'master', label: 'Spark master node' },
                    { value: 'cluster', label: 'Spark cluster' }
                  ]
                })
              ])
            ])
          ])
        ]),
        // TODO PD: keep fine-tuning styles here
        sparkMode === 'cluster' && fieldset({ style: { margin: '1.5rem 0 0', border: 'none', padding: 0 } }, [
          legend({ style: { padding: 0, ...styles.label } }, ['Worker config']),
          // grid styling in a div because of display issues in chrome: https://bugs.chromium.org/p/chromium/issues/detail?id=375693
          div({
            style: {
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.2fr 1fr 5.25rem', gridGap: '0.8rem', alignItems: 'center', marginTop: '.5rem'
            }
          }, [
            h(IdContainer, [
              id => h(Fragment, [
                label({ htmlFor: id, style: styles.label }, ['Workers']),
                h(NumberInput, {
                  id,
                  min: 2,
                  isClearable: false,
                  onlyInteger: true,
                  value: numberOfWorkers,
                  onChange: v => this.setState({
                    numberOfWorkers: v,
                    numberOfPreemptibleWorkers: _.min([numberOfPreemptibleWorkers, v])
                  })
                })
              ])
            ]),
            h(IdContainer, [
              id => h(Fragment, [
                label({ htmlFor: id, style: styles.label }, ['Preemptible']),
                h(NumberInput, {
                  id,
                  min: 0,
                  max: numberOfWorkers,
                  isClearable: false,
                  onlyInteger: true,
                  value: numberOfPreemptibleWorkers,
                  onChange: v => this.setState({ numberOfPreemptibleWorkers: v })
                })
              ])
            ]),
            div({ style: { gridColumnEnd: 'span 2' } }),
            h(MachineSelector, { value: workerMachineType, onChange: v => this.setState({ workerMachineType: v }) }),
            h(DiskSelector, { value: workerDiskSize, onChange: v => this.setState({ workerDiskSize: v }) })
          ])
        ])
      ])
    }

    const renderPersistentDiskSection = () => {
      return div({ style: styles.whiteBoxContainer }, [
        h(IdContainer, [
          id => h(div, { style: { display: 'flex', flexDirection: 'column' } }, [
            label({ htmlFor: id, style: styles.label }, ['Persistent disk size (GB)']),
            div({ style: { marginTop: '0.5rem' } }, [
              'A safeguard to store and protect your data. ',
              h(Link, {
                onClick: () => (
                  this.setState({ viewMode: 'aboutPersistentDisk' }),
                  Ajax().Metrics.captureEvent(Events.aboutPersistentDiskView, {
                    ...extractWorkspaceDetails(makeWorkspaceObj()),
                    currentlyHasAttachedDisk: !!this.hasAttachedDisk()
                  })
                )
              }, ['Learn more'])
            ]),
            h(NumberInput, {
              id,
              min: 10,
              max: 64000,
              isClearable: false,
              onlyInteger: true,
              value: selectedPersistentDiskSize,
              style: { marginTop: '0.5rem', width: '5rem' },
              onChange: value => this.setState({ selectedPersistentDiskSize: value })
            })
          ])
        ])
      ])
    }

    const bottomButtons = () => {
      const { runtime: oldRuntime, persistentDisk: oldPersistentDisk } = this.getOldEnvironmentConfig()
      const { runtime: newRuntime } = this.getNewEnvironmentConfig()

      return h(Fragment, [
        div({ style: { display: 'flex', margin: '3rem 0 1rem' } }, [
          (!!oldRuntime || !!oldPersistentDisk) && h(ButtonSecondary, {
            onClick: () => this.setState({ viewMode: 'deleteEnvironmentOptions' })
          }, [
            Utils.cond(
              [!!oldRuntime && !oldPersistentDisk, () => 'Delete Runtime'],
              [!oldRuntime && !!oldPersistentDisk, () => 'Delete Persistent Disk'],
              () => 'Delete Environment Options'
            )
          ]),
          div({ style: { flex: 1 } }),
          h(ButtonPrimary, {
            disabled: !this.hasChanges() || !!errors,
            tooltip: Utils.summarizeErrors(errors),
            onClick: () => {
              if (isCustomImage && oldRuntime.toolDockerImage !== newRuntime.toolDockerImage) {
                this.setState({ viewMode: 'customImageWarning' })
              } else {
                this.warnOrApplyChanges()
              }
            }
          }, [!currentCluster ? 'Create' : 'Update'])
        ])
      ])
    }

    const makeWorkspaceObj = () => {
      const { namespace, name } = this.props
      return { workspace: { namespace, name } }
    }

    const renderDeleteEnvironmentOptions = () => {
      const { runtime: oldRuntime, persistentDisk: oldPersistentDisk } = this.getOldEnvironmentConfig()

      return h(Fragment, [
        h(TitleBar, {
          style: styles.titleBar,
          title: 'Delete environment options',
          onDismiss,
          onPrevious: () => this.setState({ viewMode: undefined, deleteDiskSelected: false })
        }),
        div({ style: { lineHeight: '1.5rem' } }, [
          Utils.cond(
            [oldRuntime && oldPersistentDisk && !oldRuntime.persistentDiskAttached, () => {
              return h(Fragment, [
                h(FancyRadio, {
                  name: 'delete-persistent-disk',
                  labelText: 'Delete application configuration and cloud compute',
                  checked: !deleteDiskSelected,
                  onChange: () => this.setState({ deleteDiskSelected: false })
                }, [
                  p(['Your application configuration and cloud compute are deleted.'])
                ]),
                h(FancyRadio, {
                  name: 'delete-persistent-disk',
                  labelText: 'Delete persistent disk',
                  checked: deleteDiskSelected,
                  onChange: () => this.setState({ deleteDiskSelected: true }),
                  style: { marginTop: '1rem' }
                }, [
                  p(['Deletes your persistent disk (and it’s associated data). To permanently save your data, copy it to the workspace bucket. Since the persistent disk is not attached, the application configuration and cloud compute will remain. ']),
                  h(Link, {
                    href: '',
                    ...Utils.newTabLinkProps
                  }, ['Learn more about workspace buckets']),
                  p(['Note: Jupyter notebooks are autosaved to the workspace bucket, and deleting your disk will not delete your notebooks. You will no longer incur any costs from this persistent disk.'])
                ])
              ])
            }],
            [oldRuntime && oldPersistentDisk, () => this.renderDeleteDiskChoices()],
            [!oldRuntime && oldPersistentDisk, () => {
              return h(FancyRadio, {
                name: 'delete-persistent-disk',
                labelText: 'Delete persistent disk',
                checked: deleteDiskSelected,
                onChange: () => this.setState({ deleteDiskSelected: true })
              }, [
                p([
                  'Your persistent disk (and its associated data) are deleted. If you want to permanently save your data before deleting your disk, create a new runtime environment to access the disk and copy your data to the workspace bucket.'
                ]),
                h(Link, {
                  href: '',
                  ...Utils.newTabLinkProps
                }, ['Learn more about workspace buckets']),
                p(['Note: Jupyter notebooks are autosaved to the workspace bucket, and deleting your disk will not delete your notebooks. You will no longer incur any costs from this cloud environment.'])
              ])
            }],
            () => {
              return h(Fragment, [
                p([
                  'Deleting your runtime will also ',
                  span({ style: { fontWeight: 600 } }, ['delete any files on the associated hard disk ']),
                  '(e.g. input data or analysis outputs) and installed packages. To permanently save these files, ',
                  h(Link, {
                    href: 'https://support.terra.bio/hc/en-us/articles/360026639112',
                    ...Utils.newTabLinkProps
                  }, ['move them to the workspace bucket.'])
                ]),
                p([
                  'Deleting your runtime will stop all running notebooks and associated costs. You can recreate your runtime later, which will take several minutes.'
                ])
              ])
            }
          )
        ]),
        div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
          h(ButtonPrimary, { onClick: () => this.applyChanges() }, ['Delete'])
        ])
      ])
    }
    const renderEnvironmentWarning = () => {
      return this.willDetachPersistentDisk() ?
        div({ style: { lineHeight: 1.5 } }, [
          h(TitleBar, {
            style: styles.titleBar,
            title: 'Replace application configuration and cloud compute for Spark',
            onDismiss,
            // TODO PD: should this only send you back one step?
            onPrevious: () => this.setState({ viewMode: undefined, deleteDiskSelected: false })
          }),
          div([
            'You have requested to replace your existing application and cloud compute configurations to ones that support Spark. ',
            'Unfortunately, this type of cloud compute does not support the persistent disk feature.'
          ]),
          div({ style: { margin: '1rem 0 0.5rem', fontSize: 16, fontWeight: 600 } }, ['What would you like to do with your disk?']),
          this.renderDeleteDiskChoices(),
          div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
            h(ButtonPrimary, { onClick: () => this.applyChanges() }, ['Update'])
          ])
        ]) :
        h(Fragment, [
          h(TitleBar, {
            style: styles.titleBar,
            title: 'Warning!',
            onDismiss,
            // TODO PD: should this only send you back one step?
            onPrevious: () => this.setState({ viewMode: undefined })
          }),
          Utils.cond(
            [this.willDeleteBuiltinDisk(), () => div('willDeleteBuiltinDisk')],
            [this.willDeletePersistentDisk(), () => div('willDeletePersistentDisk')],
            [this.willRequireDowntime(), () => div('willRequireDowntime')]
          ),
          div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
            h(ButtonPrimary, { onClick: () => this.applyChanges() }, ['Update'])
          ])
          // TODO PD: display these messages:
          // 1. See SATURN-1781
          // 2. See SATURN 1782
          // 3. See SATURN 1783
        ])
    }

    const renderCustomImageWarning = () => {
      return h(Fragment, [
        h(TitleBar, {
          style: styles.titleBar,
          title: 'Warning!',
          onDismiss,
          onPrevious: () => this.setState({ viewMode: undefined })
        }),
        p({ style: { marginTop: 0, lineHeight: 1.5 } }, [
          'You are about to create a virtual machine using an unverified Docker image. ',
          'Please make sure that it was created by you or someone you trust, using one of our ',
          h(Link, { href: terraBaseImages, ...Utils.newTabLinkProps }, ['base images.']),
          ' Custom Docker images could potentially cause serious security issues.'
        ]),
        h(Link, { href: safeImageDocumentation, ...Utils.newTabLinkProps }, ['Learn more about creating safe and secure custom Docker images.']),
        // TODO PD: rethink this language now that the Back button is gone
        p({ style: { lineHeight: 1.5 } }, [
          'If you\'re confident that your image is safe, click ', b([!!currentCluster ? 'Next' : 'Create']),
          ' to use it. Otherwise, click ', b(['Back']), ' to select another image.'
        ]),
        div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
          h(ButtonPrimary, { onClick: () => this.warnOrApplyChanges() }, [!!currentCluster ? 'Next' : 'Create'])
        ])
      ])
    }

    const renderMainForm = () => {
      return h(Fragment, [
        // TODO PD: test all title bars now that they're inline
        // TODO PD: revisit the term 'cloud environment' and the mention of 'Jupyter' specifically
        // TODO PD: apply fixed header style from mocks
        h(TitleBar, {
          style: styles.titleBar,
          title: 'Create a cloud environment for Jupyter notebooks',
          onDismiss
        }),
        div(['Cloud environments consist of an application, cloud compute and a persistent disk']),

        renderCostBreakdown(),
        renderApplicationSection(),
        renderRuntimeSection(),
        !!isPersistentDisk && renderPersistentDiskSection(),
        // TODO PD: What do we do with this?
        !sparkMode && !isPersistentDisk && div([
          p(['Time to upgrade your compute runtime. Terra’s new persistent disk feature will safegard your work and data.']),
          h(Link, {
            onClick: () => (
              this.setState({ viewMode: 'aboutPersistentDisk' }),
              Ajax().Metrics.captureEvent(Events.aboutPersistentDiskView, {
                ...extractWorkspaceDetails(makeWorkspaceObj()),
                currentlyHasAttachedDisk: !!this.hasAttachedDisk()
              })
            )
          },
          ['Learn more'])
        ]),
        bottomButtons()
      ])
    }

    const renderAboutPersistentDisk = () => {
      return div({ style: { lineHeight: 1.5 } }, [
        h(TitleBar, {
          style: styles.titleBar,
          title: 'About persistent disks',
          onDismiss,
          onPrevious: () => this.setState({ viewMode: undefined })
        }),
        p(['Terra attaches a persistent disk (PD) to your cloud compute in order to provide an option to keep the data on the disk after you deleting compute. PDs also act as a safeguard to protect your data in the case that something goes wrong with the compute.']),
        p(['A minimal cost per hour is associated with maintaining the disk even when the cloud compute is paused or deleted.']),
        p(['If you delete your cloud compute, but keep your PD, the PD will be reattached when creating the next cloud compute.']),
        h(Link, { href: 'https://support.terra.bio/hc/en-us/articles/360047318551', ...Utils.newTabLinkProps }, [
          'Learn more about about persistent disks in the Terra Support site',
          icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })
        ])
      ])
    }

    const renderPackages = () => {
      return h(Fragment, [
        h(TitleBar, {
          style: styles.titleBar,
          title: 'Installed packages',
          onDismiss,
          onPrevious: () => this.setState({ viewMode: undefined })
        }),
        makeEnvSelect(),
        makeImageInfo({ margin: '1rem 0 0.5rem' }),
        packages && h(ImageDepViewer, { packageLink: packages })
      ])
    }

    return div({
      style: {
        display: 'flex', flexDirection: 'column', flex: 1,
        backgroundColor: _.includes(viewMode, ['deleteEnvironmentOptions', 'environmentWarning', 'customImageWarning']) ?
          colors.warning(.1) :
          undefined
      }
    }, [
      div({ style: { padding: '1.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column' } }, [
        Utils.switchCase(viewMode,
          ['packages', renderPackages],
          ['aboutPersistentDisk', renderAboutPersistentDisk],
          ['customImageWarning', renderCustomImageWarning],
          ['environmentWarning', renderEnvironmentWarning],
          ['deleteEnvironmentOptions', renderDeleteEnvironmentOptions],
          [Utils.DEFAULT, renderMainForm]
        )
      ]),
      loading && spinnerOverlay,
      this.renderDebugger()
    ])
  }

  willDetachPersistentDisk() {
    return this.getNewEnvironmentConfig().runtime.cloudService === cloudServices.DATAPROC && this.hasAttachedDisk()
  }

  shouldUsePersistentDisk() {
    const { sparkMode } = this.state
    const currentCluster = this.getCurrentCluster()

    return !sparkMode && !currentCluster?.runtimeConfig.diskSize
  }

  willDeletePersistentDisk() {
    const oldConfig = this.getOldEnvironmentConfig()
    return oldConfig.persistentDisk && !this.canUpdatePersistentDisk()
  }

  willDeleteBuiltinDisk() {
    const oldConfig = this.getOldEnvironmentConfig()
    return (oldConfig.runtime?.diskSize || oldConfig.runtime?.masterDiskSize) && !this.canUpdateRuntime()
  }

  willRequireDowntime() {
    const oldConfig = this.getOldEnvironmentConfig()
    return oldConfig.runtime && (!this.canUpdateRuntime() || this.isStopRequired())
  }

  warnOrApplyChanges() {
    if (this.willDeleteBuiltinDisk() || this.willDeletePersistentDisk() || this.willRequireDowntime() || this.willDetachPersistentDisk()) {
      this.setState({ viewMode: 'environmentWarning' })
    } else {
      this.applyChanges()
    }
  }
})
