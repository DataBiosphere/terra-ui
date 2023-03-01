import _ from 'lodash/fp'
import { Runtime } from 'src/libs/ajax/leonardo/models/runtime-models'
import { isCromwellAppVisible, isCromwellOnAzureAppVisible } from 'src/libs/config'
import * as Utils from 'src/libs/utils'
import { CloudProvider, cloudProviderTypes } from 'src/libs/workspace-utils'
import { FileExtension, getExtension } from 'src/pages/workspaces/workspace/analysis/utils/file-utils'
import { cloudProviders } from 'src/pages/workspaces/workspace/analysis/utils/runtime-utils'


export type RuntimeToolLabel = 'Jupyter' | 'RStudio' | 'JupyterLab'
export type AppToolLabel = 'GALAXY' | 'CROMWELL'
export type LaunchableToolLabel = 'spark' | 'terminal' | 'RStudio' | 'JupyterLab'
export type ToolLabel = RuntimeToolLabel | AppToolLabel

export const launchableToolLabel: Record<LaunchableToolLabel, LaunchableToolLabel> = {
  RStudio: 'RStudio',
  JupyterLab: 'JupyterLab',
  terminal: 'terminal',
  spark: 'spark',
}

export const runtimeToolLabels: Record<RuntimeToolLabel, RuntimeToolLabel> = {
  Jupyter: 'Jupyter',
  RStudio: 'RStudio',
  JupyterLab: 'JupyterLab',
}

export const toolLabelDisplays: Record<ToolLabel, string> = {
  Jupyter: 'Jupyter',
  RStudio: 'RStudio',
  JupyterLab: 'JupyterLab',
  GALAXY: 'Galaxy',
  CROMWELL: 'Cromwell'
}

export const appToolLabels: Record<AppToolLabel, AppToolLabel> = {
  GALAXY: 'GALAXY',
  CROMWELL: 'CROMWELL'
}

export const isAppToolLabel = (x: ToolLabel): x is AppToolLabel => x in appToolLabels

export interface BaseTool {
  isLaunchUnsupported?: boolean
  isPauseUnsupported?: boolean
}

export interface RuntimeTool extends BaseTool {
  label: RuntimeToolLabel
  ext: FileExtension[]
  imageIds: string[]
  defaultImageId: string
  defaultExt: FileExtension
}

export interface AppTool extends BaseTool {
  label: AppToolLabel // Alias for appType
}

export type Tool = AppTool | RuntimeTool

export const terraSupportedRuntimeImageIds: string[] = [
  'terra-jupyter-bioconductor', 'terra-jupyter-hail', 'terra-jupyter-python', 'terra-jupyter-gatk', 'RStudio'
]

const RStudio: RuntimeTool = { label: runtimeToolLabels.RStudio, ext: ['Rmd', 'R'] as FileExtension[], imageIds: ['RStudio'], defaultImageId: 'RStudio', defaultExt: 'Rmd' as FileExtension }

const Jupyter: RuntimeTool = {
  label: runtimeToolLabels.Jupyter,
  ext: ['ipynb' as FileExtension],
  imageIds: ['terra-jupyter-bioconductor', 'terra-jupyter-bioconductor_legacy', 'terra-jupyter-hail', 'terra-jupyter-python', 'terra-jupyter-gatk', 'Pegasus', 'terra-jupyter-gatk_legacy'],
  defaultImageId: 'terra-jupyter-gatk',
  isLaunchUnsupported: true,
  defaultExt: 'ipynb' as FileExtension
}

const JupyterLab: RuntimeTool = {
  label: runtimeToolLabels.JupyterLab,
  ext: ['ipynb' as FileExtension],
  isLaunchUnsupported: false,
  defaultExt: 'ipynb' as FileExtension,
  imageIds: [],
  defaultImageId: '',
}

const Galaxy: AppTool = { label: 'GALAXY' }

const Cromwell: AppTool = { label: 'CROMWELL', isPauseUnsupported: true }

export const appTools: Record<AppToolLabel, AppTool> = {
  GALAXY: Galaxy,
  CROMWELL: Cromwell
}

