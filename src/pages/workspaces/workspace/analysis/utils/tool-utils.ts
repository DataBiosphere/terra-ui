import _ from 'lodash/fp'
import { code } from 'react-hyperscript-helpers'
import { Runtime } from 'src/libs/ajax/leonardo/models/runtime-models'
import { isCromwellAppVisible, isCromwellOnAzureAppVisible } from 'src/libs/config'
import * as Utils from 'src/libs/utils'
import { CloudProvider } from 'src/libs/workspace-utils'
import { FileExtension, getExtension } from 'src/pages/workspaces/workspace/analysis/utils/file-utils'


export type RuntimeToolLabel = 'Jupyter' | 'RStudio' | 'JupyterLab'
export type AppToolLabel = 'Galaxy' | 'Cromwell' | 'CromwellOnAzure'
export type MiscToolLabel = 'spark' | 'terminal'
export type ToolLabel = RuntimeToolLabel | AppToolLabel | MiscToolLabel

export const toolLabels: Record<ToolLabel, ToolLabel> = {
  Jupyter: 'Jupyter',
  RStudio: 'RStudio',
  terminal: 'terminal',
  spark: 'spark',
  JupyterLab: 'JupyterLab',
  Galaxy: 'Galaxy',
  Cromwell: 'Cromwell',
  CromwellOnAzure: 'CromwellOnAzure'
}

export const toolLabelDisplays: Record<ToolLabel, string> = {
  Jupyter: 'Jupyter',
  RStudio: 'RStudio',
  terminal: 'terminal',
  spark: 'spark',
  JupyterLab: 'JupyterLab',
  Galaxy: 'Galaxy',
  Cromwell: 'Cromwell',
  CromwellOnAzure: 'Workflows on Cromwell'
}

export const appToolLabelTypes: Record<AppToolLabel, AppToolLabel> = {
  Galaxy: 'Galaxy',
  Cromwell: 'Cromwell',
  CromwellOnAzure: 'CromwellOnAzure'
}

export const isAppToolLabel = (x: ToolLabel): x is AppToolLabel => x in appToolLabelTypes

export interface Tool {
  label: ToolLabel
  isHidden?: boolean
  isLaunchUnsupported?: boolean
  isPauseUnsupported?: boolean
  isSettingsUnsupported?: boolean
}

export interface RuntimeTool extends Tool {
  ext: FileExtension[]
  imageIds: string[]
  defaultImageId: string
  defaultExt: FileExtension
}

export interface AppTool extends Tool {
  appType: string
}

export const terraSupportedRuntimeImageIds: string[] = [
  'terra-jupyter-bioconductor', 'terra-jupyter-hail', 'terra-jupyter-python', 'terra-jupyter-gatk', 'RStudio'
]

const RStudio: RuntimeTool = { label: toolLabels.RStudio, ext: ['Rmd', 'R'] as FileExtension[], imageIds: ['RStudio'], defaultImageId: 'RStudio', defaultExt: 'Rmd' as FileExtension }

const Jupyter: RuntimeTool = {
  label: toolLabels.Jupyter,
  ext: ['ipynb' as FileExtension],
  imageIds: ['terra-jupyter-bioconductor', 'terra-jupyter-bioconductor_legacy', 'terra-jupyter-hail', 'terra-jupyter-python', 'terra-jupyter-gatk', 'Pegasus', 'terra-jupyter-gatk_legacy'],
  defaultImageId: 'terra-jupyter-gatk',
  isLaunchUnsupported: true,
  defaultExt: 'ipynb' as FileExtension
}

const JupyterLab: RuntimeTool = {
  label: toolLabels.JupyterLab,
  ext: ['ipynb' as FileExtension],
  isLaunchUnsupported: false,
  defaultExt: 'ipynb' as FileExtension,
  imageIds: [],
  defaultImageId: '',
}

const Galaxy: AppTool = { label: toolLabels.Galaxy, appType: 'GALAXY' }

const Cromwell: AppTool = { label: toolLabels.Cromwell, appType: 'CROMWELL', isHidden: !isCromwellAppVisible(), isPauseUnsupported: true }
const CromwellOnAzure: AppTool = { label: toolLabels.CromwellOnAzure, appType: 'CROMWELL', isHidden: !isCromwellOnAzureAppVisible(), isPauseUnsupported: true, isSettingsUnsupported: true }

export const appTools: Record<AppToolLabel, AppTool> = {
  Galaxy,
  Cromwell,
  // this can be combined with Cromwell app in the future(?). But for the first iteration it is simpler to have it separate
  // so that its easy to display Cromwell card in Modal with disabled Settings button.
  CromwellOnAzure
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
    CromwellOnAzure
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
  [toolLabels.RStudio, () => '.+(\\.R|\\.Rmd)$'],
  [toolLabels.Jupyter, () => '.*\\.ipynb'],
  [toolLabels.JupyterLab, () => '.*\\.ipynb']
)

export const getToolsToDisplayForCloudProvider = (cloudProvider: CloudProvider): Tool[] => _.remove((tool: Tool) => !!tool.isHidden)(
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

export const getAppType = (label: ToolLabel): string | undefined => appTools[label]?.appType

// Returns registered appTypes.
export const allAppTypes: AppToolLabel[] = _.flow(_.map('appType'), _.compact)(appTools)

export const isPauseSupported = (toolLabel: ToolLabel): boolean => !_.find((tool: Tool) => tool.label === toolLabel)(tools)?.isPauseUnsupported

export const isSettingsSupported = (toolLabel: ToolLabel): boolean => !_.find((tool: Tool) => tool.label === toolLabel)(tools)?.isSettingsUnsupported

export const getCurrentMountDirectory = (toolLabel: ToolLabel) => {
  const boldCode = function(label: ToolLabel) {
    const mydir = label.toLowerCase()
    return code({ style: { fontWeight: 600 } }, [`/home/${mydir}`])
  }
  const defaultMsg = [boldCode(toolLabels.Jupyter), ' for Jupyter environments and ', boldCode(toolLabels.RStudio), ' for RStudio environments']
  return typeof toolLabel === 'string' ? [boldCode(toolLabel)] : defaultMsg // TODO: remove string check IA-4091
}

export type AppDataDisk = any

export type PersistentDisk = any
