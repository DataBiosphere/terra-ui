import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Component, Fragment } from 'react'
import { b, div, fieldset, h, label, legend, p, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, ButtonSecondary, GroupedSelect, IdContainer, Link, RadioButton, Select, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { ImageDepViewer } from 'src/components/ImageDepViewer'
import { NumberInput, TextInput, ValidatedInput } from 'src/components/input'
import { withModalDrawer } from 'src/components/ModalDrawer'
import { InfoBox } from 'src/components/PopupTrigger'
import TitleBar from 'src/components/TitleBar'
import { cloudServices, machineTypes, profiles } from 'src/data/machines'
import { Ajax } from 'src/libs/ajax'
import { DEFAULT_DISK_SIZE, deleteText, findMachineType, normalizeRuntimeConfig, runtimeConfigCost } from 'src/libs/cluster-utils'
import colors from 'src/libs/colors'
import { deletePDText } from 'src/libs/disk-utils'
import { withErrorReporting } from 'src/libs/error'
import { notify } from 'src/libs/notifications'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import validate from 'validate.js'


const styles = {
  row: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '1rem'
  },
  label: { fontWeight: 600, whiteSpace: 'pre' },
  disabledInputs: {
    border: `1px solid ${colors.dark(0.2)}`, borderRadius: 4, padding: '0.5rem'
  }
}

const terraDockerBaseGithubUrl = 'https://github.com/databiosphere/terra-docker'
const terraBaseImages = `${terraDockerBaseGithubUrl}#terra-base-images`
const safeImageDocumentation = 'https://support.terra.bio/hc/en-us/articles/360034669811'
const rstudioBaseImages = 'https://github.com/anvilproject/anvil-docker'
const zendeskImagePage = 'https://support.terra.bio/hc/en-us/articles/360037269472-Working-with-project-specific-environments-in-Terra#h_b5773619-e264-471c-9647-f9b826c27820'

// distilled from https://github.com/docker/distribution/blob/95daa793b83a21656fe6c13e6d5cf1c3999108c7/reference/regexp.go
const imageValidationRegexp = /^[A-Za-z0-9]+[\w./-]+(?::\w[\w.-]+)?(?:@[\w+.-]+:[A-Fa-f0-9]{32,})?$/

const validMachineTypes = _.filter(({ memory }) => memory >= 4, machineTypes)

const MachineSelector = ({ machineType, onChangeMachineType, diskSize, onChangeDiskSize, readOnly, isPersistentDisk }) => {
  const { cpu: currentCpu, memory: currentMemory } = findMachineType(machineType)
  return h(Fragment, [
    h(IdContainer, [
      id => h(Fragment, [
        label({ htmlFor: id, style: styles.label }, 'CPUs'),
        readOnly ? div({ style: styles.disabledInputs }, [currentCpu]) :
          div([
            h(Select, {
              id,
              isSearchable: false,
              value: currentCpu,
              onChange: ({ value }) => onChangeMachineType(_.find({ cpu: value }, validMachineTypes)?.name || machineType),
              options: _.flow(_.map('cpu'), _.union([currentCpu]), _.sortBy(_.identity))(validMachineTypes)
            })
          ])
      ])
    ]),
    h(IdContainer, [
      id => h(Fragment, [
        label({ htmlFor: id, style: styles.label }, 'Memory (GB)'),
        readOnly ? div({ style: styles.disabledInputs }, [currentMemory]) :
          div([
            h(Select, {
              id,
              isSearchable: false,
              value: currentMemory,
              onChange: ({ value }) => onChangeMachineType(_.find({ cpu: currentCpu, memory: value }, validMachineTypes)?.name || machineType),
              options: _.flow(_.filter({ cpu: currentCpu }), _.map('memory'), _.union([currentMemory]), _.sortBy(_.identity))(validMachineTypes)
            })
          ])
      ])
    ]),
    !isPersistentDisk ? h(IdContainer, [
      id => h(Fragment, [
        label({ htmlFor: id, style: styles.label }, ['Disk size (GB)']),
        h(NumberInput, {
          id,
          min: 10,
          max: 64000,
          isClearable: false,
          onlyInteger: true,
          value: diskSize,
          onChange: onChangeDiskSize
        })
      ])
    ]) : div({ style: { gridColumnEnd: 'span 2' } })
  ])
}

