import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { b, h } from 'react-hyperscript-helpers'
import { spinnerOverlay, useUniqueId } from 'src/components/common'
import ErrorView from 'src/components/ErrorView'
import Modal from 'src/components/Modal'
import { WorkspaceSelector } from 'src/components/workspace-utils'
import { AnalysisStateDependencies, analysisStateDependencies } from 'src/dependencies/analysis/analysis-state-resolver'
import { ComponentDependencies, componentDependencies } from 'src/dependencies/component-resolver'
import { Composable } from 'src/dependencies/dependency-core'
import { FormLabel } from 'src/libs/forms'
import { goToPath as navToPath } from 'src/libs/nav'
import { isValidWsExportTarget, summarizeErrors } from 'src/libs/utils'
import { WorkspaceInfo, WorkspaceWrapper } from 'src/libs/workspace-utils'
import { getAnalysisFileExtension, stripExtension } from 'src/pages/workspaces/workspace/analysis/file-utils'
import {
  analysisNameInput, analysisNameValidator
} from 'src/pages/workspaces/workspace/analysis/notebook-utils'
import { analysisLauncherTabName, analysisTabName } from 'src/pages/workspaces/workspace/analysis/runtime-common-components'
import { ToolLabel } from 'src/pages/workspaces/workspace/analysis/tool-utils'
import validate from 'validate.js'


export interface ExportAnalysisModalDeps {
  components: Pick<ComponentDependencies, 'ButtonPrimary' | 'ButtonSecondary'>
  analysisState: Pick<AnalysisStateDependencies, 'useAnalysisExportState'>
}

export interface ExportAnalysisModalProps {
  fromLauncher?: boolean
  onDismiss: (event: unknown) => void
  printName: string
  toolLabel: ToolLabel
  workspace: WorkspaceWrapper
}

export type ComposableExportAnalysisModal = Composable<
    ExportAnalysisModalDeps,
    React.FC<ExportAnalysisModalProps>
    >

export const ExportAnalysisModal: ComposableExportAnalysisModal = {
  compose: (deps: ExportAnalysisModalDeps) => {
    const FC: React.FC<ExportAnalysisModalProps> = props => {
      const { fromLauncher, onDismiss, printName, toolLabel, workspace: sourceWorkspace } = props
      const { ButtonPrimary } = deps.components
      const { useAnalysisExportState } = deps.analysisState

      const uniqueId = useUniqueId()
      const unique = (prefix: string): string => `${prefix}-${uniqueId}`
      const [newName, setNewName] = useState<string>(stripExtension(printName))
      const {
        workspaces, selectedWorkspace, existingAnalysisNames, pendingCopy, selectWorkspace, copyAnalysis
      } = useAnalysisExportState({ sourceWorkspace, printName, toolLabel })

      const selectedWorkspaceId = selectedWorkspace ? selectedWorkspace.workspaceId : undefined
      // TODO: better loading/error handling on existing names?
      const existingNames = existingAnalysisNames.status === 'Ready' ? existingAnalysisNames.state : []
      const copying = pendingCopy.status === 'Loading'
      const copiedToWorkspace: WorkspaceInfo | null = (pendingCopy.status === 'Ready' && selectedWorkspace) ?
        selectedWorkspace :
        null
      const copyError = pendingCopy.status === 'Error' ? pendingCopy.error : null

      // Render
      const formErrors = validate(
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
          tooltip: summarizeErrors(formErrors),
          disabled: !!formErrors,
          onClick: copiedToWorkspace ?
            () => navToPath(fromLauncher ? analysisLauncherTabName : analysisTabName, {
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
                workspaces: _.filter(isValidWsExportTarget(sourceWorkspace), workspaces),
                value: selectedWorkspaceId,
                onChange: (v: string): void => selectWorkspace(v)
              })
            ]),
            h(Fragment, [
              h(FormLabel, { htmlFor: unique('analysis-name'), required: true }, ['Name']),
              analysisNameInput({
                error: summarizeErrors(formErrors?.newName),
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
    return FC
  },
  resolve: () => ExportAnalysisModal.compose({
    components: componentDependencies.get(),
    analysisState: analysisStateDependencies.get()
  })
}
