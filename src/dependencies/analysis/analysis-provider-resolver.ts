import { ComposedKey, createDependencyResolver } from '../dependency-core'


type AnalysisProviderExports =
  typeof import('src/libs/ajax/analysis-providers/AnalysisProvider')

export type AnalysisProviderDependencies = ComposedKey<AnalysisProviderExports, 'AnalysisProvider'>

export const analysisProviderDependencies = createDependencyResolver<AnalysisProviderDependencies>()
