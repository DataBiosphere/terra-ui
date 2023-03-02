import { ComposedKey, createDependencyResolver } from '../dependency-core'


type ExportAnalysisModalStateExports =
  typeof import('src/pages/workspaces/workspace/analysis/modals/ExportAnalysisModal/ExportAnalysisModal.state')

export type AnalysisStateDependencies =
  ComposedKey<ExportAnalysisModalStateExports, 'useAnalysisExportState'>

export const analysisStateDependencies = createDependencyResolver<AnalysisStateDependencies>()
