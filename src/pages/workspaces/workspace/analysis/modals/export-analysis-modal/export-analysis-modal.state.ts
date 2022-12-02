import _ from 'lodash/fp'
import { useState } from 'react'
import { useWorkspaces } from 'src/components/workspace-utils'
import { AnalysisProvider } from 'src/libs/ajax/analysis-providers/AnalysisProvider'
import { useMetricsEvent } from 'src/libs/ajax/metrics/useMetrics'
import Events, { extractCrossWorkspaceDetails } from 'src/libs/events'
import { useCancellation } from 'src/libs/react-utils'
import LoadedState from 'src/libs/type-utils/LoadedState'
import { returnsPromise } from 'src/libs/type-utils/type-helpers'
import { WorkspaceInfo, WorkspaceWrapper } from 'src/libs/workspace-utils'
import {
  AnalysisFile,
  getDisplayName
} from 'src/pages/workspaces/workspace/analysis/file-utils'


export type LoadedAnalysisNames = LoadedState<string[], unknown>

export interface AnalysisExportState {
  workspaces: WorkspaceWrapper[]
  selectWorkspace: (workspaceId: string) => void
  selectedWorkspace: WorkspaceInfo | null
  existingAnalysisNames: LoadedAnalysisNames
  copyAnalysis: (newName: string) => void
  pendingCopy: LoadedState<true, unknown>
}

export const useAnalysesExportState = (sourceWorkspace: WorkspaceWrapper, printName: string, toolLabel): AnalysisExportState => {
  const captureEvent = useMetricsEvent()
  const signal = useCancellation()
  const workspaces: WorkspaceWrapper[] = useWorkspaces().workspaces
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceWrapper | null>(null)
  const [existingAnalysisNames, setExistingAnalysisNames] = useState<LoadedAnalysisNames>({
    status: 'None'
  })
  const [pendingCopy, setPendingCopy] = useState<LoadedState<true, unknown>>({
    status: 'None'
  })

  const doSelectWorkspace = async (workspaceId: string): Promise<void> => {
    setExistingAnalysisNames({
      status: 'Loading',
      state: null
    })
    const foundWorkspaceWrapper = _.find({ workspace: { workspaceId } }, workspaces)
    if (foundWorkspaceWrapper === undefined) {
      setExistingAnalysisNames({
        status: 'Error',
        state: null,
        error: Error('Selected Workspace does not exist')
      })
      return
    }
    const chosenWorkspace = foundWorkspaceWrapper.workspace
    try {
      const selectedAnalyses: AnalysisFile[] = await AnalysisProvider.listAnalyses(chosenWorkspace, signal)
      setExistingAnalysisNames({
        status: 'Ready',
        state: _.map(({ name }) => getDisplayName(name), selectedAnalyses)
      })
      setSelectedWorkspace(foundWorkspaceWrapper)
    } catch (err) {
      setExistingAnalysisNames({
        status: 'Error',
        state: null,
        error: returnsPromise((err as Response).text) ?
          Error(await (err as Response).text()) :
          err
      })
    }
  }

  const doCopy = async (newName: string): Promise<void> => {
    setPendingCopy(({ status: 'Loading', state: null }))
    try {
      if (selectedWorkspace === null) {
        setPendingCopy({ status: 'Error', state: null, error: Error('No workspace selected') })
        return
      }
      await AnalysisProvider.copyAnalysis(
        sourceWorkspace.workspace, printName, toolLabel, selectedWorkspace.workspace, newName, signal
      )
      setPendingCopy({ status: 'Ready', state: true })

      captureEvent(Events.notebookCopy, {
        oldName: printName,
        newName,
        ...extractCrossWorkspaceDetails(sourceWorkspace, selectedWorkspace)
      })
    } catch (err) {
      setPendingCopy({
        status: 'Error',
        state: null,
        error: returnsPromise((err as Response).text) ?
          Error(await (err as Response).text()) :
          err
      })
    }
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
