import { Fragment } from 'react'
import { code, div, h, p, span } from 'react-hyperscript-helpers'
import TitleBar from 'src/components/TitleBar'
import { cloudServices } from 'src/data/gce-machines'
import * as Utils from 'src/libs/utils'
import { computeStyles } from 'src/pages/workspaces/workspace/analysis/modals/modalStyles'
import { WarningTitle } from 'src/pages/workspaces/workspace/analysis/modals/WarningTitle'
import { RadioBlock, SaveFilesHelp, SaveFilesHelpAzure, SaveFilesHelpRStudio } from 'src/pages/workspaces/workspace/analysis/runtime-common-components'
import { getPersistentDiskCostMonthly } from 'src/pages/workspaces/workspace/analysis/utils/cost-utils'


export const DeleteDiskChoices = ({ runtime, persistentDisk, deleteDiskSelected, setDeleteDiskSelected }:
    { runtime:any; persistentDisk: any; deleteDiskSelected:boolean; setDeleteDiskSelected:(p1:boolean)=>void }) => {
  const getCurrentMountDirectory = () => {
    const rstudioMountPoint = '/home/rstudio'
    const jupyterMountPoint = '/home/jupyter'
    const noMountDirectory = `${jupyterMountPoint} for Jupyter environments and ${rstudioMountPoint} for RStudio environments`
    return runtime.tool ?
      (runtime.tool === 'RStudio' ? rstudioMountPoint : jupyterMountPoint) :
      noMountDirectory
  }

  return (
    h(Fragment, [
      h(RadioBlock, {
        name: 'keep-persistent-disk',
        labelText: 'Keep persistent disk, delete application configuration and compute profile',
        checked: !deleteDiskSelected,
        onChange: () => setDeleteDiskSelected(false)
      }, [
        p(['Please save your analysis data in the directory ',
          code({ style: { fontWeight: 600 } }, [getCurrentMountDirectory()]), ' to ensure it’s stored on your disk.']),
        p([
          'Deletes your application configuration and cloud compute profile, but detaches your persistent disk and saves it for later. ',
          'The disk will be automatically reattached the next time you create a cloud environment using the standard VM compute type.'
        ]),
        p({ style: { marginBottom: 0 } }, [
          'You will continue to incur persistent disk cost at ',
          span({ style: { fontWeight: 600 } },
            [Utils.formatUSD(getPersistentDiskCostMonthly(persistentDisk, runtime.region)), ' per month.']) //TODO: switch case for azure?
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
      Utils.cond(
        [runtime.tool === 'RStudio', () => h(SaveFilesHelpRStudio)],
        [runtime.cloudService === cloudServices.GCE, h(() => SaveFilesHelp(false))],
        () => h(SaveFilesHelpAzure)
      )
    ])
  )
}


export const DeleteEnvironment = ({ id, runtime, persistentDisk, deleteDiskSelected, setDeleteDiskSelected, setViewMode, renderActionButton, hideCloseButton, onDismiss }:
{ id:string; runtime:any; persistentDisk:any; deleteDiskSelected:boolean; setDeleteDiskSelected:(p1:boolean)=>void; setViewMode: (value: React.SetStateAction<string|undefined>) => void; renderActionButton: ()=> React.ReactElement<any, any>; hideCloseButton:boolean; onDismiss: React.MouseEventHandler<Element>}) => {
  return (div({ style: { ...computeStyles.drawerContent, ...computeStyles.warningView } }, [
    h(TitleBar, {
      id,
      style: computeStyles.titleBar,
      title: h(WarningTitle, ['Delete environment']),
      hideCloseButton,
      onDismiss,
      titleChildren: [],
      onPrevious: () => { //TODO: fix back arrow
        setViewMode(undefined)
        setDeleteDiskSelected(false)
      }
    }),
    div({ style: { lineHeight: '1.5rem' } }, [
      Utils.cond(
        [runtime && persistentDisk && persistentDisk.id !== runtime?.runtimeConfig?.persistentDiskId, () => {
          return h(Fragment, [
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
            runtime.tool === 'RStudio' ? h(SaveFilesHelpRStudio) : h(SaveFilesHelpAzure)
          ])
        }],
        [runtime && persistentDisk, () => {
          return h(
            DeleteDiskChoices,
            {
              runtime,
              persistentDisk,
              deleteDiskSelected,
              setDeleteDiskSelected
            }
          )
        }],
        [!runtime && persistentDisk, () => {
          return h(Fragment, [
            h(RadioBlock, {
              name: 'delete-persistent-disk',
              labelText: 'Delete persistent disk',
              checked: deleteDiskSelected,
              onChange: () => setDeleteDiskSelected(true)
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
          ])
        }],
        () => {
          return h(Fragment, [
            p([
              'Deleting your application configuration and cloud compute profile will also ',
              span({ style: { fontWeight: 600 } }, ['delete all files on the built-in hard disk.'])
            ]),
            runtime.tool === 'RStudio' ? h(SaveFilesHelpRStudio) : h(SaveFilesHelpAzure)
          ])
        }
      )
    ]),
    div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
      renderActionButton()
    ])
  ]))
}
