import { AnalysisProviderDependencies } from 'src/dependencies/analysis/analysis-provider-resolver'
import { AnalysisProvider } from 'src/libs/ajax/analysis-providers/AnalysisProvider'


export const getDefaultAnalysisProviderDeps = (): AnalysisProviderDependencies => {
  return ({
    AnalysisProvider: AnalysisProvider.resolve()
  })
}
