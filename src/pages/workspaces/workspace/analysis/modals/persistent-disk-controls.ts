import { br, code, div, h, label, p } from 'react-hyperscript-helpers'
import { Link, Select } from 'src/components/common'
import { icon } from 'src/components/icons'
import { NumberInput } from 'src/components/input'
import TitleBar from 'src/components/TitleBar'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { Ajax } from 'src/libs/ajax'
import Events, { extractWorkspaceDetails } from 'src/libs/events'
import { useUniqueId } from 'src/libs/react-utils'
import * as Utils from 'src/libs/utils'
import { computeStyles } from 'src/pages/workspaces/workspace/analysis/modals/modalStyles'
import { getCurrentMountDirectory, getCurrentRuntime, getWorkspaceObject, pdTypes, runtimeTypes } from 'src/pages/workspaces/workspace/analysis/runtime-utils'


interface IComputeConfig {
  selectedPersistentDiskSize: number
  selectedPersistentDiskType: {
    label: string
    displayName: string
    regionToPricesName: string
  }
  masterMachineType: any
  masterDiskSize: number
  numberOfWorkers: number
  numberOfPreemptibleWorkers: number
  workerMachineType: string
  workerDiskSize: number
  componentGatewayEnabled: boolean
  gpuEnabled: boolean
  hasGpu: boolean
  gpuType: string
  numGpus: number
  autopauseThreshold: number
  computeRegion: string
  computeZone: string
}

interface PersistentDiskProps {
  diskExists: boolean
  computeConfig: IComputeConfig
  updateComputeConfig: (arg: string) => (diskType: string) => void
  handleLearnMoreAboutPersistentDisk: React.MouseEventHandler
}

interface PersistentDiskTypeProps {
  diskExists: boolean
  computeConfig: IComputeConfig
  updateComputeConfig: (arg: string) => (diskType: string) => void
}

// STATE STUFF TO FIGURE OUT
// - setViewMode
// - currentRuntimeDetails
// - getDesiredEnvironmentConfig, getExistingEnvironmentConfig

interface PersistentDiskLearnProps {
  hasAttachedDisk: () => boolean
  setViewMode: React.Dispatch<any> //TODO (LM) not sure if this is correct
}

interface PersistentDiskAboutProps {
  titleId: string
  setViewMode: React.Dispatch<any> //TODO (LM) not sure if this is correct
  onDismiss: () => void
}

export const handleLearnMoreAboutPersistentDisk = ({ hasAttachedDisk, setViewMode }: PersistentDiskLearnProps) => {
  setViewMode('aboutPersistentDisk')
  Ajax().Metrics.captureEvent(Events.aboutPersistentDiskView, {
    ...extractWorkspaceDetails(getWorkspaceObject()), currentlyHasAttachedDisk: !!hasAttachedDisk()
  })
}

// TODO, check if unattached azure PD
export const shouldUsePersistentDisk = (runtimeType, runtimeDetails, upgradeDiskSelected) => runtimeType === runtimeTypes.gceVm &&
  (!runtimeDetails?.runtimeConfig?.diskSize || upgradeDiskSelected)

export const renderAboutPersistentDisk = ({ titleId, setViewMode, onDismiss }: PersistentDiskAboutProps) => {
  return div({ style: computeStyles.drawerContent }, [
    h(TitleBar, {
      id: titleId,
      title: 'About persistent disk',
      style: computeStyles.titleBar,
      titleExtras: [],
      hideCloseButton: true,
      onDismiss,
      onPrevious: () => setViewMode(undefined)
    }),
    div({ style: { lineHeight: 1.5 } }, [
      p(['Your persistent disk is mounted in the directory ',
        code({ style: { fontWeight: 600 } }, [getCurrentMountDirectory(getCurrentRuntime)]), br(),
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

export const PersistentDiskType = ({ diskExists, computeConfig, updateComputeConfig }: PersistentDiskTypeProps) => {
  const persistentDiskId = useUniqueId()
  return (
    h(div, [
      label({ htmlFor: persistentDiskId, style: computeStyles.label }, ['Disk Type']),
      div({ style: { marginTop: '0.5rem' } }, [
        h(Select, {
          id: persistentDiskId,
          value: computeConfig.selectedPersistentDiskType,
          isDisabled: diskExists,
          onChange: e => updateComputeConfig('selectedPersistentDiskType')(e.value),
          menuPlacement: 'auto',
          options: [
            { label: pdTypes.standard.displayName, value: pdTypes.standard },
            { label: pdTypes.balanced.displayName, value: pdTypes.balanced },
            { label: pdTypes.ssd.displayName, value: pdTypes.ssd }
          ]
        })
      ])
    ])
  )
}

export const PersistentDiskSection = ({ diskExists, computeConfig, updateComputeConfig, handleLearnMoreAboutPersistentDisk }: PersistentDiskProps) => {
  const gridStyle = { display: 'grid', gridGap: '1rem', alignItems: 'center', marginTop: '1rem' }
  const diskSizeId = useUniqueId()

  return div({ style: { ...computeStyles.whiteBoxContainer, marginTop: '1rem' } }, [
    div({ style: { display: 'flex', flexDirection: 'column' } }, [
      label({ style: computeStyles.label }, ['Persistent disk']),
      div({ style: { marginTop: '0.5rem' } }, [
        'Persistent disks store analysis data. ',
        h(Link, { onClick: handleLearnMoreAboutPersistentDisk }, ['Learn more about persistent disks and where your disk is mounted.'])
      ]),
      div({ style: { ...gridStyle, gridGap: '1rem', gridTemplateColumns: '15rem 5.5rem', marginTop: '0.75rem' } }, [
        diskExists ?
          h(TooltipTrigger, {
            content: [
              'You already have a persistent disk in this workspace. ',
              'Disk type can only be configured at creation time. ',
              'Please delete the existing disk before selecting a new type.'
            ],
            side: 'bottom'
          }, [h(PersistentDiskType, { diskExists, computeConfig, updateComputeConfig })]) : h(PersistentDiskType, { diskExists, computeConfig, updateComputeConfig }),
        h(div, [
          label({ htmlFor: diskSizeId, style: computeStyles.label }, ['Disk Size (GB)']),
          div({ style: { marginTop: '0.5rem' } }, [
            h(NumberInput, {
              id: diskSizeId,
              min: 10,
              max: 64000,
              isClearable: false,
              onlyInteger: true,
              value: computeConfig.selectedPersistentDiskSize,
              onChange: updateComputeConfig('selectedPersistentDiskSize')
            })
          ])
        ])
      ])
    ])
  ])
}
