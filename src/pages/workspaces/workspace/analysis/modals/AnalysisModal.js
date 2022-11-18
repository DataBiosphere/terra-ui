import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, h2, hr, img, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, Clickable, IdContainer, Select, WarningTitle } from 'src/components/common'
import Dropzone from 'src/components/Dropzone'
import { icon } from 'src/components/icons'
import ModalDrawer from 'src/components/ModalDrawer'
import TitleBar from 'src/components/TitleBar'
import { getCloudProviderFromWorkspace } from 'src/components/workspace-utils'
import cromwellImg from 'src/images/cromwell-logo.png'
import galaxyLogo from 'src/images/galaxy-logo.svg'
import jupyterLogoLong from 'src/images/jupyter-logo-long.png'
import rstudioBioLogo from 'src/images/r-bio-logo.svg'
import { Ajax } from 'src/libs/ajax'
import { cloudProviderTypes } from 'src/libs/ajax/ajax-common'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import Events from 'src/libs/events'
import { FormLabel } from 'src/libs/forms'
import { usePrevious, withDisplayName } from 'src/libs/react-utils'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { getFileName } from 'src/pages/workspaces/workspace/analysis/file-utils'
import { AzureComputeModalBase } from 'src/pages/workspaces/workspace/analysis/modals/AzureComputeModal'
import { ComputeModalBase } from 'src/pages/workspaces/workspace/analysis/modals/ComputeModal'
import { CromwellModalBase } from 'src/pages/workspaces/workspace/analysis/modals/CromwellModal'
import { GalaxyModalBase } from 'src/pages/workspaces/workspace/analysis/modals/GalaxyModal'
import {
  analysisNameInput, analysisNameValidator, baseRmd, notebookData
} from 'src/pages/workspaces/workspace/analysis/notebook-utils'
import {
  getCurrentApp, getCurrentPersistentDisk, getCurrentRuntime, isResourceDeletable
} from 'src/pages/workspaces/workspace/analysis/runtime-utils'
import { cloudAppTools, cloudRuntimeTools, getAppType, getToolFromFileExtension, getToolFromRuntime, isAppToolLabel, runtimeTools, toolExtensionDisplay, toolLabels, tools } from 'src/pages/workspaces/workspace/analysis/tool-utils'
import validate from 'validate.js'


const titleId = 'analysis-modal-title'
const analysisMode = Symbol('artifact')
const environmentMode = Symbol('environment')

