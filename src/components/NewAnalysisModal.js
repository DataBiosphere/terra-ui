import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, h2, h3, hr, img } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer, Select, spinnerOverlay } from 'src/components/common'
import ModalDrawer from 'src/components/ModalDrawer'
import { NewGalaxyModalBase } from 'src/components/NewGalaxyModal'
import { NewRuntimeModalBase } from 'src/components/NewRuntimeModal'
import {
  analysisNameInput,
  analysisNameValidator,
  getDisplayName,
  NotebookCreator, notebookData,
  tools
} from 'src/components/notebook-utils'
import TitleBar from 'src/components/TitleBar'
import galaxyLogo from 'src/images/galaxy-logo.png'
import jupyterLogoLong from 'src/images/jupyter-logo-long.png'
import rstudioLogo from 'src/images/rstudio-logo.svg'
import { Ajax } from 'src/libs/ajax'
import { getUser } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportError, withErrorReporting } from 'src/libs/error'
import * as Utils from 'src/libs/utils'
import { getConvertedRuntimeStatus, getCurrentApp, getCurrentRuntime } from 'src/libs/runtime-utils'
import { FormLabel } from 'src/libs/forms'
import validate from 'validate.js'

//TODO: title id in titleBar and aria-labelled-by in withModalDrawer

const titleId = 'new-analysis-modal-title'

