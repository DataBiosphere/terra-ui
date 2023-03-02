import { ComposedKey, createDependencyResolver } from '../dependency-core'


type ExportAnalysisModalComponentExports =
  typeof import('src/pages/workspaces/workspace/analysis/modals/ExportAnalysisModal/ExportAnalysisModal.component')

export type AnalysisComponentDeps =
  ComposedKey<ExportAnalysisModalComponentExports, 'ExportAnalysisModal'>

export const analysisComponentDependencies = createDependencyResolver<AnalysisComponentDeps>()
