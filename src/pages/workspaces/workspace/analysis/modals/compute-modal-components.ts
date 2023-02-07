import { div, h, label } from 'react-hyperscript-helpers'

import { Link, Select, useUniqueId } from '../../../../../components/common'
import { NumberInput } from '../../../../../components/input'
import TooltipTrigger from '../../../../../components/TooltipTrigger'
import { pdTypes } from '../../../../../pages/workspaces/workspace/analysis/runtime-utils'
import { computeStyles } from './modalStyles'


export const PersistentDiskType = ({ diskExists, computeConfig, updateComputeConfig }) => {
  const persistentDiskId = useUniqueId()
  return (
    h(div, [
      label({ htmlFor: persistentDiskId, style: computeStyles.label }, ['Disk Type']),
      div({ style: { marginTop: '0.5rem' } }, [
        h(Select, {
          id: persistentDiskId,
          value: computeConfig.selectedPersistentDiskType,
          isDisabled: diskExists,
          onChange: ({ value }) => updateComputeConfig('selectedPersistentDiskType', value),
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

export const PersistentDiskSection = ({ diskExists, computeConfig, updateComputeConfig, handleLearnMoreAboutPersistentDisk }) => {
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