export const AnalysisModal = withDisplayName('AnalysisModal')(
  ({
    isOpen, onDismiss, onError, onSuccess, uploadFiles, openUploader, runtimes, apps, appDataDisks, refreshAnalyses,
    analyses, workspace, persistentDisks, location, workspace: { workspace: { workspaceId, googleProject, bucketName } }
  }) => {
    const [viewMode, setViewMode] = useState(undefined)
    const cloudProvider = getCloudProviderFromWorkspace(workspace)
    const [notebookKernel, setNotebookKernel] = useState('python3')
    const [analysisName, setAnalysisName] = useState('')
    const prevAnalysisName = usePrevious(analysisName)
    const [currentToolObj, setCurrentToolObj] = useState(undefined)
    const [fileExt, setFileExt] = useState('')
    const currentTool = currentToolObj?.label

    const currentRuntime = getCurrentRuntime(runtimes)
    const currentDisk = getCurrentPersistentDisk(runtimes, persistentDisks)
    const currentRuntimeTool = getToolFromRuntime(currentRuntime)
    const currentApp = toolLabel => getCurrentApp(getAppType(toolLabel))(apps)

    const resetView = () => {
      setViewMode(undefined)
      setAnalysisName('')
      setCurrentToolObj(undefined)
      setNotebookKernel('python3')
    }

    /**
     * The intended flow is to call this without a viewMode, and have it intelligently figure out the next
     * step for you. Passing a viewMode is a way to force your next modal.
     */
    const enterNextViewMode = (currentTool, baseViewMode = viewMode) => {
      const app = currentApp(currentTool)
      const doesCloudEnvForToolExist = !!(currentRuntimeTool === currentTool || app)

      Utils.switchCase(baseViewMode,
        [analysisMode, () => Utils.cond(
          [doesCloudEnvForToolExist, onSuccess],
          [!doesCloudEnvForToolExist && !!currentRuntime && isResourceDeletable('runtime', currentRuntime), () => setViewMode(environmentMode)],
          [!doesCloudEnvForToolExist && !currentRuntime, () => setViewMode(environmentMode)],
          [!doesCloudEnvForToolExist && !!currentRuntime && !isResourceDeletable('runtime', currentRuntime), onSuccess]
        )],
        [environmentMode, onSuccess],
        [Utils.DEFAULT, () => Utils.cond(
          [currentTool === toolLabels.RStudio || currentTool === toolLabels.Jupyter || currentTool === toolLabels.JupyterLab, () => setViewMode(analysisMode)],
          [isAppToolLabel(currentTool) && !app, () => setViewMode(environmentMode)],
          [isAppToolLabel(currentTool) && !!app, () => {
            console.error(
              `This shouldn't be possible, as you aren't allowed to create a ${_.capitalize(
                app.appType)} instance when one exists; the button should be disabled.`)
            resetView()
          }]
        )]
      )
    }

    const getView = () => Utils.switchCase(viewMode,
      [analysisMode, renderCreateAnalysis],
      [environmentMode, getEnvironmentView],
      [Utils.DEFAULT, renderSelectAnalysisBody])

    const getEnvironmentView = () => Utils.switchCase(cloudProvider,
      [cloudProviderTypes.GCP, getGCPEnvironmentView],
      [cloudProviderTypes.AZURE, getAzureEnvironmentView]
    )

    const getGCPEnvironmentView = () => Utils.switchCase(currentTool,
      [toolLabels.Jupyter, renderComputeModal],
      [toolLabels.RStudio, renderComputeModal],
      [toolLabels.Galaxy, () => renderAppModal(GalaxyModalBase, toolLabels.Galaxy)],
      [toolLabels.Cromwell, () => renderAppModal(CromwellModalBase, toolLabels.Cromwell)],
      [toolLabels.JupyterLab, renderAzureModal]
    )

    const getAzureEnvironmentView = () => Utils.switchCase(currentTool,
      [toolLabels.JupyterLab, renderAzureModal]
    )

    const renderComputeModal = () => h(ComputeModalBase, {
      isOpen: currentTool === toolLabels.Jupyter || currentTool === toolLabels.RStudio,
      location,
      workspace,
      tool: currentTool,
      currentRuntime,
      currentDisk,
      onDismiss,
      onError,
      onSuccess
    })

    const renderAzureModal = () => h(AzureComputeModalBase, {
      isOpen: currentTool === toolLabels.JupyterLab,
      workspace,
      runtimes,
      onDismiss,
      onSuccess
    })

    const renderAppModal = (appModalBase, toolLabel) => h(appModalBase, {
      isOpen: viewMode === toolLabel,
      workspace,
      apps,
      appDataDisks,
      onDismiss,
      onError,
      onSuccess
    })

    const styles = {
      toolCard: {
        backgroundColor: 'white', borderRadius: 5, padding: '1rem', display: 'inline-block', verticalAlign: 'middle', marginBottom: '1rem',
        textAlign: 'center', width: '100%', height: 60
      },
      image: { verticalAlign: 'middle', height: 30, width: '40%' },
      hover: { backgroundColor: colors.accent(0.3) }
    }

    // TODO: Try to move app/tool-specific info into tools (in notebook-utils.js) so the function below can just iterate over tools instead of duplicating logic
    const availableRuntimeTools = cloudRuntimeTools[cloudProvider]
    const availableAppTools = cloudAppTools[cloudProvider]

    const currentApps = {
      Galaxy: currentApp(toolLabels.Galaxy),
      Cromwell: currentApp(toolLabels.Cromwell)
    }

    const appDisabledMessages = {
      Galaxy: 'You already have a galaxy environment',
      Cromwell: 'You already have a Cromwell instance'
    }

    const toolImages = {
      Jupyter: img({ src: jupyterLogoLong, alt: 'Create new notebook', style: _.merge(styles.image, { width: 111 }) }),
      RStudio: img({ src: rstudioBioLogo, alt: 'Create new R file', style: _.merge(styles.image, { width: 207 }) }),
      JupyterLab: img({ src: jupyterLogoLong, alt: 'Create new notebook', style: _.merge(styles.image, { width: 111 }) }),
      Galaxy: img({ src: galaxyLogo, alt: 'Create new Galaxy app', style: _.merge(styles.image, { width: 139 }) }),
      Cromwell: img({ src: cromwellImg, alt: 'Create new Cromwell app', style: styles.image })
    }

    const runtimeToolButtons = _.values(availableRuntimeTools).map((runtimeTool => {
      return !runtimeTool.isHidden ? h(Clickable, {
        style: styles.toolCard, onClick: () => {
          setCurrentToolObj(runtimeTool)
          setFileExt(runtimeTool.defaultExt)
          enterNextViewMode(runtimeTool.label)
        },
        hover: styles.hover
      }, [toolImages[runtimeTool.label]]) : ''
    }))

    const appToolButtons = _.values(availableAppTools).map((appTool => {
      const currentApp = currentApps[appTool.label]
      return !appTool.isHidden ? h(Clickable, {
        style: { opacity: currentApp ? '0.5' : '1', ...styles.toolCard }, onClick: () => {
          setCurrentToolObj(appTool)
          enterNextViewMode(appTool.label)
        },
        hover: !currentApp ? styles.hover : undefined,
        disabled: !!currentApp, tooltip: currentApp ? appDisabledMessages[appTool.label] : ''
      }, [toolImages[appTool.label]]) : ''
    }))

    const renderToolButtons = () => div({
      style: { display: 'flex', alignItems: 'center', flexDirection: 'column', justifyContent: 'space-between' }
    }, [runtimeToolButtons, appToolButtons])

    const renderSelectAnalysisBody = () => div({
      style: { display: 'flex', flexDirection: 'column', flex: 1, padding: '1.5rem' }
    }, [
      renderToolButtons(),
      h(Dropzone, {
        accept: `.${tools.Jupyter.ext.join(', .')}, .${tools.RStudio.ext.join(', .')}`,
        style: { flexGrow: 1, backgroundColor: colors.light(), height: '100%' },
        activeStyle: { backgroundColor: colors.accent(0.2), cursor: 'copy' },
        onDropRejected: () => reportError('Not a valid analysis file',
          `The selected file is not one of the supported types: .${tools.Jupyter.ext.join(', .')}, .${tools.RStudio.ext.join(', .')}. Ensure your file has the proper extension.`),
        onDropAccepted: files => {
          const tool = !!googleProject ? tools[getToolFromFileExtension(files.pop().path)] : runtimeTools.JupyterLab
          setCurrentToolObj(tool)
          currentRuntime && !isResourceDeletable('runtime', currentRuntime) && currentRuntimeTool !== tool ?
            onSuccess() :
            enterNextViewMode(tool, analysisMode)
          uploadFiles()
        }
      }, [() => h(Clickable, {
        onClick: () => {
          onSuccess()
          openUploader()
        }, style: {
          marginTop: '1rem', fontSize: 16, lineHeight: '20px', ...Style.elements.card.container, alignItems: 'center', width: '100%', height: 150,
          backgroundColor: colors.dark(0.1), border: `1px dashed ${colors.dark(0.7)}`, boxShadow: 'none'
        }
      }, [
        div(['Or Click / Drag to upload an analysis file']),
        icon('upload-cloud', { size: 25, style: { opacity: 0.4, marginTop: '0.5rem' } })
      ])])
    ])

    const getArtifactLabel = toolLabel => Utils.switchCase(toolLabel,
      [toolLabels.RStudio, () => 'R file'],
      [toolLabels.Jupyter, () => 'notebook'],
      [toolLabels.JupyterLab, () => 'notebook'],
      [Utils.DEFAULT, () => console.error(`Should not be calling getArtifactLabel for ${toolLabel}, artifacts not implemented`)])

    const renderCreateAnalysis = () => div({ style: { display: 'flex', flexDirection: 'column', flex: 1, padding: '0.5rem 1.5rem 1.5rem 1.5rem' } }, [
      h2({ style: { fontWeight: 600, marginBottom: 0 } }, [`Create a new ${getArtifactLabel(currentTool)}`]),
      renderCreateAnalysisBody(currentTool)
    ])

    const renderCreateAnalysisBody = toolLabel => {
      const isJupyter = toolLabel === toolLabels.Jupyter
      const isRStudio = toolLabel === toolLabels.RStudio
      const isJupyterLab = toolLabel === toolLabels.JupyterLab

      const errors = validate(
        { analysisName: `${analysisName}.${fileExt}`, notebookKernel },
        {
          analysisName: analysisNameValidator(_.map(({ name }) => getFileName(name), analyses)),
          notebookKernel: { presence: { allowEmpty: true } }
        }
      )

      return div({ style: { display: 'flex', flexDirection: 'column' } }, [
        h(IdContainer, [id => h(Fragment, [
          h(FormLabel, { htmlFor: id, required: true }, [`Name of the ${getArtifactLabel(toolLabel)}`]),
          analysisNameInput({
            error: Utils.summarizeErrors(prevAnalysisName !== analysisName && errors?.analysisName),
            inputProps: {
              id, value: analysisName,
              onChange: v => {
                setAnalysisName(v)
              }
            }
          })
        ])]),
        Utils.cond(
          [currentToolObj?.isNotebook, () => h(IdContainer,
            [id => h(Fragment, [
              h(FormLabel, { htmlFor: id, required: true }, ['Language']),
              h(Select, {
                id, isSearchable: true,
                placeholder: 'Select a language',
                getOptionLabel: ({ value }) => _.startCase(value),
                value: notebookKernel,
                onChange: ({ value: notebookKernel }) => setNotebookKernel(notebookKernel),
                options: ['python3', 'r']
              })
            ])]
          )],
          [isRStudio, () => h(IdContainer, [id => h(Fragment, [
            h(FormLabel, { htmlFor: id, required: true }, ['File Type']),
            h(Select, {
              id, isSearchable: true,
              value: fileExt,
              onChange: v => {
                setFileExt(v.value)
              },
              options: toolExtensionDisplay.RStudio
            })
          ])])]
        ),
        (isJupyterLab || isRStudio || isJupyter) &&
        currentRuntime && !isResourceDeletable('runtime', currentRuntime) && currentRuntimeTool !== toolLabel &&
        div({ style: { backgroundColor: colors.warning(0.1), margin: '0.5rem', padding: '1rem' } }, [
          h(WarningTitle, { iconSize: 16 }, [span({ style: { fontWeight: 600 } }, ['Environment Creation'])]),
          div({ style: { marginBottom: '0.5rem', marginTop: '1rem' } }, [
            'You have a non-deletable environment associated with another application.'
          ]),
          div([
            'You may create an analysis, but must wait for your current environment to finish processing and get a suitable environment to run it.'
          ])
        ]),
        div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
          h(ButtonPrimary, {
            disabled: errors,
            tooltip: Utils.summarizeErrors(errors),
            onClick: async () => {
              try {
                const contents = Utils.cond(
                  [currentToolObj?.isNotebook, () => JSON.stringify(notebookData[notebookKernel])],
                  [isRStudio, () => baseRmd])
                const fullAnalysisName = `${analysisName}.${fileExt}`
                !!googleProject ?
                  await Ajax().Buckets.analysis(googleProject, bucketName, fullAnalysisName, toolLabel).create(contents) :
                  await Ajax().AzureStorage.blob(workspaceId, fullAnalysisName).create(contents)
                await refreshAnalyses()
                await Ajax().Metrics.captureEvent(Events.analysisCreate, { source: toolLabel, application: toolLabel, filename: fullAnalysisName })
                setAnalysisName('')
                enterNextViewMode(toolLabel)
              } catch (error) {
                await reportError('Error creating analysis', error)
                onError()
              }
            }
          }, 'Create Analysis')
        ])
      ])
    }

    const width = Utils.switchCase(viewMode,
      [environmentMode, () => 675],
      [analysisMode, () => 450],
      [Utils.DEFAULT, () => 450]
    )

    const modalBody = h(Fragment, [
      h(TitleBar, {
        id: titleId,
        title: 'Select an application',
        titleStyles: { margin: '1.5rem 0 0 1.5rem', display: !!viewMode ? 'none' : undefined },
        width,
        onDismiss,
        onPrevious: !!viewMode ? () => resetView() : undefined
      }),
      viewMode !== undefined && hr({ style: { borderTop: '1px solid', width: '100%', color: colors.accent() } }),
      getView()
    ])

    const modalProps = {
      isOpen, width, 'aria-labelledby': titleId,
      onDismiss,
      onExited: resetView
    }

    return h(ModalDrawer, { ...modalProps, children: modalBody })
  }
)
