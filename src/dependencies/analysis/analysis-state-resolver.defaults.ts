import {
  useAnalysisExportState,
} from 'src/pages/workspaces/workspace/analysis/modals/ExportAnalysisModal/ExportAnalysisModal.state'

import { AnalysisStateDependencies } from './analysis-state-resolver'


export const getDefaultAnalysisStateDeps = (): AnalysisStateDependencies => ({
  useAnalysisExportState: useAnalysisExportState.resolve()
})

