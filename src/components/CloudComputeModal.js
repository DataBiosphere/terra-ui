import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
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
  currentRuntime, DEFAULT_DISK_SIZE, DEFAULT_GPU_TYPE, DEFAULT_NUM_GPUS, defaultDataprocMachineType, defaultGceMachineType, displayNameForGpuType,
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

export const CloudComputeModalBase = Utils.withDisplayName('CloudComputeModal')(
  ({ onDismiss, onSuccess, runtimes, isAnalysisMode = false }) => {
    // TODO remove before merging
    const getCurrentRuntime = () => currentRuntime(runtimes)

    const [loading, setLoading] = useState(false)
    const [currentRuntimeDetails, setCurrentRuntimeDetails] = useState(getCurrentRuntime())
    const [viewMode, setViewMode] = useState(undefined)

    const { version, updated, packages, requiresSpark, label: packageLabel } = _.find({ image: selectedLeoImage }, leoImages) || {}



    const getCurrentMountDirectory = currentRuntimeDetails => {
      const rstudioMountPoint = '/home/rstudio'
      const jupyterMountPoint = '/home/jupyter/notebooks'
      const noMountDirectory = `${jupyterMountPoint} for Jupyter environments and ${rstudioMountPoint} for RStudio environments`
      return currentRuntimeDetails?.labels.tool ? (currentRuntimeDetails?.labels.tool === 'RStudio' ? rstudioMountPoint : jupyterMountPoint) : noMountDirectory
    }

    const renderImageSelect = ({ includeCustom, ...props }) => {
      return h(GroupedSelect, {
        ...props,
        maxMenuHeight: '25rem',
        value: selectedLeoImage,
        onChange: ({ value }) => {
          const requiresSpark = _.find({ image: value }, leoImages)?.requiresSpark
          this.setState({
            selectedLeoImage: value, customEnvImage: '',
            sparkMode: requiresSpark ? (sparkMode || 'master') : false
          })
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

    const makeImageInfo = style => div({ style: { whiteSpace: 'pre', ...style } }, [
      div({ style: Style.proportionalNumbers }, ['Updated: ', updated ? Utils.makeStandardDate(updated) : null]),
      div(['Version: ', version || null])
    ])

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

    return h(Fragment, [
      Utils.switchCase(viewMode,
        ['packages', renderPackages],
        ['aboutPersistentDisk', renderAboutPersistentDisk]
        // ['customImageWarning', renderCustomImageWarning],
        // ['environmentWarning', renderEnvironmentWarning],
        // ['deleteEnvironmentOptions', renderDeleteEnvironmentOptions],
        // [Utils.DEFAULT, renderMainForm]
      ),
      loading && spinnerOverlay,
      showDebugPanel && this.renderDebugger()
    ])
  })

export const CloudComputeModal = withModalDrawer({ width: 675, 'aria-labelledby': titleId })(
  CloudComputeModalBase
)