const CUSTOM_MODE = '__custom_mode__'
const PROJECT_SPECIFIC_MODE = '__project_specific_mode__'

export const NewClusterModal = withModalDrawer({ width: 675 })(class NewClusterModal extends Component {
  static propTypes = {
    currentCluster: PropTypes.object,
    persistentDisks: PropTypes.array,
    namespace: PropTypes.string.isRequired,
    onDismiss: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props)
    const { currentCluster } = props
    const { cloudService, ...currentConfig } = normalizeRuntimeConfig(currentCluster?.runtimeConfig || profiles[0].runtimeConfig)
    const { masterMachineType, numberOfWorkers } = currentConfig // want these to be put into state below, unlike cloudService
    const matchingProfile = _.find(({ runtimeConfig }) => runtimeConfig.masterMachineType === masterMachineType, profiles)
    const currentPersistentDisk = this.getCurrentPersistentDisk()

    this.state = {
      loading: false,
      selectedPersistentDiskSize: currentPersistentDisk ? currentPersistentDisk.size : DEFAULT_DISK_SIZE,
      profile: matchingProfile?.name || 'custom',
      jupyterUserScriptUri: '', customEnvImage: '', viewMode: undefined,
      sparkMode: cloudService === cloudServices.GCE ? false : numberOfWorkers === 0 ? 'master' : 'cluster',
      ...currentConfig,
      masterDiskSize: currentCluster?.runtimeConfig?.masterDiskSize || currentCluster?.runtimeConfig?.diskSize || DEFAULT_DISK_SIZE,
      deleteDiskSelected: false
    }
  }

  // TODO PD: This should probably only choose from unattached persistent disks.
  getCurrentPersistentDisk() {
    const { currentCluster, persistentDisks } = this.props
    const id = currentCluster?.runtimeConfig.persistentDiskId
    return id ?
      _.find({ id }, persistentDisks) :
      _.last(_.sortBy('auditInfo.createdDate', persistentDisks))
  }

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

  deleteCluster(deleteDisk) {
    const { currentCluster } = this.props
    const { googleProject, runtimeName } = currentCluster

    return Ajax().Clusters.cluster(googleProject, runtimeName).delete(deleteDisk)
  }

  getCorrectImage() {
    const { selectedLeoImage, customEnvImage } = this.state
    return selectedLeoImage === CUSTOM_MODE || selectedLeoImage === PROJECT_SPECIFIC_MODE ? customEnvImage : selectedLeoImage
  }

  generateClusterLabels() {
    const { selectedLeoImage } = this.state
    return { saturnIsProjectSpecific: `${selectedLeoImage === PROJECT_SPECIFIC_MODE}` }
  }

  applyChanges = _.flow(
    Utils.withBusyState(() => this.setState({ loading: true })),
    withErrorReporting('Error creating runtime')
  )(async () => {
    const { onSuccess } = this.props

    await this.createOrUpdate()

    //TODO PD: investigate react setState-after-unmount error
    onSuccess()
  })

  async createOrUpdate() {
    const { namespace, currentCluster } = this.props
    const currentPersistentDisk = this.getCurrentPersistentDisk()
    const { runtime: oldRuntime, persistentDisk: oldPersistentDisk } = this.getOldEnvironmentConfig()
    const { runtime: newRuntime, persistentDisk: newPersistentDisk } = this.getNewEnvironmentConfig()
    const shouldUpdatePersistentDisk = oldPersistentDisk && this.canUpdatePersistentDisk() && !_.isEqual(newPersistentDisk, oldPersistentDisk)
    const shouldDeletePersistentDiskLocal = oldPersistentDisk && !this.canUpdatePersistentDisk()
    const shouldUpdateRuntime = oldRuntime && this.canUpdate() && !_.isEqual(newRuntime, oldRuntime)
    const shouldDeleteRuntime = oldRuntime && !this.canUpdate()
    const shouldCreateRuntime = !this.canUpdate() //TODO PD: change this if/when we want this to handle deletes as well

    const runtimeConfig = {
      cloudService: newRuntime.cloudService,
      ...(newRuntime.cloudService === cloudServices.GCE ? {
        machineType: newRuntime.machineType,
        ...(newRuntime.diskSize ? {
          diskSize: newRuntime.diskSize
        } : {
          persistentDisk: oldPersistentDisk && !shouldDeletePersistentDiskLocal ? {
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
      await this.deleteCluster(this.hasAttachedDisk() && shouldDeletePersistentDiskLocal)
    }
    if (shouldDeletePersistentDiskLocal && !this.hasAttachedDisk()) {
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
        toolDockerImage: this.getCorrectImage(),
        labels: this.generateClusterLabels(),
        ...(newRuntime.jupyterUserScriptUri ? { jupyterUserScriptUri: newRuntime.jupyterUserScriptUri } : {})
      })
    }
  }

  getNewEnvironmentConfig() {
    const {
      deleteDiskSelected, selectedPersistentDiskSize, viewMode, masterMachineType,
      masterDiskSize, sparkMode, numberOfWorkers, numberOfPreemptibleWorkers, workerMachineType,
      workerDiskSize, jupyterUserScriptUri
    } = this.state

    const cloudService = sparkMode ? cloudServices.DATAPROC : cloudServices.GCE
    return {
      runtime: (viewMode !== 'deleteEnvironmentOptions') ? {
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
        toolDockerImage: this.getCorrectImage(),
        ...(jupyterUserScriptUri && { jupyterUserScriptUri })
      } : undefined,
      persistentDisk: this.shouldUsePersistentDisk() || (this.getCurrentPersistentDisk() && !deleteDiskSelected) ? {
        size: this.shouldUsePersistentDisk() ? selectedPersistentDiskSize : this.getCurrentPersistentDisk().size
      } : undefined
    }
  }

  getOldEnvironmentConfig() {
    const { currentCluster, currentCluster: { runtimeConfig } = {} } = this.props
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
    const { currentCluster } = this.props
    return currentCluster?.runtimeConfig.persistentDiskId
  }

  canUpdate() {
    const { runtime: oldRuntime } = this.getOldEnvironmentConfig()
    const { runtime: newRuntime } = this.getNewEnvironmentConfig()

    return !(
      !oldRuntime ||
      !newRuntime ||
      oldRuntime.cloudService !== newRuntime.cloudService ||
      newRuntime.toolDockerImage !== oldRuntime.toolDockerImage ||
      newRuntime.jupyterUserScriptUri !== oldRuntime.jupyterUserScriptUri ||
      (oldRuntime.cloudService === cloudServices.GCE ? (
        newRuntime.persistentDiskAttached !== oldRuntime.persistentDiskAttached ||
        (oldRuntime.persistentDiskAttached && !this.canUpdatePersistentDisk()) ||
        newRuntime.diskSize < oldRuntime.diskSize
      ) : (
        // TODO PD: is this code clear enough? (re: order of comparisons, order of new vs old, etc)
        newRuntime.masterDiskSize < oldRuntime.masterDiskSize ||
        (oldRuntime.numberOfWorkers === 0 && newRuntime.numberOfWorkers > 0) ||
        (oldRuntime.numberOfWorkers > 0 && newRuntime.numberOfWorkers === 0) ||
        oldRuntime.workerMachineType !== newRuntime.workerMachineType ||
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
  newIsStopRequired() {
    const { runtime: oldRuntime } = this.getOldEnvironmentConfig()
    const { runtime: newRuntime } = this.getNewEnvironmentConfig()

    // TODO PD: should we consider runtime status here?
    return this.canUpdate() &&
      (oldRuntime.cloudService === cloudServices.GCE ?
        oldRuntime.machineType !== newRuntime.machineType :
        oldRuntime.masterMachineType !== newRuntime.masterMachineType)
  }

  getImageUrl(clusterDetails) {
    return _.find(({ imageType }) => _.includes(imageType, ['Jupyter', 'RStudio']), clusterDetails?.runtimeImages)?.imageUrl
  }

  componentDidMount = withErrorReporting('Error loading cluster', async () => {
    const { currentCluster, namespace } = this.props

    // TODO PD: consider disabling submit button until these calls have finished
    const [currentClusterDetails, newLeoImages] = await Promise.all([
      currentCluster ? Ajax().Clusters.cluster(currentCluster.googleProject, currentCluster.runtimeName).details() : null,
      Ajax().Buckets.getObjectPreview('terra-docker-image-documentation', 'terra-docker-versions.json', namespace, true).then(res => res.json())
    ])

    this.setState({ leoImages: newLeoImages, currentClusterDetails })
    if (currentClusterDetails) {
      const { jupyterUserScriptUri } = currentClusterDetails
      const imageUrl = this.getImageUrl(currentClusterDetails)
      if (_.find({ image: imageUrl }, newLeoImages)) {
        this.setState({ selectedLeoImage: imageUrl })
      } else if (currentClusterDetails.labels.saturnIsProjectSpecific === 'true') {
        this.setState({ selectedLeoImage: PROJECT_SPECIFIC_MODE, customEnvImage: imageUrl })
      } else {
        this.setState({ selectedLeoImage: CUSTOM_MODE, customEnvImage: imageUrl })
      }

      if (jupyterUserScriptUri) {
        this.setState({ jupyterUserScriptUri, profile: 'custom' })
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
            makeHeader('canUpdate'),
            makeJSON(this.canUpdate()),
            makeHeader('willDeleteBuiltinDisk'),
            makeJSON(!!this.willDeleteBuiltinDisk()),
            makeHeader('willDeletePersistentDisk'),
            makeJSON(!!this.willDeletePersistentDisk()),
            makeHeader('willRequireDowntime'),
            makeJSON(!!this.willRequireDowntime()),
            makeHeader('getPendingRuntimeConfig'),
            makeJSON(this.getPendingRuntimeConfig())
          ]) :
        h(Link, { onClick: () => this.setState({ showDebugger: !showDebugger }), style: { position: 'fixed', top: 0, left: 0, color: 'white' } },
          ['D'])
    ])
  }

  render() {
    const { currentCluster, onDismiss, onSuccess } = this.props
    const {
      profile, masterMachineType, masterDiskSize, selectedPersistentDiskSize, sparkMode, workerMachineType,
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

    const isSelectedImageInputted = selectedLeoImage === CUSTOM_MODE || selectedLeoImage === PROJECT_SPECIFIC_MODE

    const machineTypeConstraints = { inclusion: { within: _.map('name', validMachineTypes), message: 'is not supported' } }
    const errors = validate(
      { masterMachineType, workerMachineType, customEnvImage },
      {
        masterMachineType: machineTypeConstraints,
        workerMachineType: machineTypeConstraints,
        customEnvImage: isSelectedImageInputted ? { format: { pattern: imageValidationRegexp } } : {}
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
      options: [{ label: 'JUPYTER ENVIRONMENTS', options: _.map(({ label, image }) => ({ label, value: image }), leoImages) },
        {
          label: 'OTHER ENVIRONMENTS',
          options: [{ label: 'Custom Environment', value: CUSTOM_MODE }, { label: 'Project-Specific Environment', value: PROJECT_SPECIFIC_MODE }]
        }]
    })

    const makeImageInfo = style => div({ style: { whiteSpace: 'pre', ...style } }, [
      div({ style: Style.proportionalNumbers }, ['Updated: ', updated ? Utils.makeStandardDate(updated) : null]),
      div(['Version: ', version || null])
    ])

    const bottomButtons = () => {
      const canUpdate = this.canUpdate()

      return h(Fragment, [
        div({ style: { display: 'flex', margin: '3rem 0 1rem' } }, [
          (!!currentCluster || !!this.getCurrentPersistentDisk()) &&
          h(ButtonSecondary, { onClick: () => this.setState({ viewMode: 'deleteEnvironmentOptions' }) }, [
            Utils.cond(
              [!!currentCluster && !this.getCurrentPersistentDisk(), 'Delete Runtime'],
              [!currentCluster && !!this.getCurrentPersistentDisk(), 'Delete Persistent Disk'],
              'Delete Environment Options'
            )
          ]),
          div({ style: { flex: 1 } }),
          h(ButtonSecondary, { style: { marginRight: '2rem' }, onClick: onDismiss }, 'Cancel'),
          h(ButtonPrimary, {
            disabled: !this.hasChanges() || !!errors,
            tooltip: Utils.summarizeErrors(errors),
            onClick: () => {
              if (isSelectedImageInputted && !canUpdate) {
                this.setState({ viewMode: 'customImageWarning' })
              } else {
                this.warnOrApplyChanges()
              }
            }
          }, [!currentCluster ? 'Create' : 'Update'])
        ])
      ])
    }

    const runtimeConfig = () => h(Fragment, [
      div({
        style: {
          padding: '1rem', marginTop: '1rem',
          border: `2px solid ${colors.dark(0.3)}`, borderRadius: 9
        }
      }, [
        div({ style: { fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' } }, ['COMPUTE POWER']),
        div({ style: { marginBottom: '1rem' } }, ['Select from one of the default runtime profiles or define your own']),
        div({ style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.2fr 1fr 5.5rem', gridGap: '1rem', alignItems: 'center' } }, [
          h(IdContainer, [
            id => h(Fragment, [
              label({ htmlFor: id, style: styles.label }, 'Profile'),
              div({ style: { gridColumnEnd: 'span 5' } }, [
                h(Select, {
                  id,
                  value: profile,
                  onChange: ({ value }) => {
                    this.setState({
                      profile: value,
                      ...(value === 'custom' ?
                        {} :
                        { masterMachineType: _.find({ name: value }, profiles).runtimeConfig.masterMachineType })
                    })
                  },
                  isSearchable: false,
                  isClearable: false,
                  options: [
                    ..._.map(({ name, label }) => ({ value: name, label: `${label} computer power` }), profiles),
                    { value: 'custom', label: 'Custom' }
                  ]
                })
              ])
            ])
          ]),
          h(MachineSelector, {
            machineType: masterMachineType,
            onChangeMachineType: v => this.setState({ masterMachineType: v }),
            isPersistentDisk,
            diskSize: isPersistentDisk ? selectedPersistentDiskSize : masterDiskSize,
            onChangeDiskSize: v => this.setState(isPersistentDisk ? { selectedPersistentDiskSize: v } : { masterDiskSize: v }),
            readOnly: profile !== 'custom'
          }),
          profile === 'custom' && h(IdContainer, [
            id => h(Fragment, [
              label({ htmlFor: id, style: styles.label }, 'Startup\nscript'),
              div({ style: { gridColumnEnd: 'span 5' } }, [
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
              label({ htmlFor: id, style: styles.label }, 'Runtime\ntype'),
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
                    { value: 'cluster', label: 'Configure as spark cluster' }
                  ]
                })
              ])
            ])
          ])
        ]),
        sparkMode === 'cluster' && fieldset({ style: { margin: '1.5rem 0 0', border: 'none', padding: 0, position: 'relative' } }, [
          legend({
            style: {
              position: 'absolute', top: '-0.5rem', left: '0.5rem', padding: '0 0.5rem 0 0.25rem', backgroundColor: colors.light(), ...styles.label
            }
          }, ['Worker config']),
          // grid styling in a div because of display issues in chrome: https://bugs.chromium.org/p/chromium/issues/detail?id=375693
          div({
            style: {
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.2fr 1fr 5.25rem', gridGap: '0.8rem', alignItems: 'center',
              padding: '1rem 0.8rem 0.8rem',
              border: `2px solid ${colors.dark(0.3)}`, borderRadius: 7
            }
          }, [
            h(IdContainer, [
              id => h(Fragment, [
                label({ htmlFor: id, style: styles.label }, 'Workers'),
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
                label({
                  htmlFor: id,
                  style: styles.label
                }, 'Preemptible'),
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
            h(MachineSelector, {
              machineType: workerMachineType,
              onChangeMachineType: v => this.setState({ workerMachineType: v }),
              diskSize: workerDiskSize,
              onChangeDiskSize: v => this.setState({ workerDiskSize: v })
            })
          ])
        ]),
        div({
          style: { backgroundColor: colors.dark(0.2), borderRadius: 100, width: 'fit-content', padding: '0.75rem 1.25rem', ...styles.row }
        }, [
          span({ style: { ...styles.label, marginRight: '0.25rem', textTransform: 'uppercase' } }, ['cost:']),
          // TODO PD: This should take into account PD and isn't right now.
          `${Utils.formatUSD(runtimeConfigCost(this.getPendingRuntimeConfig()))} per hour`
        ]),
        !!isPersistentDisk && h(IdContainer, [
          id => h(div, { style: { display: 'flex', flexDirection: 'column', marginTop: '1rem' } }, [
            label({ htmlFor: id, style: styles.label }, ['Persistent disk size (GB)']),
            div({ style: { marginTop: '0.5rem' } }, [
              'A safeguard to store and protect your data. ',
              h(Link, { onClick: () => this.setState({ viewMode: 'aboutPersistentDisk' }) }, ['Learn more'])
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
        ]),
        !sparkMode && !isPersistentDisk && div([
          p(['Time to upgrade your compute runtime. Terra’s new persistent disk feature will safegard your work and data.']),
          h(Link, { onClick: () => this.setState({ viewMode: 'aboutPersistentDisk' }) }, ['Learn more'])
        ])
      ])
    ])

    const contents = Utils.switchCase(viewMode,
      ['packages', () => h(Fragment, [
        makeEnvSelect(),
        makeImageInfo({ margin: '1rem 0 0.5rem' }),
        packages && h(ImageDepViewer, { packageLink: packages })
      ])],
      ['aboutPersistentDisk', () => div({ style: { lineHeight: 1.5 } }, [
        p(['Terra attaches a persistent disk (PD) to your cloud compute in order to provide an option to keep the data on the disk after you deleting compute. PDs also act as a safeguard to protect your data in the case that something goes wrong with the compute.']),
        p(['A minimal cost per hour is associated with maintaining the disk even when the cloud compute is paused or deleted.']),
        p(['If you delete your cloud compute, but keep your PD, the PD will be reattached when creating the next cloud compute.']),
        h(Link, { href: 'TODO PD', ...Utils.newTabLinkProps }, [
          'Learn more about about persistent disks in the Terra Support site',
          icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })
        ])
      ])],
      ['switchFromGCEToDataproc', () => h(Fragment, [
        div(['You have requested to replace your existing application and cloud compute configurations to ones that support Hail.' +
        ' Unfortunately, the type of cloud compute (spark) that is required for Hail does not support the persistent disk feature.']),
        div({ style: { marginTop: '.5rem' } }, [h(RadioButton, {
          text: 'Keep persistent disk, delete application configuration and cloud compute',
          name: 'delete-disk-selected-false',
          checked: !deleteDiskSelected,
          onChange: () => this.setState({ deleteDiskSelected: false }),
          labelStyle: { marginLeft: '.75rem' }
        })]),
        div({ style: { marginTop: '.5rem' } }, [h(RadioButton, {
          text: `Delete cloud environment including persistent disk`,
          name: 'delete-disk-selected-true',
          checked: deleteDiskSelected,
          onChange: () => this.setState({ deleteDiskSelected: true }),
          labelStyle: { marginLeft: '.75rem' }
        })]),
        div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
          h(ButtonSecondary, { style: { marginRight: '2rem' }, onClick: () => this.setState({ viewMode: undefined }) }, ['CANCEL']),
          h(ButtonPrimary, { onClick: () => this.applyChanges() }, ['UPDATE'])
        ])
      ])],
      ['customImageWarning', () => h(Fragment, [
        p({ style: { marginTop: 0, lineHeight: 1.5 } }, [
          `You are about to create a virtual machine using an unverified Docker image.
            Please make sure that it was created by you or someone you trust, using one of our `,
          h(Link, { href: terraBaseImages, ...Utils.newTabLinkProps }, ['base images.']),
          ' Custom Docker images could potentially cause serious security issues.'
        ]),
        h(Link, { href: safeImageDocumentation, ...Utils.newTabLinkProps }, ['Learn more about creating safe and secure custom Docker images.']),
        p({ style: { lineHeight: 1.5 } }, [
          'If you\'re confident that your image is safe, click ', b([!!currentCluster ? 'NEXT' : 'CREATE']),
          ' to use it. Otherwise, click ', b(['BACK']), ' to select another image.'
        ]),
        div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
          h(ButtonSecondary, { style: { marginRight: '2rem' }, onClick: () => this.setState({ viewMode: undefined }) }, ['Back']),
          h(ButtonPrimary, {
            onClick: () => {
              this.warnOrApplyChanges()
            }
          }, [!!currentCluster ? 'Next' : 'Create'])
        ])
      ])],
      ['environmentWarning', () => h(Fragment, [
        Utils.cond(
          [this.willDeleteBuiltinDisk(), () => div('willDeleteBuiltinDisk')],
          [this.willDeletePersistentDisk(), () => div('willDeletePersistentDisk')],
          [this.willRequireDowntime(), () => div('willRequireDowntime')]
        ),
        div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
          h(ButtonSecondary, { style: { marginRight: '2rem' }, onClick: () => this.setState({ viewMode: undefined }) }, ['CANCEL']),
          h(ButtonPrimary, { onClick: () => this.applyChanges() }, ['UPDATE'])
        ])
        // TODO PD: display these messages:
        // 1. You have a machine with builtin disk, that needs to be deleted, so you will lose data
        // 2. You have a PD that's being shrunk, so it needs to be deleted and you will lose data
        // 3. You have a machine that needs to be rebuilt/updated, you will not lose data but will be unable to use the machine for a few mins
      ])],
      ['deleteEnvironmentOptions', () => h(Fragment, [
        h(deleteText),
        div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
          h(ButtonSecondary, { style: { marginRight: '2rem' }, onClick: () => this.setState({ viewMode: undefined }) }, ['CANCEL']),
          h(ButtonPrimary, { onClick: () => onSuccess(this.deleteCluster()) }, ['DELETE'])
        ])
      ])],
      [Utils.DEFAULT, () => h(Fragment, [
        div({ style: { marginBottom: '1rem' } }, [
          'Create cloud compute to launch Jupyter Notebooks or a Project-Specific software application.'
        ]),
        h(IdContainer, [
          id => h(Fragment, [
            div({ style: { marginBottom: '0.5rem' } }, [
              label({ htmlFor: id, style: styles.label }, 'ENVIRONMENT'),
              h(InfoBox, { style: { marginLeft: '0.5rem' } }, [
                'Environment defines the software application + programming languages + packages used when you create your runtime. '
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
                  label({ htmlFor: id, style: { ...styles.label, display: 'block', margin: '0.5rem 0' } }, 'CONTAINER IMAGE'),
                  div({ style: { height: 52, marginBottom: '0.5rem' } }, [
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
              div({ style: { margin: '0.5rem' } }, [
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
          }]),
        runtimeConfig(),
        bottomButtons()
      ])]
    )

    return h(Fragment, [
      h(TitleBar, {
        title: Utils.switchCase(viewMode,
          ['packages', () => 'Installed packages'],
          ['aboutPersistentDisk', () => 'About persistent disks'],
          ['customImageWarning', () => 'Warning!'],
          ['delete', () => 'Delete runtime?'],
          ['update', () => 'Update runtime?'],
          ['switchFromGCEToDataproc', () => 'Replace application configuration and cloud compute for Hail'],
          [Utils.DEFAULT, () => 'Runtime configuration']
        ),
        onDismiss,
        onPrevious: !!viewMode ? () => this.setState({ viewMode: undefined }) : undefined
      }),
      div({ style: { padding: '0.5rem 1.5rem 1.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column' } }, [contents]),
      loading && spinnerOverlay,
      this.renderDebugger()
    ])
  }

  shouldUsePersistentDisk() {
    const { sparkMode } = this.state
    const { currentCluster } = this.props

    return !sparkMode && !currentCluster?.runtimeConfig.diskSize
  }

  willDeletePersistentDisk() {
    const oldConfig = this.getOldEnvironmentConfig()
    return oldConfig.persistentDisk && !this.canUpdatePersistentDisk()
  }

  willDeleteBuiltinDisk() {
    const oldConfig = this.getOldEnvironmentConfig()
    return (oldConfig.runtime?.diskSize || oldConfig.runtime?.masterDiskSize) && !this.canUpdate()
  }

  willRequireDowntime() {
    const oldConfig = this.getOldEnvironmentConfig()
    return oldConfig.runtime && (!this.canUpdate() || this.newIsStopRequired())
  }

  warnOrApplyChanges() {
    if (this.getNewEnvironmentConfig().runtime.cloudService === cloudServices.DATAPROC && this.hasAttachedDisk()) {
      this.setState({ viewMode: 'switchFromGCEToDataproc' })
    } else if (this.willDeleteBuiltinDisk() || this.willDeletePersistentDisk() || this.willRequireDowntime()) {
      this.setState({ viewMode: 'environmentWarning' })
    } else {
      this.applyChanges()
    }
  }
})
