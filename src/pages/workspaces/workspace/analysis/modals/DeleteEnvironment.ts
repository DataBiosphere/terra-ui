import { Fragment } from 'react'
import { div, h, p, span } from 'react-hyperscript-helpers'
import TitleBar from 'src/components/TitleBar'
import { isDataprocConfig, isGceConfig, isGceWithPdConfig, RuntimeConfig } from 'src/libs/ajax/leonardo/models/runtime-config-models'
import * as Utils from 'src/libs/utils'
import { DeleteDiskChoices } from 'src/pages/workspaces/workspace/analysis/modals/DeleteDiskChoices'
import { computeStyles } from 'src/pages/workspaces/workspace/analysis/modals/modalStyles'
import { WarningTitle } from 'src/pages/workspaces/workspace/analysis/modals/WarningTitle'
import { RadioBlock, SaveFilesHelpAzure, SaveFilesHelpRStudio } from 'src/pages/workspaces/workspace/analysis/runtime-common-components'
import { getPersistentDiskCostMonthly } from 'src/pages/workspaces/workspace/analysis/utils/cost-utils'
import { runtimeToolLabels, ToolLabel } from 'src/pages/workspaces/workspace/analysis/utils/tool-utils'


type DeleteEnvironmentProps = {
  id:string
  runtimeConfig?:RuntimeConfig|null
  persistentDisk?: any //TODO: retype this as PersistentDisk
  deleteDiskSelected:boolean
  setDeleteDiskSelected:(p1:boolean)=> void
  setViewMode: (value: React.SetStateAction<string|undefined>) => void
  renderActionButton: ()=> React.ReactElement<any, any>
  hideCloseButton:boolean
  onDismiss: () => void
  toolLabel: ToolLabel
  computeRegion?:string
}

export const DeleteEnvironment = ({
  id,
  runtimeConfig,
  persistentDisk,
  deleteDiskSelected,
  setDeleteDiskSelected,
  setViewMode,
  renderActionButton,
  hideCloseButton,
  onDismiss,
  toolLabel,
  computeRegion
}: DeleteEnvironmentProps) => {
  return div({ style: { ...computeStyles.drawerContent, ...computeStyles.warningView } }, [
    h(TitleBar, {
      id,
      style: computeStyles.titleBar,
      title: h(WarningTitle, ['Delete environment']),
      hideCloseButton,
      onDismiss,
      titleChildren: [],
      onPrevious: () => {
        setViewMode(undefined)
        setDeleteDiskSelected(false)
      }
    }),
    div({ style: { lineHeight: '1.5rem' } }, [
      Utils.cond(
        [runtimeConfig && persistentDisk &&
          (!isGceConfig(runtimeConfig) || isGceWithPdConfig(runtimeConfig)) && // this line checks if the runtime is a GCE VM with a PD attached
          !isDataprocConfig(runtimeConfig) && //and this line makes sure it's not a Dataproc config
          persistentDisk.id !== runtimeConfig?.persistentDiskId, () => h(Fragment, [
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
          toolLabel === runtimeToolLabels.RStudio ? h(SaveFilesHelpRStudio) : h(SaveFilesHelpAzure)
        ])],
        [runtimeConfig && persistentDisk, () => h(
          DeleteDiskChoices,
          {
            persistentDiskCostDisplay: Utils.formatUSD(getPersistentDiskCostMonthly(persistentDisk!, computeRegion)),
            deleteDiskSelected,
            setDeleteDiskSelected,
            toolLabel,
            cloudService: runtimeConfig?.cloudService
          }
        )],
        [!runtimeConfig && persistentDisk, () => h(Fragment, [
          h(RadioBlock, {
            name: 'delete-persistent-disk',
            labelText: 'Delete persistent disk',
            checked: true,
            onChange: () => {}
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
        ])],
        [Utils.DEFAULT, () => h(Fragment, [
          p([
            'Deleting your application configuration and cloud compute profile will also ',
            span({ style: { fontWeight: 600 } }, ['delete all files on the built-in hard disk.'])
          ]),
          toolLabel === 'RStudio' ? h(SaveFilesHelpRStudio) : h(SaveFilesHelpAzure)
        ])]
      )
    ]),
    div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
      renderActionButton()
    ])
  ])
}