export const runtimeTools: Record<RuntimeToolLabel, RuntimeTool> = {
  RStudio,
  Jupyter,
  // azure should be changed in backend to be a same as jupyter
  // we should use analysis file's cloud provider to determine azure/other logic for jupyter
  JupyterLab,
}

export const tools: Record<ToolLabel, AppTool | RuntimeTool> = {
  ...runtimeTools,
  ...appTools
}

//The order of the array is important, it decides the order in AnalysisModal.
export const cloudRuntimeTools: Record<CloudProvider, RuntimeTool[]> = {
  GCP: [
    Jupyter,
    RStudio
  ],
  AZURE: [
    JupyterLab
  ]
}

export const cloudAppTools: Record<CloudProvider, AppTool[]> = {
  GCP: [
    Galaxy,
    Cromwell
  ],
  AZURE: [
    Cromwell
  ]
}

export interface ExtensionDisplay {
  label: string
  value: FileExtension
}

export const toolExtensionDisplay: Partial<Record<ToolLabel, ExtensionDisplay[]>> = {
  RStudio: [
    { label: 'R Markdown (.Rmd)', value: 'Rmd' as FileExtension },
    { label: 'R Script (.R)', value: 'R' as FileExtension }
  ],
  Jupyter: [{ label: 'IPython Notebook (.ipynb)', value: 'ipynb' as FileExtension }]
}
export const getPatternFromRuntimeTool = (toolLabel: RuntimeToolLabel): string => Utils.switchCase(toolLabel,
  [runtimeToolLabels.RStudio, () => '.+(\\.R|\\.Rmd)$'],
  [runtimeToolLabels.Jupyter, () => '.*\\.ipynb'],
  [runtimeToolLabels.JupyterLab, () => '.*\\.ipynb']
)

export const getToolsToDisplayForCloudProvider = (cloudProvider: CloudProvider): Tool[] => _.remove((tool: Tool) => isToolHidden(tool.label, cloudProvider))(
  (cloudRuntimeTools[cloudProvider] as Tool[]).concat(cloudAppTools[cloudProvider] as Tool[]))

export const toolToExtensionMap: Record<ToolLabel, FileExtension> = _.flow(
  _.filter('ext'),
  _.map((tool: RuntimeTool) => ({ [tool.label]: tool.ext })),
  _.reduce(_.merge, {})
)(runtimeTools)

export type AnalysisFileExtension = 'Rmd' | 'R' | 'ipynb'
const extensionToToolMap: Record<AnalysisFileExtension, ToolLabel> = {
  Rmd: runtimeTools.RStudio.label,
  R: runtimeTools.RStudio.label,
  ipynb: runtimeTools.Jupyter.label
}

export const getToolLabelForImage = (image: string): ToolLabel | undefined => _.find(tool => _.includes(image, tool.imageIds), runtimeTools)?.label

// Currently, a lot of consumers of this are not typescript, so we defensively use `getExtension` on the input
// TODO: Once all consumer are in typescript, we can remove `getExtension` from this function
export const getToolLabelFromFileExtension = (fileName: FileExtension): ToolLabel => extensionToToolMap[getExtension(fileName)]

export const getToolLabelFromRuntime = (runtime: Runtime): ToolLabel => runtime?.labels?.tool

// Returns registered appTypes.
export const allAppTypes: AppToolLabel[] = _.flow(_.map('label'), _.compact)(appTools)

export const isPauseSupported = (toolLabel: ToolLabel): boolean => !_.find((tool: AppTool | RuntimeTool) => tool.label === toolLabel)(tools)?.isPauseUnsupported

export const isSettingsSupported = (toolLabel: ToolLabel, cloudProvider: CloudProvider): boolean => !(toolLabel === appToolLabels.CROMWELL && cloudProvider === cloudProviders.azure.label)

export const isToolHidden = (toolLabel: ToolLabel, cloudProvider: CloudProvider): boolean => Utils.cond(
  [toolLabel === appToolLabels.CROMWELL && cloudProvider === cloudProviderTypes.GCP && !isCromwellAppVisible(), () => true],
  [toolLabel === appToolLabels.CROMWELL && cloudProvider === cloudProviderTypes.AZURE && !isCromwellOnAzureAppVisible(), () => true],
  [Utils.DEFAULT, () => false]
)
