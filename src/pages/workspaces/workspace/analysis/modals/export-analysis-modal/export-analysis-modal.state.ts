import _ from 'lodash/fp'
import { useState } from 'react'
import { useWorkspaces } from 'src/components/workspace-utils'
import { AnalysisProvider } from 'src/libs/ajax/analysis-providers/AnalysisProvider'
import { useLoadedData } from 'src/libs/ajax/loaded-data/useLoadedData'
import { useMetricsEvent } from 'src/libs/ajax/metrics/useMetrics'
import Events, { extractCrossWorkspaceDetails } from 'src/libs/events'
import { useCancellation } from 'src/libs/react-utils'
import LoadedState from 'src/libs/type-utils/LoadedState'
import { WorkspaceInfo, WorkspaceWrapper } from 'src/libs/workspace-utils'
import {
  AnalysisFile,
  getDisplayName
} from 'src/pages/workspaces/workspace/analysis/file-utils'
import { ToolLabel } from 'src/pages/workspaces/workspace/analysis/tool-utils'


export type LoadedAnalysisNames = LoadedState<string[], unknown>

export interface AnalysisExportState {
  workspaces: WorkspaceWrapper[]
  selectWorkspace: (workspaceId: string) => void
  selectedWorkspace: WorkspaceInfo | null
  existingAnalysisNames: LoadedAnalysisNames
  copyAnalysis: (newName: string) => void
  pendingCopy: LoadedState<true, unknown>
}

export const errors = {
  badWorkspace: 'Selected Workspace does not exist',
  noWorkspace: 'No workspace selected'
}

export const useAnalysesExportState = (sourceWorkspace: WorkspaceWrapper, printName: string, toolLabel: ToolLabel): AnalysisExportState => {
  const { captureEvent } = useMetricsEvent()
  const signal = useCancellation()
  const workspaces: WorkspaceWrapper[] = useWorkspaces().workspaces
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceWrapper | null>(null)
  const [existingAnalysisNames, setExistingAnalysisNames] = useLoadedData<string[]>()
  const [pendingCopy, setPendingCopy] = useLoadedData<true>()

  const doSelectWorkspace = async (workspaceId: string): Promise<void> => {
    await setExistingAnalysisNames(async () => {
      const foundWorkspaceWrapper = _.find({ workspace: { workspaceId } }, workspaces)
      if (foundWorkspaceWrapper === undefined) {
        throw (Error(errors.badWorkspace))
      }
      const chosenWorkspace = foundWorkspaceWrapper.workspace
      setSelectedWorkspace(foundWorkspaceWrapper)

      const selectedAnalyses: AnalysisFile[] = await AnalysisProvider.listAnalyses(chosenWorkspace, signal)
      const names = _.map(({ name }) => getDisplayName(name), selectedAnalyses)
      return names
    })
  }

  const doCopy = async (newName: string): Promise<void> => {
    await setPendingCopy(async () => {
      if (selectedWorkspace === null) {
        throw (Error(errors.noWorkspace))
      }
      await AnalysisProvider.copyAnalysis(
        sourceWorkspace.workspace, printName, toolLabel, selectedWorkspace.workspace, newName, signal
      )
      captureEvent(Events.notebookCopy, {
        oldName: printName,
        newName,
        ...extractCrossWorkspaceDetails(sourceWorkspace, selectedWorkspace)
      })
      return true
    })
  }

  return ({
    workspaces,
    selectedWorkspace: selectedWorkspace ? selectedWorkspace.workspace : null,
    selectWorkspace: (workspaceId: string): void => {
      // fire and forget
      void doSelectWorkspace(workspaceId)
    },
    copyAnalysis: (newName: string): void => {
      // fire and forget
      void doCopy(newName)
    },
    existingAnalysisNames,
    pendingCopy
  })
}