export const NewAnalysisModal = Utils.withDisplayName('NewAnalysisModal')(
  ({ isOpen, onDismiss, onSuccess, runtimes, apps, galaxyDataDisks, refreshRuntimes, refreshApps, refreshAnalyses, analyses, workspace, persistentDisks, workspace: { workspace: { namespace, bucketName, name: workspaceName } } }) => {
    const [viewMode, setViewMode] = useState(undefined)
    const [busy, setBusy] = useState()


    const [notebookKernel, setNotebookKernel] = useState('python3')
    const [nameTouched, setNameTouched] = useState(false)
    const [analysisName, setAnalysisName] = useState('')
    const currentRuntime = getCurrentRuntime(runtimes)
    const currentRuntimeTool = currentRuntime?.labels?.tool
    const currentApp = getCurrentApp(apps)

    const [currentTool, setCurrentTool] = useState(undefined)

    const NEW_ANALYSIS_MODE = 'NEW_ARTIFACT'
    const NEW_ENVIRONMENT_MODE = 'NEW_ENVIRONMENT'

    const resetView = () => {
      setViewMode(undefined)
      setCurrentTool(undefined)
    }

    console.log('viewmode')
    console.log(viewMode)

    const setNextViewMode = () => {
      const doesCloudEnvForToolExist = currentRuntimeTool === currentTool || (currentApp && currentTool === tools.galaxy.label)

      console.log('in setNextViewMode, currentTool')
      console.log(currentTool)
      return Utils.switchCase(viewMode,
        [NEW_ANALYSIS_MODE, () => {
          if (doesCloudEnvForToolExist) {
            resetView()
            onSuccess()
          } else {
            //TODO, if (current runtime exists && isNotDeletable), if before is true dont take them to new env creation because they cannot create one at this time. Should this be handled in the modal itself?
            setViewMode(NEW_ENVIRONMENT_MODE)
          }
        }],
        [NEW_ENVIRONMENT_MODE, () => resetView()],
        [Utils.DEFAULT, () => currentTool === tools.galaxy.label ? setViewMode(NEW_ENVIRONMENT_MODE) : setViewMode(NEW_ANALYSIS_MODE)]
      )
    }

    const setPreviousViewMode = () => Utils.switchCase(viewMode,
      [NEW_ANALYSIS_MODE, () => setViewMode(undefined)],
      [NEW_ENVIRONMENT_MODE, () => setViewMode(undefined)],
      [Utils.DEFAULT, () => undefined]
    )


    const getView = () => Utils.switchCase(viewMode,
      [NEW_ANALYSIS_MODE, renderCreateAnalysis],
      [NEW_ENVIRONMENT_MODE, getNewEnvironmentView],
      [Utils.DEFAULT, renderSelectAnalysisBody])

    const getNewEnvironmentView = () => Utils.switchCase(currentTool,
      [tools.Jupyter.label, renderNewRuntimeModal],
      [tools.RStudio.label, renderNewRuntimeModal],
      [tools.galaxy.label, renderNewGalaxyModal]
    )

    const renderNewRuntimeModal = () => h(NewRuntimeModalBase, {
      isOpen: currentTool === tools.Jupyter.label || currentTool === tools.RStudio.label,
      isAnalysisMode: true,
      workspace,
      tool: currentTool,
      runtimes,
      persistentDisks,
      onDismiss: () => {
        resetView()
        onDismiss()
      },
      onSuccess: _.flow(
        withErrorReporting('Error creating runtime'),
        Utils.withBusyState(setBusy)
      )(async () => {
        setViewMode(undefined)
        onSuccess()
        await refreshRuntimes(true)
      })
    })

    const renderNewGalaxyModal = () => h(NewGalaxyModalBase, {
      isOpen: viewMode === tools.galaxy.label,
      isAnalysisMode: true,
      workspace,
      apps,
      galaxyDataDisks,
      onDismiss: () => {
        setViewMode(undefined)
        onDismiss()
      },
      onSuccess: _.flow(
        withErrorReporting('Error creating app'),
        Utils.withBusyState(setBusy)
      )(async () => {
        setViewMode(undefined)
        onSuccess()
        await refreshApps(true)
      })
    })

    const toolCardStyles = { backgroundColor: 'white', borderRadius: 5, padding: '1rem', display: 'inline-block', verticalAlign: 'middle', marginBottom: '1rem', textAlign: 'center', width: '100%', height: 60 }
    const imageStyles = { verticalAlign: 'middle', height: '100%', width: '40%' }

    const renderToolButtons = () => div({ style: { display: 'flex', alignItems: 'center', flexDirection: 'column', justifyContent: 'space-between' } }, [
      div({ style: toolCardStyles, onClick: async () => { await setCurrentTool(tools.Jupyter.label); await setNextViewMode() } }, [img({ src: jupyterLogoLong, style: _.merge(imageStyles, { width: '30%' }) })]),
      div({ style: toolCardStyles, onClick: async () => { await setCurrentTool(tools.RStudio.label); await setNextViewMode() } }, [img({ src: rstudioLogo, style: imageStyles })]),
      div({ style: toolCardStyles, onClick: async () => { await setCurrentTool(tools.galaxy.label); await setNextViewMode() }, disabled: !currentApp, tooltip: !currentApp ? 'You already have a galaxy app' : '' }, [img({ src: galaxyLogo, style: _.merge(imageStyles, { width: '30%' }) })])
    ])

    const renderSelectAnalysisBody = () => div({ style: { display: 'flex', flexDirection: 'column', flex: 1, padding: '.5rem 1.5rem 1.5rem 1.5rem' } }, [
      renderToolButtons()
    ])

    const getArtifactLabel = toolLabel => Utils.switchCase(toolLabel, [tools.RStudio.label, () => 'R markdown file'],
      [tools.Jupyter.label, () => 'notebook'],
      [Utils.DEFAULT, () => console.error(`Should not be calling getArtifactLabel for ${toolLabel}, arteficts not implemented`)])

    const renderCreateAnalysis = () => div({ style: { display: 'flex', flexDirection: 'column', flex: 1, padding: '.5rem 1.5rem 1.5rem 1.5rem' } }, [
      h2([`Create a new ${getArtifactLabel(currentTool)}`]),
      renderCreateAnalysisBody(currentTool)
    ])

    const existingNames = _.map(({ name }) => getDisplayName(name), analyses)

    const errors = validate(
      { analysisName, notebookKernel },
      {
        analysisName: analysisNameValidator(existingNames),
        notebookKernel: { presence: { allowEmpty: true } }
      }
    )

    const renderCreateAnalysisBody = toolLabel => div({ styles: { display: 'flex', flexDirection: 'column', padding: '1.5rem' } }, [
      // div()
      h(IdContainer, [id => h(Fragment, [
        h(FormLabel, { htmlFor: id, required: true }, [`Name of the ${getArtifactLabel(toolLabel)}`]),
        analysisNameInput({
          error: Utils.summarizeErrors(nameTouched && errors?.analysisName),
          inputProps: {
            id, value: analysisName,
            onChange: v => {
              setAnalysisName(v)
              setNameTouched(true)
            }
          }
        })
      ])]),
      toolLabel === tools.Jupyter.label ? h(IdContainer, [id => h(Fragment, [
        h(FormLabel, { htmlFor: id, required: true }, ['Language']),
        h(Select, {
          id, isSearchable: true,
          placeholder: 'Select a language',
          getOptionLabel: ({ value }) => _.startCase(value),
          value: notebookKernel,
          onChange: ({ value: notebookKernel }) => setNotebookKernel(notebookKernel),
          options: ['python3', 'r']
        })
      ])]) : [],
      div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
        h(ButtonPrimary, {
          disabled: errors,
          tooltip: Utils.summarizeErrors(errors),
          onClick: async () => {
            try {
              const contents = toolLabel === tools.Jupyter.label ? notebookData[notebookKernel] : '# Starter Rmd file'
              await Ajax().Buckets.analysis(namespace, bucketName, analysisName, toolLabel).create(contents)
              refreshAnalyses()
              setNextViewMode()
            } catch (error) {
              await reportError('Error creating analysis', error)
              onDismiss()
            }
          }
        }, 'Create Analysis')
      ])
    ])

    const width = Utils.switchCase(viewMode,
      [NEW_ENVIRONMENT_MODE, () => 675],
      [NEW_ANALYSIS_MODE, () => 450],
      [Utils.DEFAULT, () => 450]
    )

    const modalBody = h(Fragment, [
      h(TitleBar, {
        id: titleId,
        title: 'Select an application',
        titleStyles: _.merge(viewMode === undefined ? {} : { display: 'none' }, { margin: '1.5rem 0 0 1.5rem' }),
        width,
        onDismiss: () => {
          resetView()
          onDismiss()
        },
        onPrevious: () => setPreviousViewMode()
      }),
      viewMode !== undefined && hr({ style: { borderTop: '1px solid', width: '100%', color: colors.accent() } }),
      getView(),
      busy && spinnerOverlay
    ])

    const modalProps = {
      isOpen, width, 'aria-labelledby': titleId,
      onDismiss: () => {
        resetView()
        onDismiss()
      }
    }

    return h(ModalDrawer, { ...modalProps, children: modalBody })
  }
)
