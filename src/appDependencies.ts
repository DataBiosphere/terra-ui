import { analysisComponentDependencies } from 'src/dependencies/analysis/analysis-component-resolver'
import { getDefaultAnalysisComponentDeps } from 'src/dependencies/analysis/analysis-component-resolver.defaults'
import { analysisProviderDependencies } from 'src/dependencies/analysis/analysis-provider-resolver'
import { getDefaultAnalysisProviderDeps } from 'src/dependencies/analysis/analysis-provider-resolver.defaults'
import { analysisStateDependencies } from 'src/dependencies/analysis/analysis-state-resolver'
import { getDefaultAnalysisStateDeps } from 'src/dependencies/analysis/analysis-state-resolver.defaults'
import { componentDependencies } from 'src/dependencies/component-resolver'
import { getDefaultComponentDeps } from 'src/dependencies/component-resolver.defaults'
import { dataClientDependencies } from 'src/dependencies/data-client-resolver'
import { getDefaultDataClientDeps } from 'src/dependencies/data-client-resolver.defaults'


export const initAppDependencies = () => {
  dataClientDependencies.set(getDefaultDataClientDeps)
  componentDependencies.set(getDefaultComponentDeps)

  // Analysis dependencies
  analysisProviderDependencies.set(getDefaultAnalysisProviderDeps)
  analysisStateDependencies.set(getDefaultAnalysisStateDeps)
  analysisComponentDependencies.set(getDefaultAnalysisComponentDeps)
}
