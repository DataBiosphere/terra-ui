import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Fragment, useState } from 'react'
import { b, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, spinnerOverlay, useUniqueIdFn } from 'src/components/common'
import ErrorView from 'src/components/ErrorView'
import Modal from 'src/components/Modal'
import { WorkspaceSelector } from 'src/components/workspace-utils'
import { FormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'
import { WorkspaceInfo } from 'src/libs/workspace-utils'
import { getAnalysisFileExtension, stripExtension } from 'src/pages/workspaces/workspace/analysis/file-utils'
import { useAnalysesExportState } from 'src/pages/workspaces/workspace/analysis/modals/export-analysis-modal/export-analysis-modal.state'
import {
  analysisNameInput, analysisNameValidator
} from 'src/pages/workspaces/workspace/analysis/notebook-utils'
import { analysisLauncherTabName, analysisTabName } from 'src/pages/workspaces/workspace/analysis/runtime-common'
import validate from 'validate.js'


export const ExportAnalysisModal = ({ fromLauncher, onDismiss, printName, toolLabel, workspace }) => {
  // State
  const unique = useUniqueIdFn()
  const [newName, setNewName] = useState(stripExtension(printName))
  const {
    workspaces, selectedWorkspace, selectWorkspace, existingAnalysisNames, pendingCopy, copyAnalysis
  } = useAnalysesExportState(workspace, printName, toolLabel)

  const selectedWorkspaceId = selectedWorkspace ? selectedWorkspace.workspaceId : undefined
  // TODO: better loading/error handling on existing names?
  const existingNames = existingAnalysisNames.status === 'Ready' ? existingAnalysisNames.state : []
  const copying = pendingCopy.status === 'Loading'
  const copiedToWorkspace: WorkspaceInfo | null = (pendingCopy.status === 'Ready' && selectedWorkspace) ?
    selectedWorkspace :
    null
  const copyError = pendingCopy.status === 'Error' ? pendingCopy.error : null

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
    cancelText: copiedToWorkspace ? 'Stay Here' : undefined,
    okButton: h(ButtonPrimary, {
      tooltip: Utils.summarizeErrors(errors),
      disabled: !!errors,
      onClick: copiedToWorkspace ?
        () => Nav.goToPath(fromLauncher ? analysisLauncherTabName : analysisTabName, {
          namespace: copiedToWorkspace.namespace,
          name: copiedToWorkspace.name,
          analysisName: `${newName}.${getAnalysisFileExtension(toolLabel)}`,
          toolLabel
        }) :
        () => copyAnalysis(newName)
    }, [copiedToWorkspace ? 'Go to copied analysis' : 'Copy'])
  }, [
    copiedToWorkspace ?
      h(Fragment, [
        'Successfully copied ',
        b([newName]),
        ' to ',
        b([copiedToWorkspace.name]),
        '. Do you want to view the copied analysis?'
      ]) :
      h(Fragment, [
        h(Fragment, [
          h(FormLabel, { htmlFor: unique('workspace-selector'), required: true }, ['Destination']),
          h(WorkspaceSelector, {
            id: unique('workspace-selector'),
            'aria-label': undefined,
            workspaces: _.filter(Utils.isValidWsExportTarget(workspace), workspaces),
            value: selectedWorkspaceId,
            onChange: (v: string): void => selectWorkspace(v)
          })
        ]),
        h(Fragment, [
          h(FormLabel, { htmlFor: unique('analysis-name'), required: true }, ['Name']),
          analysisNameInput({
            error: Utils.summarizeErrors(errors?.newName),
            inputProps: {
              id: unique('analysis-name'),
              value: newName,
              onChange: setNewName
            }
          })
        ])
      ]),
    copying && spinnerOverlay,
    !!copyError && h(ErrorView, { error: copyError })
  ])
}

ExportAnalysisModal.propTypes = {
  fromLauncher: PropTypes.bool,
  onDismiss: PropTypes.func.isRequired,
  printName: PropTypes.string.isRequired,
  workspace: PropTypes.object.isRequired
}

export default ExportAnalysisModal
