import _ from 'lodash/fp'
import { isCromwellAppVisible } from 'src/libs/config'
import * as Utils from 'src/libs/utils'
import { Extension, getExtension } from 'src/pages/workspaces/workspace/analysis/file-utils'


export type RuntimeToolLabel = 'Jupyter' | 'RStudio' | 'Azure'
export type AppToolLabel = 'Galaxy' | 'Cromwell'
export type MiscToolLabel = 'spark' | 'terminal'
export type ToolLabel = RuntimeToolLabel | AppToolLabel | MiscToolLabel

export const toolLabelTypes: Record<ToolLabel, ToolLabel> = {
  Jupyter: 'Jupyter',
  RStudio: 'RStudio',
  terminal: 'terminal',
  spark: 'spark',
  Azure: 'Azure',
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
  isNotebook?: boolean
  isLaunchUnsupported?: boolean
  isPauseUnsupported?: boolean
  isAzureCompatible?: boolean
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

export const appTools: Record<AppToolLabel, AppTool> = {
  Galaxy: { label: 'Galaxy', appType: 'GALAXY' },
  Cromwell: { label: 'Cromwell', appType: 'CROMWELL', isHidden: !isCromwellAppVisible(), isPauseUnsupported: true }
}

export const runtimeTools: Record<RuntimeToolLabel, RuntimeTool> = {
  RStudio: { label: 'RStudio', ext: ['Rmd', 'R'] as Extension[], imageIds: ['RStudio'], defaultImageId: 'RStudio', defaultExt: 'Rmd' as Extension },
  Jupyter: {
    label: 'Jupyter',
    ext: ['ipynb' as Extension],
    isNotebook: true,
    imageIds: ['terra-jupyter-bioconductor', 'terra-jupyter-bioconductor_legacy', 'terra-jupyter-hail', 'terra-jupyter-python', 'terra-jupyter-gatk', 'Pegasus', 'terra-jupyter-gatk_legacy'],
    defaultImageId: 'terra-jupyter-gatk',
    isLaunchUnsupported: true,
    defaultExt: 'ipynb' as Extension
  },
  // azure should be changed in backend to be a same as jupyter
  // we should use analysis file's cloud provider to determine azure/other logic for jupyter
  Azure: {
    label: 'Azure',
    isNotebook: true,
    ext: ['ipynb' as Extension],
    isAzureCompatible: true,
    isLaunchUnsupported: false,
    defaultExt: 'ipynb' as Extension,
    imageIds: [],
    defaultImageId: ''
  }
}

export const tools: Record<ToolLabel, Tool> = {
  ...runtimeTools,
  ...appTools,
  terminal: { label: 'terminal' },
  spark: { label: 'spark' }
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
export const getPatternFromTool = (toolLabel: ToolLabel): string => Utils.switchCase(toolLabel,
  [tools.RStudio.label, () => '.+(\\.R|\\.Rmd)$'],
  [tools.Jupyter.label, () => '.*\\.ipynb'],
  [tools.Azure.label, () => '.*\\.ipynb']
)
// Returns the tools in the order that they should be displayed for Cloud Environment tools
export const getToolsToDisplay = (isAzureWorkspace: boolean): Tool[] => _.flow(
  _.remove((tool: Tool) => !!tool.isHidden),
  _.filter(tool => !!tool.isAzureCompatible === !!isAzureWorkspace)
)([tools.Jupyter, tools.RStudio, tools.Galaxy, tools.Cromwell, tools.Azure])

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

export const getToolForImage = (image: string): ToolLabel | undefined => _.find(tool => _.includes(image, tool.imageIds), runtimeTools)?.label
export const getToolFromFileExtension = (fileName: Extension): ToolLabel | undefined => extensionToToolMap[getExtension(fileName)]

// TODO: runtime type
export const getToolFromRuntime = (runtime: any): ToolLabel => _.get(['labels', 'tool'])(runtime)

export const getAppType = (label: ToolLabel): string | undefined => appTools[label]?.appType

// Returns registered appTypes.
export const allAppTypes: AppToolLabel[] = _.flow(_.map('appType'), _.compact)(appTools)

export const isPauseSupported = (toolLabel: ToolLabel): boolean => !_.find((tool: Tool) => tool.label === toolLabel)(tools)?.isPauseUnsupported

