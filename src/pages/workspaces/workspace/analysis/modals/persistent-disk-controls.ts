import { br, div, h, label, p } from 'react-hyperscript-helpers'
import { Link, Select } from 'src/components/common'
import { icon } from 'src/components/icons'
import { NumberInput } from 'src/components/input'
import TitleBar from 'src/components/TitleBar'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { Ajax } from 'src/libs/ajax'
import { pdTypes } from 'src/libs/ajax/leonardo/models/disk-models'
import Events from 'src/libs/events'
import { useUniqueId } from 'src/libs/react-utils'
import * as Utils from 'src/libs/utils'
import { CloudProvider, cloudProviderTypes } from 'src/libs/workspace-utils'
import { computeStyles } from 'src/pages/workspaces/workspace/analysis/modals/modalStyles'
import { getCurrentMountDirectory, RuntimeToolLabel, runtimeToolLabels, ToolLabel } from 'src/pages/workspaces/workspace/analysis/utils/tool-utils'

import { IComputeConfig } from '../modal-utils'


export interface PersistentDiskControlProps {
  persistentDiskExists: boolean
  computeConfig: IComputeConfig
  updateComputeConfig: (arg: string) => (diskType: any) => void
  handleLearnMoreAboutPersistentDisk: React.MouseEventHandler
  setViewMode: () => void
  cloudPlatform: CloudProvider
}

export interface PersistentDiskTypeProps {
  persistentDiskExists: boolean
  computeConfig: IComputeConfig
  updateComputeConfig: (arg: string) => (diskType: any) => void
}

export type MountPoint = '/home/rstudio' | '/home/jupyter'

export const mountPoints: Record<RuntimeToolLabel, MountPoint> = {
  RStudio: '/home/rstudio',
  Jupyter: '/home/jupyter',
  JupyterLab: '/home/jupyter'
}

export const getMountDir = (toolLabel: RuntimeToolLabel): MountPoint => {
  return toolLabel === runtimeToolLabels.RStudio ? '/home/rstudio' : '/home/jupyter'
}

const PersistentDiskTypeSelect = Select as typeof Select<IComputeConfig['persistentDiskType']>

export interface PersistentDiskAboutProps {
  titleId: string
  setViewMode: any
  tool: ToolLabel
  onDismiss: () => void
}

export const handleLearnMoreAboutPersistentDisk = ({ setViewMode }) => {
  setViewMode('aboutPersistentDisk')
  Ajax().Metrics.captureEvent(Events.aboutPersistentDiskView)
}

export const AboutPersistentDisk = ({ titleId, setViewMode, tool, onDismiss }: PersistentDiskAboutProps) => {
  return (div({ style: computeStyles.drawerContent }, [
    h(TitleBar, {
      id: titleId,
      title: 'About persistent disk',
      style: computeStyles.titleBar,
      titleChildren: [],
      hideCloseButton: true,
      onDismiss,
      onPrevious: () => setViewMode(undefined)
    }),
    div({ style: { lineHeight: 1.5 } }, [
      p(['Your persistent disk is mounted in the directory ',
        ...getCurrentMountDirectory(tool), br(),
        'Please save your analysis data in this directory to ensure it’s stored on your disk.']),
      p(['Terra attaches a persistent disk (PD) to your cloud compute in order to provide an option to keep the data on the disk after you delete your compute. PDs also act as a safeguard to protect your data in the case that something goes wrong with the compute.']),
      p(['A minimal cost per hour is associated with maintaining the disk even when the cloud compute is paused or deleted.']),
      p(['If you delete your cloud compute, but keep your PD, the PD will be reattached when creating the next cloud compute.']),
      h(Link, { href: 'https://support.terra.bio/hc/en-us/articles/360047318551', ...Utils.newTabLinkProps }, [
        'Learn more about persistent disks',
        icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })
      ])
    ])
  ]))
}

export const PersistentDiskType = ({ persistentDiskExists, computeConfig, updateComputeConfig }: PersistentDiskTypeProps) => {
  const persistentDiskId = useUniqueId()
  return (
    h(div, [
      label({ htmlFor: persistentDiskId, style: computeStyles.label }, ['Disk Type']),
      div({ style: { marginTop: '0.5rem' } }, [
        h(PersistentDiskTypeSelect, {
          id: persistentDiskId,
          value: computeConfig.persistentDiskType,
          isDisabled: persistentDiskExists,
          onChange: e => updateComputeConfig('persistentDiskType')(e?.value),
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

export const PersistentDiskSection = ({ persistentDiskExists, computeConfig, updateComputeConfig, setViewMode, cloudPlatform }: PersistentDiskControlProps) => {
  const gridStyle = { display: 'grid', gridGap: '1rem', alignItems: 'center', marginTop: '1rem' }
  const diskSizeId = useUniqueId()

  return div({ style: { ...computeStyles.whiteBoxContainer, marginTop: '1rem' } }, [
    div({ style: { display: 'flex', flexDirection: 'column' } }, [
      label({ style: computeStyles.label }, ['Persistent disk']),
      div({ style: { marginTop: '0.5rem' } }, [
        'Persistent disks store analysis data. ',
        h(Link, {
          onClick: () => handleLearnMoreAboutPersistentDisk({ setViewMode })
        }, ['Learn more about persistent disks and where your disk is mounted.'])
      ]),
      div({ style: { ...gridStyle, gridGap: '1rem', gridTemplateColumns: '15rem 5.5rem', marginTop: '0.75rem' } }, [
        cloudProviderTypes.GCP === cloudPlatform ? renderPersistentDiskType({ persistentDiskExists, computeConfig, updateComputeConfig }) : false,
        h(div, [
          label({ htmlFor: diskSizeId, style: computeStyles.label }, ['Disk Size (GB)']),
          div({ style: { width: 75, marginTop: '0.5rem' } }, [
            h(NumberInput, {
              id: diskSizeId,
              min: 10,
              max: 64000,
              isClearable: false,
              onlyInteger: true,
              value: computeConfig.persistentDiskSize,
              onChange: updateComputeConfig('persistentDiskSize')
            })
          ])
        ])
      ])
    ])
  ])
}

const renderPersistentDiskType = ({ persistentDiskExists, computeConfig, updateComputeConfig }) => {
  return persistentDiskExists ? h(TooltipTrigger, {
    content: [
      'You already have a persistent disk in this workspace. ',
      'Disk type can only be configured at creation time. ',
      'Please delete the existing disk before selecting a new type.'
    ],
    side: 'bottom'
  }, [h(PersistentDiskType, { persistentDiskExists, computeConfig, updateComputeConfig })]) : h(PersistentDiskType, { persistentDiskExists, computeConfig, updateComputeConfig })
}
