import { div, h, label } from 'react-hyperscript-helpers'
import { Link, Select } from 'src/components/common'
import { NumberInput } from 'src/components/input'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { useUniqueId } from 'src/libs/react-utils'
import { pdTypes } from 'src/pages/workspaces/workspace/analysis/disk-utils'
import { computeStyles } from 'src/pages/workspaces/workspace/analysis/modals/modalStyles'


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
