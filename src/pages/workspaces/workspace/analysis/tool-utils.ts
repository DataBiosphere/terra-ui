import _ from 'lodash/fp'
import { isCromwellAppVisible } from 'src/libs/config'
import * as Utils from 'src/libs/utils'
import { CloudProviderType } from 'src/libs/workspace-utils'
import { Extension } from 'src/pages/workspaces/workspace/analysis/file-utils'


export type RuntimeToolLabel = 'Jupyter' | 'RStudio' | 'JupyterLab'
export type AppToolLabel = 'Galaxy' | 'Cromwell'
export type MiscToolLabel = 'spark' | 'terminal'
export type ToolLabel = RuntimeToolLabel | AppToolLabel | MiscToolLabel

export const toolLabels: Record<ToolLabel, ToolLabel> = {
  Jupyter: 'Jupyter',
  RStudio: 'RStudio',
  terminal: 'terminal',
  spark: 'spark',
  JupyterLab: 'JupyterLab',
  Galaxy: 'Galaxy',
  Cromwell: 'Cromwell'
}

export const appToolLabelTypes: Record<AppToolLabel, AppToolLabel> = {
  Galaxy: 'Galaxy',
  Cromwell: 'Cromwell'
}

export const isAppToolLabel = (x: ToolLabel): x is AppToolLabel => x in appToolLabelTypes

export interface Tool {
  label: ToolLabel
  isHidden?: boolean
  isLaunchUnsupported?: boolean
  isPauseUnsupported?: boolean
}

export interface RuntimeTool extends Tool {
  ext: Extension[]
  imageIds: string[]
  defaultImageId: string
  defaultExt: Extension
}

export interface AppTool extends Tool {
  appType: string
}

export const terraSupportedRuntimeImageIds: string[] = [
  'terra-jupyter-bioconductor', 'terra-jupyter-hail', 'terra-jupyter-python', 'terra-jupyter-gatk', 'RStudio'
]

const RStudio: RuntimeTool = { label: toolLabels.RStudio, ext: ['Rmd', 'R'] as Extension[], imageIds: ['RStudio'], defaultImageId: 'RStudio', defaultExt: 'Rmd' as Extension }

const Jupyter: RuntimeTool = {
  label: toolLabels.Jupyter,
  ext: ['ipynb' as Extension],
  imageIds: ['terra-jupyter-bioconductor', 'terra-jupyter-bioconductor_legacy', 'terra-jupyter-hail', 'terra-jupyter-python', 'terra-jupyter-gatk', 'Pegasus', 'terra-jupyter-gatk_legacy'],
  defaultImageId: 'terra-jupyter-gatk',
  isLaunchUnsupported: true,
  defaultExt: 'ipynb' as Extension
}

const JupyterLab: RuntimeTool = {
  label: toolLabels.JupyterLab,
  ext: ['ipynb' as Extension],
  isLaunchUnsupported: false,
  defaultExt: 'ipynb' as Extension,
  imageIds: [],
  defaultImageId: '',
}

const Galaxy: AppTool = { label: toolLabels.Galaxy, appType: 'GALAXY' }

const Cromwell: AppTool = { label: toolLabels.Cromwell, appType: 'CROMWELL', isHidden: !isCromwellAppVisible(), isPauseUnsupported: true }

export const appTools: Record<AppToolLabel, AppTool> = {
  Galaxy,
  Cromwell
}

export const runtimeTools: Record<RuntimeToolLabel, RuntimeTool> = {
  RStudio,
  Jupyter,
  // azure should be changed in backend to be a same as jupyter
  // we should use analysis file's cloud provider to determine azure/other logic for jupyter
  JupyterLab,
}

export const tools: Record<ToolLabel, Tool> = {
  ...runtimeTools,
  ...appTools,
  terminal: { label: toolLabels.terminal },
  spark: { label: toolLabels.spark }
}

//The order of the array is important, it decides the order in AnalysisModal.
export const cloudRuntimeTools: Record<CloudProviderType, RuntimeTool[]> = {
  GCP: [
    Jupyter,
    RStudio
  ],
  AZURE: [
    JupyterLab
  ]
}

export const cloudAppTools: Record<CloudProviderType, AppTool[]> = {
  GCP: [
    Galaxy,
    Cromwell
  ],
  AZURE: []
}

export interface ExtensionDisplay {
  label: string
  value: Extension
}

export const toolExtensionDisplay: Partial<Record<ToolLabel, ExtensionDisplay[]>> = {
  RStudio: [
    { label: 'R Markdown (.Rmd)', value: 'Rmd' as Extension },
    { label: 'R Script (.R)', value: 'R' as Extension }
  ],
  Jupyter: [{ label: 'IPython Notebook (.ipynb)', value: 'ipynb' as Extension }]
}
export const getPatternFromRuntimeTool = (toolLabel: RuntimeToolLabel): string => Utils.switchCase(toolLabel,
  [toolLabels.RStudio, () => '.+(\\.R|\\.Rmd)$'],
  [toolLabels.Jupyter, () => '.*\\.ipynb'],
  [toolLabels.JupyterLab, () => '.*\\.ipynb']
)

export const getToolsToDisplayForCloudProvider = (cloudProvider: CloudProviderType): Tool[] => _.remove((tool: Tool) => !!tool.isHidden)(
  (cloudRuntimeTools[cloudProvider] as Tool[]).concat(cloudAppTools[cloudProvider] as Tool[]))

export const toolToExtensionMap: Record<ToolLabel, Extension> = _.flow(
  _.filter('ext'),
  _.map((tool: RuntimeTool) => ({ [tool.label]: tool.ext })),
  _.reduce(_.merge, {})
)(runtimeTools)

const extensionToToolMap: Partial<Record<Extension, RuntimeToolLabel>> = (() => {
  const extMap = {}
  _.forEach(extension => extMap[extension] = runtimeTools.RStudio.label, runtimeTools.RStudio.ext)
  _.forEach(extension => extMap[extension] = runtimeTools.Jupyter.label, runtimeTools.Jupyter.ext)
  return extMap
})()

export const getToolLabelForImage = (image: string): ToolLabel | undefined => _.find(tool => _.includes(image, tool.imageIds), runtimeTools)?.label

export const getToolLabelFromFileExtension = (fileName: Extension): ToolLabel | undefined => extensionToToolMap[fileName]

// TODO: runtime type
export const getToolLabelFromRuntime = (runtime: any): ToolLabel => _.get(['labels', 'tool'])(runtime)

export const getAppType = (label: ToolLabel): string | undefined => appTools[label]?.appType

// Returns registered appTypes.
export const allAppTypes: AppToolLabel[] = _.flow(_.map('appType'), _.compact)(appTools)

export const isPauseSupported = (toolLabel: ToolLabel): boolean => !_.find((tool: Tool) => tool.label === toolLabel)(tools)?.isPauseUnsupported

