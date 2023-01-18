import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import { ButtonPrimary } from 'src/components/common'
import { centeredSpinner } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { withErrorReportingInModal } from 'src/libs/error'
import Events, { extractCrossWorkspaceDetails, extractWorkspaceDetails } from 'src/libs/events'
import { FormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'
import { isGoogleWorkspaceInfo, WorkspaceInfo } from 'src/libs/workspace-utils'
import {
  DisplayName,
  FileName, getDisplayName,
  getExtension,
  getFileName, useAnalysisFiles
} from 'src/pages/workspaces/workspace/analysis/file-utils'
import {
  analysisNameInput,
  analysisNameValidator
} from 'src/pages/workspaces/workspace/analysis/notebook-utils'
import { analysisLauncherTabName } from 'src/pages/workspaces/workspace/analysis/runtime-common'
import { ToolLabel } from 'src/pages/workspaces/workspace/analysis/tool-utils'
import validate from 'validate.js'


export interface AnalysisDuplicatorProps {
  destroyOld?: boolean
  fromLauncher?: boolean
  printName: FileName
  toolLabel: ToolLabel
  workspaceInfo: WorkspaceInfo
  onDismiss: () => void
  onSuccess: () => void
}

export const AnalysisDuplicator = ({ destroyOld = false, fromLauncher = false, printName, toolLabel, workspaceInfo, onDismiss, onSuccess }: AnalysisDuplicatorProps) => {
  const [newName, setNewName] = useState<string>('')
  const { loadedState } = useAnalysisFiles()
  const analyses = loadedState.status !== 'None' ? loadedState.state : null

  const existingNames: DisplayName[] = _.map(({ name }) => getDisplayName(name), analyses)

  const [nameTouched, setNameTouched] = useState<boolean>(false)
  const [processing, setProcessing] = useState<boolean>(false)

  const errors = validate(
    { newName },
    { newName: analysisNameValidator(existingNames) },
    { prettify: v => ({ newName: 'Name' }[v] || validate.prettify(v)) }
  )

  return h(Modal, {
    onDismiss,
    title: `${destroyOld ? 'Rename' : 'Copy'} "${printName}"`,
    okButton: h(ButtonPrimary, {
      disabled: errors || processing,
      tooltip: Utils.summarizeErrors(errors),
      // @ts-expect-error
      onClick: withErrorReportingInModal(`Error ${destroyOld ? 'renaming' : 'copying'} analysis`, onDismiss, async () => {
        setProcessing(true)
        const rename = isGoogleWorkspaceInfo(workspaceInfo) ?
          () => Ajax().Buckets.analysis(workspaceInfo.googleProject, workspaceInfo.bucketName, printName, toolLabel).rename(newName) :
          () => Ajax().AzureStorage.blob(workspaceInfo.workspaceId, printName).rename(newName)

        const duplicate = isGoogleWorkspaceInfo(workspaceInfo) ?
          () => Ajax().Buckets.analysis(workspaceInfo.googleProject, workspaceInfo.bucketName, getFileName(printName), toolLabel).copy(`${newName}.${getExtension(printName)}`, workspaceInfo.bucketName, true) :
          () => Ajax().AzureStorage.blob(workspaceInfo.workspaceId, printName).copy(newName)

        if (destroyOld) {
          await rename()
          Ajax().Metrics.captureEvent(Events.notebookRename, {
            oldName: printName,
            newName,
            ...extractWorkspaceDetails(workspaceInfo)
          })
        } else {
          await duplicate()
          Ajax().Metrics.captureEvent(Events.notebookCopy, {
            oldName: printName,
            newName,
            ...extractCrossWorkspaceDetails({ workspace: workspaceInfo }, { workspace: workspaceInfo })
          })
        }

        onSuccess()
        if (fromLauncher) {
          Nav.goToPath(analysisLauncherTabName, {
            namespace: workspaceInfo.namespace, name: workspaceInfo.name, analysisName: `${newName}.${getExtension(printName)}`, toolLabel
          })
        }
      })
    }, [`${destroyOld ? 'Rename' : 'Copy'} Analysis`])
  },
  Utils.cond(
    [processing, () => [centeredSpinner()]],
    () => [
      h(Fragment, [
        h(FormLabel, { htmlFor: 'analysis-duplicator-id', required: true }, ['New Name']),
        analysisNameInput({
          error: Utils.summarizeErrors(nameTouched && errors && errors.newName),
          inputProps: {
            id: 'analysis-duplicator-id', value: newName,
            onChange: v => {
              setNewName(v as DisplayName)
              setNameTouched(true)
            }
          }
        })
      ])
    ]
  ))
}
