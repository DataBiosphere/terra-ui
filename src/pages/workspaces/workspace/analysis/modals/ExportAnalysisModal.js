import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Fragment, useState } from 'react'
import { b, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer, spinnerOverlay } from 'src/components/common'
import ErrorView from 'src/components/ErrorView'
import Modal from 'src/components/Modal'
import { useWorkspaces, WorkspaceSelector } from 'src/components/workspace-utils'
import { Ajax } from 'src/libs/ajax'
import Events, { extractCrossWorkspaceDetails } from 'src/libs/events'
import { FormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import { useCancellation } from 'src/libs/react-utils'
import * as Utils from 'src/libs/utils'
import { getAnalysisFileExtension, getDisplayName, getExtension, stripExtension } from 'src/pages/workspaces/workspace/analysis/file-utils'
import { analysisNameInput, analysisNameValidator } from 'src/pages/workspaces/workspace/analysis/notebook-utils'
import { analysisLauncherTabName, analysisTabName } from 'src/pages/workspaces/workspace/analysis/runtime-common'
import validate from 'validate.js'


export const ExportAnalysisModal = ({ fromLauncher, onDismiss, printName, toolLabel, workspace }) => {
  // State
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(undefined)
  const [error, setError] = useState(undefined)
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [newName, setNewName] = useState(stripExtension(printName))
  const [existingNames, setExistingNames] = useState(undefined)
  const signal = useCancellation()
  const { workspaces } = useWorkspaces()

  // Helpers
  const selectedWorkspace = _.find({ workspace: { workspaceId: selectedWorkspaceId } }, workspaces)

  const findAnalysis = async v => {
    const tempChosenWorkspace = _.find({ workspace: { workspaceId: v } }, workspaces).workspace
    const selectedAnalyses = !!tempChosenWorkspace.googleProject ?
      await Ajax(signal).Buckets.listAnalyses(tempChosenWorkspace.googleProject, tempChosenWorkspace.bucketName) :
      await Ajax(signal).AzureStorage.listNotebooks(tempChosenWorkspace.workspaceId)
    setExistingNames(_.map(({ name }) => getDisplayName(name), selectedAnalyses))
  }

  const copy = Utils.withBusyState(setCopying, async () => {
    try {
      if (!!workspace.workspace.googleProject) {
        await Ajax()
          .Buckets
          .analysis(workspace.workspace.googleProject, workspace.workspace.bucketName, printName, toolLabel)
          .copy(`${newName}.${getExtension(printName)}`, selectedWorkspace.workspace.bucketName)
      } else {
        await Ajax(signal).AzureStorage
          .blob(workspace.workspace.workspaceId, printName)
          .copy(stripExtension(newName), selectedWorkspace.workspace.workspaceId)
      }
      setCopied(true)
      Ajax().Metrics.captureEvent(Events.notebookCopy, { oldName: printName, newName, ...extractCrossWorkspaceDetails(workspace, selectedWorkspace) })
    } catch (error) {
      setError(await error.text())
    }
  })

  // Render
  const errors = validate(
    { selectedWorkspaceId, newName },
    {
      selectedWorkspaceId: { presence: true },
      newName: analysisNameValidator(existingNames)
    },
    { prettify: v => ({ newName: 'Name' }[v] || validate.prettify(v)) }
  )

  return h(Modal, {
    title: 'Copy to Workspace',
    onDismiss,
    cancelText: copied ? 'Stay Here' : undefined,
    okButton: h(ButtonPrimary, {
      tooltip: Utils.summarizeErrors(errors),
      disabled: !!errors,
      onClick: copied ?
        () => Nav.goToPath(fromLauncher ? analysisLauncherTabName : analysisTabName, {
          namespace: selectedWorkspace.workspace.namespace,
          name: selectedWorkspace.workspace.name,
          analysisName: `${newName}.${getAnalysisFileExtension(toolLabel)}`,
          toolLabel
        }) :
        copy
    }, [copied ? 'Go to copied analysis' : 'Copy'])
  }, [
    copied ?
      h(Fragment, [
        'Successfully copied ',
        b([newName]),
        ' to ',
        b([selectedWorkspace.workspace.name]),
        '. Do you want to view the copied analysis?'
      ]) :
      h(Fragment, [
        h(IdContainer, [id => h(Fragment, [
          h(FormLabel, { htmlFor: id, required: true }, ['Destination']),
          h(WorkspaceSelector, {
            id,
            workspaces: _.filter(Utils.isValidWsExportTarget(workspace), workspaces),
            value: selectedWorkspaceId,
            onChange: v => {
              setSelectedWorkspaceId(v)
              findAnalysis(v)
            }
          })
        ])]),
        h(IdContainer, [id => h(Fragment, [
          h(FormLabel, { htmlFor: id, required: true }, ['Name']),
          analysisNameInput({
            error: Utils.summarizeErrors(errors?.newName),
            inputProps: {
              id,
              value: newName,
              onChange: setNewName
            }
          })
        ])])
      ]),
    copying && spinnerOverlay,
    error && h(ErrorView, { error })
  ])
}

ExportAnalysisModal.propTypes = {
  fromLauncher: PropTypes.bool,
  onDismiss: PropTypes.func.isRequired,
  printName: PropTypes.string.isRequired,
  workspace: PropTypes.object.isRequired
}

export default ExportAnalysisModal
