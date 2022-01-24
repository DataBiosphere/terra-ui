import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Fragment, useState } from 'react'
import { b, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer, spinnerOverlay } from 'src/components/common'
import ErrorView from 'src/components/ErrorView'
import Modal from 'src/components/Modal'
import { analysisNameInput, analysisNameValidator, getAnalysisFileExtension, getDisplayName } from 'src/components/notebook-utils'
import { analysisLauncherTabName, analysisTabName } from 'src/components/runtime-common'
import { useWorkspaces, WorkspaceSelector } from 'src/components/workspace-utils'
import { Ajax } from 'src/libs/ajax'
import Events, { extractCrossWorkspaceDetails } from 'src/libs/events'
import { FormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import { useCancellation } from 'src/libs/react-utils'
import * as Utils from 'src/libs/utils'
import validate from 'validate.js'


//TODO: deprecate once notebook tab is removed
const cutName = name => name.slice(10, -6) // removes 'notebooks/' and the .ipynb suffix

//TODO: deprecate once notebook tab is removed. See ExportAnalysisModal for replacement
const ExportNotebookModal = ({ fromLauncher, onDismiss, printName, workspace }) => {
  // State
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(undefined)
  const [error, setError] = useState(undefined)
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [newName, setNewName] = useState(printName)
  const [existingNames, setExistingNames] = useState(undefined)

  const signal = useCancellation()
  const { workspaces } = useWorkspaces()


  // Helpers
  const selectedWorkspace = _.find({ workspace: { workspaceId: selectedWorkspaceId } }, workspaces)

  const findNotebooks = async v => {
    const tempChosenWorkspace = _.find({ workspace: { workspaceId: v } }, workspaces).workspace
    const selectedNotebooks = await Ajax(signal).Buckets.listNotebooks(tempChosenWorkspace.googleProject, tempChosenWorkspace.bucketName)
    setExistingNames(_.map(({ name }) => cutName(name), selectedNotebooks))
  }

  const copy = Utils.withBusyState(setCopying, async () => {
    try {
      await Ajax()
        .Buckets
        .notebook(workspace.workspace.googleProject, workspace.workspace.bucketName, printName)
        .copy(newName, selectedWorkspace.workspace.bucketName)
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
        () => Nav.goToPath(fromLauncher ? 'workspace-notebook-launch' : 'workspace-notebooks', {
          namespace: selectedWorkspace.workspace.namespace,
          name: selectedWorkspace.workspace.name,
          notebookName: `${newName}.ipynb`
        }) :
        copy
    }, [copied ? 'Go to copied notebook' : 'Copy'])
  }, [
    copied ?
      h(Fragment, [
        'Successfully copied ',
        b([newName]),
        ' to ',
        b([selectedWorkspace.workspace.name]),
        '. Do you want to view the copied notebook?'
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
              findNotebooks(v)
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

export const ExportAnalysisModal = ({ fromLauncher, onDismiss, printName, toolLabel, workspace }) => {
  // State
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(undefined)
  const [error, setError] = useState(undefined)
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [newName, setNewName] = useState(printName)
  const [existingNames, setExistingNames] = useState(undefined)

  const signal = useCancellation()
  const { workspaces } = useWorkspaces()

  // Helpers
  const selectedWorkspace = _.find({ workspace: { workspaceId: selectedWorkspaceId } }, workspaces)

  const findAnalysis = async v => {
    const tempChosenWorkspace = _.find({ workspace: { workspaceId: v } }, workspaces).workspace
    const selectedAnalyses = await Ajax(signal).Buckets.listAnalyses(tempChosenWorkspace.googleProject, tempChosenWorkspace.bucketName)
    setExistingNames(_.map(({ name }) => getDisplayName(name), selectedAnalyses))
  }

  const copy = Utils.withBusyState(setCopying, async () => {
    try {
      await Ajax()
        .Buckets
        .analysis(workspace.workspace.googleProject, workspace.workspace.bucketName, printName, toolLabel)
        .copy(newName, selectedWorkspace.workspace.bucketName)
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

ExportNotebookModal.propTypes = {
  fromLauncher: PropTypes.bool,
  onDismiss: PropTypes.func.isRequired,
  printName: PropTypes.string.isRequired,
  workspace: PropTypes.object.isRequired
}

ExportAnalysisModal.propTypes = {
  fromLauncher: PropTypes.bool,
  onDismiss: PropTypes.func.isRequired,
  printName: PropTypes.string.isRequired,
  workspace: PropTypes.object.isRequired
}

export default ExportNotebookModal
