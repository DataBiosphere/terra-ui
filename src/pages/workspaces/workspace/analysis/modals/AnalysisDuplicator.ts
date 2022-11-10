import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer } from 'src/components/common'
import { centeredSpinner } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import Events from 'src/libs/events'
import { FormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import { useCancellation, useOnMount } from 'src/libs/react-utils'
import * as Utils from 'src/libs/utils'
import { getExtension, getFileName } from 'src/pages/workspaces/workspace/analysis/file-utils'
import { analysisNameInput, analysisNameValidator } from 'src/pages/workspaces/workspace/analysis/notebook-utils'
import { analysisLauncherTabName } from 'src/pages/workspaces/workspace/analysis/runtime-common'
import validate from 'validate.js'


export const AnalysisDuplicator = ({ destroyOld = false, fromLauncher = false, printName, toolLabel, workspaceName, googleProject, workspaceId, namespace, bucketName, onDismiss, onSuccess }) => {
  const [newName, setNewName] = useState('')
  const [existingNames, setExistingNames] = useState([])
  const [nameTouched, setNameTouched] = useState(false)
  const [processing, setProcessing] = useState(false)
  const signal = useCancellation()

  useOnMount(() => {
    const loadNames = async () => {
      const existingAnalyses = !!googleProject ?
        await Ajax(signal).Buckets.listAnalyses(googleProject, bucketName) :
        await Ajax(signal).AzureStorage.listNotebooks(workspaceId)
      const existingNames = _.map(({ name }) => getFileName(name), existingAnalyses)
      //@ts-expect-error
      setExistingNames(existingNames)
    }
    loadNames()
  })

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
      onClick: async () => {
        setProcessing(true)
        try {
          const rename = !!googleProject ?
            () => Ajax().Buckets.analysis(googleProject, bucketName, printName, toolLabel).rename(newName) :
            () => Ajax().AzureStorage.blob(workspaceId, printName).rename(newName)

          const duplicate = !!googleProject ?
            () => Ajax().Buckets.analysis(googleProject, bucketName, getFileName(printName), toolLabel).copy(`${newName}.${getExtension(printName)}`, bucketName, true) :
            () => Ajax().AzureStorage.blob(workspaceId, printName).copy(newName)

          if (destroyOld) {
            await rename()
          } else {
            await duplicate()
          }

          onSuccess()
          if (fromLauncher) {
            Nav.goToPath(analysisLauncherTabName, {
              namespace, name: workspaceName, analysisName: `${newName}.${getExtension(printName)}`, toolLabel
            })
          }
          if (destroyOld) {
            //@ts-expect-error
            Ajax().Metrics.captureEvent(Events.notebookRename, {
              oldName: printName,
              newName,
              workspaceName,
              workspaceNamespace: namespace
            })
          } else {
            //@ts-expect-error
            Ajax().Metrics.captureEvent(Events.notebookCopy, {
              oldName: printName,
              newName,
              fromWorkspaceNamespace: namespace,
              fromWorkspaceName: workspaceName,
              toWorkspaceNamespace: namespace,
              toWorkspaceName: workspaceName
            })
          }
        } catch (error) {
          reportError(`Error ${destroyOld ? 'renaming' : 'copying'} analysis`, error)
        }
      }
    }, [`${destroyOld ? 'Rename' : 'Copy'} Analysis`])
  },
  Utils.cond(
    [processing, () => [centeredSpinner()]],
    () => [
      //@ts-expect-error
      h(IdContainer, [id => h(Fragment, [
        h(FormLabel, { htmlFor: id, required: true }, ['New Name']),
        analysisNameInput({
          error: Utils.summarizeErrors(nameTouched && errors && errors.newName),
          inputProps: {
            id, value: newName,
            onChange: v => {
              setNewName(v)
              setNameTouched(true)
            }
          }
        })
      ])])
    ]
  ))
}
