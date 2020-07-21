import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Component, Fragment } from 'react'
import { b, div, fieldset, h, label, legend, p, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, ButtonSecondary, GroupedSelect, IdContainer, Link, Select } from 'src/components/common'
import { ImageDepViewer } from 'src/components/ImageDepViewer'
import { NumberInput, TextInput, ValidatedInput } from 'src/components/input'
import { withModalDrawer } from 'src/components/ModalDrawer'
import { InfoBox } from 'src/components/PopupTrigger'
import TitleBar from 'src/components/TitleBar'
import { cloudServices, machineTypes, profiles } from 'src/data/machines'
import { Ajax } from 'src/libs/ajax'
import { DEFAULT_DISK_SIZE, deleteText, findMachineType, formatRuntimeConfig, normalizeRuntimeConfig, runtimeConfigCost } from 'src/libs/cluster-utils'
import colors from 'src/libs/colors'
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
        readOnly ? div({ style: styles.disabledInputs }, [diskSize]) :
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
    const { masterDiskSize, masterMachineType, numberOfWorkers } = currentConfig // want these to be put into state below, unlike cloudService
    const matchingProfile = _.find(({ runtimeConfig }) => _.isMatch({ masterMachineType, masterDiskSize }, normalizeRuntimeConfig(runtimeConfig)), profiles)
    // TODO(PD): This should probably only choose from unattached persistent disks.
    const currentPersistentDisk = this.getCurrentPersistentDisk()

    this.state = {
      persistentDiskSize: currentPersistentDisk ? currentPersistentDisk.size : DEFAULT_DISK_SIZE,
      profile: matchingProfile?.name || 'custom',
      jupyterUserScriptUri: '', customEnvImage: '', viewMode: undefined,
      sparkMode: cloudService === cloudServices.GCE ? false : numberOfWorkers === 0 ? 'master' : 'cluster',
      ...currentConfig,
      masterDiskSize: currentCluster?.runtimeConfig?.masterDiskSize || currentCluster?.runtimeConfig?.diskSize || DEFAULT_DISK_SIZE
    }
  }

  getCurrentPersistentDisk() {
    const { currentCluster, persistentDisks } = this.props
    const id = currentCluster?.runtimeConfig?.persistentDiskId
    return id ?
      _.find({ id }, persistentDisks) :
      _.last(_.sortBy('auditInfo.createdDate', persistentDisks))
  }

  getRuntimeConfig(isNew = false) {
    const formatRuntimeConfig = config => {
      const { cloudService, masterMachineType, masterDiskSize, numberOfWorkers, numberOfPreemptibleWorkers, workerMachineType, workerDiskSize, persistentDiskSize } = config
      return cloudService === cloudServices.GCE ? {
        cloudService,
        machineType: masterMachineType,
        diskSize: masterDiskSize,
        //TODO(PD): work in progress
        /*persistentDisk: {
          name: Utils.generatePersistentDiskName(),
          diskSize: persistentDiskSize
        }*/
      } : {
        cloudService,
        masterMachineType,
        masterDiskSize,
        numberOfWorkers,
        ...(numberOfWorkers && {
          numberOfPreemptibleWorkers,
          workerMachineType,
          workerDiskSize
        })
      }
    }
    return formatRuntimeConfig({
      cloudService: !!this.state.sparkMode ? cloudServices.DATAPROC : cloudServices.GCE,
      isNew,
      ..._.pick(
        ['numberOfWorkers', 'masterMachineType', 'masterDiskSize', 'workerMachineType', 'workerDiskSize', 'numberOfPreemptibleWorkers', 'persistentDiskSize'],
        this.state)
    })
  }

  deleteCluster() {
    const { currentCluster } = this.props
    const { googleProject, runtimeName } = currentCluster

    return Ajax().Clusters.cluster(googleProject, runtimeName).delete()
  }

  getCorrectImage() {
    const { selectedLeoImage, customEnvImage } = this.state
    return selectedLeoImage === CUSTOM_MODE || selectedLeoImage === PROJECT_SPECIFIC_MODE ? customEnvImage : selectedLeoImage
  }

  generateClusterLabels() {
    const { selectedLeoImage } = this.state
    return { saturnIsProjectSpecific: `${selectedLeoImage === PROJECT_SPECIFIC_MODE}` }
  }

  // TODO PD delete these comments and de-dup code
  // existing (no PD)
  createCluster() {
    const { namespace, onSuccess, currentCluster } = this.props
    const { jupyterUserScriptUri, selectedLeoImage, customEnvImage } = this.state
    onSuccess(Promise.all([
      Ajax().Clusters.cluster(namespace, Utils.generateClusterName()).create({
        runtimeConfig: this.getRuntimeConfig(true),
        toolDockerImage: this.getCorrectImage(),
        labels: this.generateClusterLabels(),
        ...(jupyterUserScriptUri ? { jupyterUserScriptUri } : {})
      }),
      !!currentCluster && this.deleteCluster()
    ]))
  }

  newCreateRuntime() {
    const { currentCluster } = this.props
    const { sparkMode } = this.state
    return Utils.cond(
      [!!currentCluster?.runtimeConfig?.persistentDiskId && !!sparkMode, () => this.createDataproc_FromGCE_()],
      [!currentCluster && !sparkMode && this.getCurrentPersistentDisk(), () => this.createGCE_fromPD_()],
      [!currentCluster && !!sparkMode, () => this.createOnlyDataproc_()],
      [!currentCluster && !sparkMode, () => this.createOnlyGCE_fromNothing_()],
      () => this.createCluster()
    )
  }

  createOnlyDataproc_() {
    const { namespace, onSuccess, currentCluster } = this.props
    const { jupyterUserScriptUri, masterMachineType, masterDiskSize, numberOfWorkers, numberOfPreemptibleWorkers, workerMachineType, workerDiskSize } = this.state
    const runtimeConfig = {
      cloudService: cloudServices.DATAPROC,
      masterMachineType,
      masterDiskSize,
      numberOfWorkers,
      ...(numberOfWorkers && {
        numberOfPreemptibleWorkers,
        workerMachineType,
        workerDiskSize
      })
    }
    onSuccess(
      Ajax().Clusters.cluster(namespace, Utils.generateClusterName()).create({
        runtimeConfig,
        toolDockerImage: this.getCorrectImage(),
        labels: this.generateClusterLabels(),
        ...(jupyterUserScriptUri ? { jupyterUserScriptUri } : {})
      })
    )
  }

  createOnlyGCE_fromNothing_() {
    const { namespace, onSuccess, currentCluster } = this.props
    const { jupyterUserScriptUri, persistentDiskSize, masterMachineType } = this.state
    const runtimeConfig = {
      cloudService: cloudServices.GCE,
      machineType: masterMachineType,
      persistentDisk: {
        name: Utils.generatePersistentDiskName(),
        size: persistentDiskSize // in GB
        // diskType and blockSize are not required per leo team
      }
    }
    onSuccess(
      Ajax().Clusters.cluster(namespace, Utils.generateClusterName()).create({
        runtimeConfig,
        toolDockerImage: this.getCorrectImage(),
        labels: this.generateClusterLabels(),
        ...(jupyterUserScriptUri ? { jupyterUserScriptUri } : {})
      })
    )
  }

  createGCE_fromPD_() {
    const { namespace, onSuccess } = this.props
    const { jupyterUserScriptUri, masterMachineType } = this.state
    const runtimeConfig = {
      cloudService: cloudServices.GCE,
      machineType: masterMachineType,
      persistentDisk: {
        name: this.getCurrentPersistentDisk().name
      }
    }
    onSuccess(
      Ajax().Clusters.cluster(namespace, Utils.generateClusterName()).create({
        runtimeConfig,
        toolDockerImage: this.getCorrectImage(),
        labels: this.generateClusterLabels(),
        ...(jupyterUserScriptUri ? { jupyterUserScriptUri } : {})
      })
    )
  }

  createDataproc_FromGCE_() {
    // TODO PD: decide how to implement me!
  }

  updateCluster(isStopRequired = false) {
    const { currentCluster, onSuccess } = this.props
    const { googleProject, runtimeName } = currentCluster

    if (isStopRequired) {
      notify('info', 'To be updated, your runtime will now stop, and then start. This will take 3-5 minutes.')
    }

    return onSuccess(
      Ajax().Clusters.cluster(googleProject, runtimeName).update({
        runtimeConfig: this.getRuntimeConfig()
      })
    )
  }

  hasStartUpScriptChanged() {
    const { jupyterUserScriptUri, currentClusterDetails } = this.state
    const originalJupyterUserScriptUri = currentClusterDetails?.jupyterUserScriptUri || ''
    return jupyterUserScriptUri !== originalJupyterUserScriptUri
  }

  hasImageChanged() {
    const { selectedLeoImage, customEnvImage, currentClusterDetails } = this.state
    const { imageUrl } = currentClusterDetails ? this.getImageUrl(currentClusterDetails) : ''
    return !_.includes(imageUrl, [selectedLeoImage, customEnvImage])
  }

  //determines whether the changes are applicable for a call to the leo patch endpoint
  //see this for a diagram of the conditional this implements https://drive.google.com/file/d/1mtFFecpQTkGYWSgPlaHksYaIudWHa0dY/view
  //this function returns true for cases 2 & 3 in this diagram
  canUpdate() {
    const { currentCluster } = this.props

    if (!currentCluster) return false

    const currentClusterConfig = normalizeRuntimeConfig(currentCluster.runtimeConfig)
    const userSelectedConfig = normalizeRuntimeConfig(this.getRuntimeConfig())

    const cantWorkersUpdate = currentClusterConfig.numberOfWorkers !== userSelectedConfig.numberOfWorkers &&
      (currentClusterConfig.numberOfWorkers < 2 || userSelectedConfig.numberOfWorkers < 2)

    const hasUnUpdateableResourceChanged =
      currentClusterConfig.workerDiskSize !== userSelectedConfig.workerDiskSize ||
      currentClusterConfig.workerMachineType !== userSelectedConfig.workerMachineType ||
      currentClusterConfig.numberOfWorkerLocalSSDs !== userSelectedConfig.numberOfWorkerLocalSSDs

    const hasWorkers = currentClusterConfig.numberOfWorkers >= 2 || currentClusterConfig.numberOfPreemptibleWorkers >= 2
    const hasWorkersResourceChanged = hasWorkers && hasUnUpdateableResourceChanged

    const hasDiskSizeDecreased = currentClusterConfig.masterDiskSize > userSelectedConfig.masterDiskSize

    const hasCloudServiceChanged = currentClusterConfig.cloudService !== userSelectedConfig.cloudService

    const cantUpdate = cantWorkersUpdate || hasWorkersResourceChanged || hasDiskSizeDecreased || hasCloudServiceChanged ||
      this.hasImageChanged() || this.hasStartUpScriptChanged()
    return !cantUpdate
  }

  hasChanges() {
    const { currentCluster } = this.props
    if (!currentCluster) return true

    const hasRuntimeConfigChanges = !_.isEqual(normalizeRuntimeConfig(currentCluster.runtimeConfig), normalizeRuntimeConfig(this.getRuntimeConfig()))

    return hasRuntimeConfigChanges || this.hasImageChanged() || this.hasStartUpScriptChanged()
  }

  //returns true for case 3 in this diagram: https://drive.google.com/file/d/1mtFFecpQTkGYWSgPlaHksYaIudWHa0dY/view
  isStopRequired() {
    const { currentCluster } = this.props

    const currentClusterConfig = normalizeRuntimeConfig(currentCluster.runtimeConfig)
    const userSelectedConfig = normalizeRuntimeConfig(this.getRuntimeConfig())

    const isMasterMachineTypeChanged = currentClusterConfig.masterMachineType !== userSelectedConfig.masterMachineType

    const isClusterRunning = currentCluster.status === 'Running'

    return this.canUpdate() && isMasterMachineTypeChanged && isClusterRunning
  }

  getRunningUpdateText() {
    return this.isStopRequired() ?
      p([
        'Changing the machine type (increasing or decreasing the # of CPUs or Mem) results in an update that requires a ',
        b(['restart']),
        ' of your runtime. This may take a 3-5 minutes. Would you like to proceed? ',
        b(['(You will not lose any files.)'])
      ]) :
      p([
        'Increasing the disk size or changing the number of workers (when the number of workers is >2) results in a real-time update to your runtime. ',
        'Updating the number of workers can take around 2 minutes. ',
        'During this update, you can continue to work.'
      ])
  }

  getImageUrl(clusterDetails) {
    const { runtimeImages } = clusterDetails
    return _.find(({ imageType }) => _.includes(imageType, ['Jupyter', 'RStudio']), runtimeImages)
  }

  componentDidMount = withErrorReporting('Error loading cluster', async () => {
    const { currentCluster, namespace } = this.props

    const [currentClusterDetails, newLeoImages] = await Promise.all([
      currentCluster ? Ajax().Clusters.cluster(currentCluster.googleProject, currentCluster.runtimeName).details() : null,
      Ajax().Buckets.getObjectPreview('terra-docker-image-documentation', 'terra-docker-versions.json', namespace, true).then(res => res.json())
    ])

    this.setState({ leoImages: newLeoImages, currentClusterDetails })
    if (currentClusterDetails) {
      const { jupyterUserScriptUri } = currentClusterDetails
      const { imageUrl } = this.getImageUrl(currentClusterDetails)
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
    const { currentCluster } = this.props
    const { showDebugger } = this.state
    const makeHeader = text => div({ style: { fontSize: 20, margin: '0.5rem 0' } }, [text])
    const makeJSON = value => div({ style: { whiteSpace: 'pre-wrap', fontFamily: 'Menlo, monospace' } }, [JSON.stringify(value, null, 2)])
    return h(Fragment, [
      showDebugger ?
        showDebugger && div({ style: { position: 'fixed', top: 0, left: 0, bottom: 0, right: '50vw', backgroundColor: 'white', padding: '1rem', overflowY: 'auto' } }, [
          h(Link, { onClick: () => this.setState({ showDebugger: false }), style: { position: 'absolute', top: 0, right: 0 } }, ['x']),
          makeHeader('Current Runtime'),
          makeJSON(currentCluster),
          makeHeader('Current PD'),
          makeJSON(this.getCurrentPersistentDisk())
        ]) :
        h(Link, { onClick: () => this.setState({ showDebugger: !showDebugger }), style: { position: 'fixed', top: 0, left: 0, color: 'white' } }, ['D'])
    ])
  }

  render() {
    const { currentCluster, onDismiss, onSuccess } = this.props
    const {
      profile, masterMachineType, masterDiskSize, persistentDiskSize, sparkMode, workerMachineType,
      numberOfWorkers, numberOfPreemptibleWorkers, workerDiskSize,
      jupyterUserScriptUri, selectedLeoImage, customEnvImage, leoImages, viewMode
    } = this.state
    const { version, updated, packages, requiresSpark } = _.find({ image: selectedLeoImage }, leoImages) || {}

    const isPersistentDisk = !sparkMode

    const onEnvChange = ({ value }) => {
      const requiresSpark = _.find({ image: value }, leoImages)?.requiresSpark
      const isCluster = sparkMode === 'cluster'

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
      const updateOrReplace = canUpdate ? 'update' : 'replace'

      return h(Fragment, [
        div({ style: { display: 'flex', margin: '3rem 0 1rem' } }, [
          !!currentCluster && !this.getCurrentPersistentDisk() && h(ButtonSecondary, { onClick: () => this.setState({ viewMode: 'deleteRuntime' }) }, ['Delete Runtime']),
          !currentCluster && !!this.getCurrentPersistentDisk() && h(ButtonSecondary, { onClick: () => this.setState({ viewMode: 'deletePersistentDisk' }) }, ['Delete Persistent Disk']),
          !!currentCluster && !!this.getCurrentPersistentDisk() && h(ButtonSecondary, { onClick: () => this.setState({ viewMode: 'deleteEnvironmentOptions' }) }, ['Delete Environment Options']),
          div({ style: { flex: 1 } }),
          h(ButtonSecondary, { style: { marginRight: '2rem' }, onClick: onDismiss }, 'Cancel'),
          h(ButtonPrimary, {
            disabled: !this.hasChanges() || !!errors,
            tooltip: Utils.summarizeErrors(errors),
            onClick: () => {
              if (isSelectedImageInputted && !canUpdate) {
                this.setState({ viewMode: 'warning' })
              } else if (!!currentCluster?.runtimeConfig?.persistentDiskId && !!sparkMode) {
                this.setState({ viewMode: 'switchFromGCEToDataproc' })
              } else if (!!currentCluster) {
                this.setState({ viewMode: updateOrReplace })
              } else {
                this.newCreateRuntime()
              }
            }
          }, !!currentCluster ? _.startCase(updateOrReplace) : 'Create')
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
                        _.pick(['masterMachineType', 'masterDiskSize'], normalizeRuntimeConfig(_.find({ name: value }, profiles).runtimeConfig)))
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
            diskSize: isPersistentDisk ? persistentDiskSize : masterDiskSize,
            //TODO(PD): change this function to work with persistent disks
            onChangeDiskSize: v => this.setState(isPersistentDisk ? { persistentDiskSize: v } : { masterDiskSize: v }),
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
          `${Utils.formatUSD(runtimeConfigCost(this.getRuntimeConfig(!currentCluster)))} per hour`
        ]),
        !!isPersistentDisk && h(IdContainer, [
          id => h(div, { style: { display: 'flex', flexDirection: 'column', marginTop: '1rem' } }, [
            label({ htmlFor: id, style: styles.label }, ['Persistent disk size (GB)']),
            h(NumberInput, {
              id,
              min: 10,
              max: 64000,
              isClearable: false,
              onlyInteger: true,
              value: persistentDiskSize,
              style: { marginTop: '0.5rem', width: '5rem' },
              onChange: value => this.setState({ persistentDiskSize: value })
            })
          ])
        ])
      ])
    ])

    const contents = Utils.switchCase(viewMode,
      ['packages', () => h(Fragment, [
        makeEnvSelect(),
        makeImageInfo({ margin: '1rem 0 0.5rem' }),
        packages && h(ImageDepViewer, { packageLink: packages })
      ])],
      ['switchFromGCEToDataproc', () => h(Fragment, [
        div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
          h(ButtonSecondary, { style: { marginRight: '2rem' }, onClick: () => this.setState({ viewMode: undefined }) }, ['CANCEL']),
          h(ButtonPrimary, { onClick: () => this.newCreateRuntime() }, ['REPLACE'])
        ])
      ])],
      ['warning', () => h(Fragment, [
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
            onClick: () => !!currentCluster ? this.setState({ viewMode: 'replace' }) : this.newCreateRuntime()
          }, [!!currentCluster ? 'Next' : 'Create'])
        ])
      ])],
      ['deleteRuntime', () => h(Fragment, [
        h(deleteText),
        div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
          h(ButtonSecondary, { style: { marginRight: '2rem' }, onClick: () => this.setState({ viewMode: undefined }) }, ['CANCEL']),
          h(ButtonPrimary, { onClick: () => onSuccess(this.deleteCluster()) }, ['DELETE'])
        ])
      ])],
      ['deletePersistentDisk', () => h(Fragment, [
        div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
          h(ButtonSecondary, { style: { marginRight: '2rem' }, onClick: () => this.setState({ viewMode: undefined }) }, ['CANCEL'])
        ])
      ])],
      ['deleteEnvironmentOptions', () => h(Fragment, [
        div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
          h(ButtonSecondary, { style: { marginRight: '2rem' }, onClick: () => this.setState({ viewMode: undefined }) }, ['CANCEL'])
        ])
      ])],
      ['replace', () => h(Fragment, [
        p([
          'Replacing your runtime will ', b(['delete any files on the associated hard disk ']),
          '(e.g. input data or analysis outputs) and installed packages. To permanently save these files, ',
          h(Link, {
            href: 'https://support.terra.bio/hc/en-us/articles/360026639112',
            ...Utils.newTabLinkProps
          }, ['move them to the workspace bucket.'])
        ]),
        p(['You will be unable to work on the notebooks in this workspace while it updates, which can take a few minutes.']),
        div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
          h(ButtonSecondary, {
            style: { marginRight: '2rem' },
            onClick: () => this.setState({ viewMode: undefined })
          }, ['BACK']),
          h(ButtonPrimary, { onClick: () => this.newCreateRuntime() }, ['REPLACE'])
        ])
      ])],
      ['update', () => h(Fragment, [
        currentCluster.status === 'Running' ?
          this.getRunningUpdateText() :
          p([
            'This will update your existing runtime. You will not lose any files. ',
            'After the update is finished you will be able to start your runtime. ',
            'Note that updating the number of workers requires your runtime to already be started.'
          ]),
        div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
          h(ButtonSecondary, {
            style: { marginRight: '2rem' },
            onClick: () => this.setState({ viewMode: undefined })
          }, ['BACK']),
          h(ButtonPrimary, { onClick: () => this.updateCluster(this.isStopRequired()) }, ['UPDATE'])
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
          ['packages', () => 'INSTALLED PACKAGES'],
          ['warning', () => 'WARNING!'],
          ['delete', () => 'DELETE RUNTIME?'],
          ['update', () => 'UPDATE RUNTIME?'],
          [Utils.DEFAULT, () => 'RUNTIME CONFIGURATION']
        ),
        onDismiss,
        onPrevious: !!viewMode ? () => this.setState({ viewMode: undefined }) : undefined
      }),
      div({ style: { padding: '0.5rem 1.5rem 1.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column' } }, [contents]),
      this.renderDebugger()
    ])
  }
})
