import { Fragment } from 'react'
import { code, h, p, span } from 'react-hyperscript-helpers'
import { cloudServiceTypes, ComputeType } from 'src/libs/ajax/leonardo/models/runtime-config-models'
import * as Utils from 'src/libs/utils'
import { getMountDir, mountPoints } from 'src/pages/workspaces/workspace/analysis/modals/persistent-disk-controls'
import { RadioBlock, SaveFilesHelp, SaveFilesHelpAzure, SaveFilesHelpRStudio } from 'src/pages/workspaces/workspace/analysis/runtime-common-components'
import { ToolLabel } from 'src/pages/workspaces/workspace/analysis/utils/tool-utils'


type DeleteDiskChoicesProps = {
    persistentDiskCostDisplay: String
    deleteDiskSelected: boolean
    setDeleteDiskSelected: (p1:boolean) => void
    toolLabel?: ToolLabel
    cloudService?: ComputeType
}

export const DeleteDiskChoices = ({
  persistentDiskCostDisplay,
  deleteDiskSelected,
  setDeleteDiskSelected,
  toolLabel,
  cloudService
}: DeleteDiskChoicesProps) => {
  const getMountDirectoryDisplay = toolLabel => toolLabel ? getMountDir(toolLabel) : `${mountPoints.Jupyter} for Jupyter environments and ${mountPoints.RStudio} for RStudio environments`

  return (
    h(Fragment, [
      h(RadioBlock, {
        name: 'keep-persistent-disk',
        labelText: 'Keep persistent disk, delete application configuration and compute profile',
        checked: !deleteDiskSelected,
        onChange: () => setDeleteDiskSelected(false)
      }, [
        p(['Please save your analysis data in the directory ',
          code({ style: { fontWeight: 600 } }, [getMountDirectoryDisplay(toolLabel)]), ' to ensure it’s stored on your disk.']),
        p([
          'Deletes your application configuration and cloud compute profile, but detaches your persistent disk and saves it for later. ',
          'The disk will be automatically reattached the next time you create a cloud environment using the standard VM compute type.'
        ]),
        p({ style: { marginBottom: 0 } }, [
          'You will continue to incur persistent disk cost at ',
          span({ style: { fontWeight: 600 } },
            [`${persistentDiskCostDisplay} per month.`])
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
        [toolLabel === 'RStudio', () => h(SaveFilesHelpRStudio)],
        [cloudService === cloudServiceTypes.GCE, () => SaveFilesHelp(false)],
        [Utils.DEFAULT, () => h(SaveFilesHelpAzure)]
      )
    ])
  )
}
