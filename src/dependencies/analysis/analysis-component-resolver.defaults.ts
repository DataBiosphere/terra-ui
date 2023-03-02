import {
  ExportAnalysisModal
} from 'src/pages/workspaces/workspace/analysis/modals/ExportAnalysisModal/ExportAnalysisModal.component'

import { AnalysisComponentDeps } from './analysis-component-resolver'


export const getDefaultAnalysisComponentDeps = (): AnalysisComponentDeps => ({
  ExportAnalysisModal: ExportAnalysisModal.resolve()
})
