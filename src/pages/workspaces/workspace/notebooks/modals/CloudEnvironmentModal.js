import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, hr, img, span } from 'react-hyperscript-helpers'
import { Clickable, spinnerOverlay } from 'src/components/common'
import { ComputeModalBase } from 'src/components/ComputeModal'
import { CromwellModalBase } from 'src/components/CromwellModal'
import { GalaxyModalBase } from 'src/components/GalaxyModal'
import { icon } from 'src/components/icons'
import ModalDrawer from 'src/components/ModalDrawer'
import { isToolAnApp, tools, toolToAppTypeMap } from 'src/components/notebook-utils'
import { getRegionInfo } from 'src/components/region-common'
import { appLauncherTabName } from 'src/components/runtime-common'
import { AppErrorModal, RuntimeErrorModal } from 'src/components/RuntimeManager'
import TitleBar from 'src/components/TitleBar'
import cloudIcon from 'src/icons/cloud-compute.svg'
import galaxyLogo from 'src/images/galaxy-logo.png'
import cromwellImg from 'src/images/jamie_the_cromwell_pig.png' // To be replaced by something better
import jupyterLogo from 'src/images/jupyter-logo-long.png'
import rstudioLogo from 'src/images/rstudio-logo.svg'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import Events from 'src/libs/events'
import * as Nav from 'src/libs/nav'
import {
  getComputeStatusForDisplay,
  getConvertedRuntimeStatus,
  getCurrentAppForType,
  getCurrentRuntime,
  getGalaxyCostTextChildren,
  getIsAppBusy,
  getIsRuntimeBusy,
  getPersistentDiskCostHourly,
  isCurrentGalaxyDiskDetaching,
  runtimeCost
} from 'src/libs/runtime-utils'
import { cookieReadyStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


const titleId = 'cloud-env-modal'

export const CloudEnvironmentModal = ({
  isOpen, onDismiss, canCompute, runtimes, apps, appDataDisks, refreshRuntimes, refreshApps,
  workspace, persistentDisks, location, locationType, workspace: { workspace: { namespace, name: workspaceName } }
}) => {
  const [viewMode, setViewMode] = useState(undefined)
  const [busy, setBusy] = useState(false)
  const [errorRuntimeId, setErrorRuntimeId] = useState(undefined)
  const [errorAppId, setErrorAppId] = useState(undefined)
  const cookieReady = Utils.useStore(cookieReadyStore)

  const [computeRegion] = useState(getRegionInfo(location, locationType).computeRegion)

  const noCompute = 'You do not have access to run analyses on this workspace.'

  const renderComputeModal = tool => h(ComputeModalBase, {
    isOpen: viewMode === NEW_JUPYTER_MODE || viewMode === NEW_RSTUDIO_MODE,
    isAnalysisMode: true,
    workspace,
    tool,
    runtimes,
    persistentDisks,
    location,
    onDismiss: () => {
      setViewMode(undefined)
      onDismiss()
    },
    onSuccess: () => {
      setViewMode(undefined)
      onDismiss()
    }
  })

  const renderAppModal = (AppModalBase, appMode) => h(AppModalBase, {
    isOpen: viewMode === appMode,
    isAnalysisMode: true,
    workspace,
    apps,
    appDataDisks,
    onDismiss: () => {
      setViewMode(undefined)
      onDismiss()
    },
    onSuccess: () => {
      setViewMode(undefined)
      onDismiss()
    }
  })
  const renderGalaxyModal = () => renderAppModal(GalaxyModalBase, NEW_GALAXY_MODE)
  const renderCromwellModal = () => renderAppModal(CromwellModalBase, NEW_CROMWELL_MODE)

  const renderDefaultPage = () => div({ style: { display: 'flex', flexDirection: 'column', flex: 1 } }, [
    renderToolButtons(tools.Jupyter.label),
    renderToolButtons(tools.RStudio.label),
    renderToolButtons(tools.galaxy.label),
    renderToolButtons(tools.cromwell.label)
  ])

  const toolPanelStyles = {
    backgroundColor: 'white',
    margin: '0 1.5rem 1rem 1.5rem',
    padding: '0 1rem 1rem 1rem',
    display: 'flex',
    flexDirection: 'column'
  }
  const toolLabelStyles = {
    margin: '1rem 0 0.5rem 0',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  }
  const toolButtonDivStyles = { display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly' }
  const toolButtonStyles = {
    flex: '1 1 0%',
    maxWidth: 105,
    display: 'flex',
    flexDirection: 'column',
    border: '.5px solid grey',
    borderRadius: 16,
    padding: '.5rem .75rem',
    alignItems: 'center',
    fontWeight: 550,
    fontSize: 11,
    color: colors.accent()
  }

  const currentRuntime = getCurrentRuntime(runtimes)
  const currentRuntimeStatus = getConvertedRuntimeStatus(currentRuntime)
  const currentRuntimeTool = currentRuntime?.labels?.tool

  const currentApp = toolLabel => getCurrentAppForType(toolToAppTypeMap[toolLabel])(apps)

  const RuntimeIcon = ({ shape, onClick, disabled, messageChildren, toolLabel, style, ...props }) => {
    return h(Clickable, {
      'aria-label': `${toolLabel} Status`,
      hover: { backgroundColor: colors.accent(0.2) },
      // css takes the last thing if there are duplicate fields, the order here is important because all three things can specify color
      style: { ...toolButtonStyles, color: onClick && !disabled ? colors.accent() : colors.dark(0.7), ...style },
      onClick, disabled, ...props
    }, [
      icon(shape, { size: 20 }),
      ...messageChildren
    ])
  }

  const executeAndRefresh = async (toolLabel, promise) => {
    try {
      setBusy(true)
      await promise
      await isToolAnApp(toolLabel) ? refreshApps() : refreshRuntimes()
    } catch (error) {
      reportError('Cloud Environment Error', error)
    } finally {
      setBusy(false)
    }
  }

  // We assume here that button disabling is working properly, so the only thing to check is whether it's an app or the current (assumed to be existing) runtime
  const startApp = toolLabel => Utils.cond([isToolAnApp(toolLabel), () => {
    const { googleProject, appName } = currentApp(toolLabel)
    executeAndRefresh(toolLabel,
      Ajax().Apps.app(googleProject, appName).resume())
  }], [Utils.DEFAULT, () => {
    const { googleProject, runtimeName } = currentRuntime
    executeAndRefresh(toolLabel,
      Ajax().Runtimes.runtime(googleProject, runtimeName).start())
  }])

  const stopApp = toolLabel => Utils.cond([isToolAnApp(toolLabel), () => {
    const { googleProject, appName } = currentApp(toolLabel)
    executeAndRefresh(toolLabel, Ajax().Apps.app(googleProject, appName).pause())
  }], [Utils.DEFAULT, () => {
    const { googleProject, runtimeName } = currentRuntime
    executeAndRefresh(toolLabel, Ajax().Runtimes.runtime(googleProject, runtimeName).stop())
  }])

  const defaultIcon = toolLabel => h(RuntimeIcon, {
    shape: 'pause',
    toolLabel,
    disabled: true,
    messageChildren: [span('Pause'),
      span('Environment')],
    tooltip: 'No Environment found'
  })

  const renderStatusClickable = toolLabel => Utils.cond(
    [toolLabel === currentRuntimeTool, () => getIconFromStatus(toolLabel, currentRuntimeStatus)],
    [isToolAnApp(toolLabel), () => {
      const normalizedAppStatus = _.capitalize(currentApp(toolLabel)?.status)
      return getIconFromStatus(toolLabel, normalizedAppStatus)
    }],
    [Utils.DEFAULT, () => defaultIcon(toolLabel)]
  )

  const getIconFromStatus = (toolLabel, status) => {
    // We dont use Utils.switchCase here to support the 'fallthrough' functionality
    switch (status) {
      case 'Stopped':
        return h(RuntimeIcon, {
          shape: 'play',
          toolLabel,
          onClick: () => startApp(toolLabel),
          disabled: busy || !canCompute,
          messageChildren: [span('Resume'),
            span('Environment')],
          tooltip: canCompute ? 'Resume Environment' : noCompute
        })
      case 'Running':
        return h(RuntimeIcon, {
          shape: 'pause',
          toolLabel,
          onClick: () => stopApp(toolLabel),
          disabled: busy || !canCompute,
          messageChildren: [span('Pause'),
            span('Environment')],
          tooltip: canCompute ? 'Pause Environment' : noCompute
        })
      case 'Starting':
      case 'Stopping':
      case 'Updating':
      case 'Creating':
      case 'Prestopping':
      case 'Prestarting':
      case 'Precreating':
      case 'Provisioning':
      case 'LeoReconfiguring':
        return h(RuntimeIcon, {
          shape: 'sync',
          toolLabel,
          disabled: true,
          tooltip: 'Environment update in progress',
          messageChildren: [span('Environment'), span(getComputeStatusForDisplay(status))]
        })
      case 'Error':
        return h(RuntimeIcon, {
          shape: 'warning-standard',
          toolLabel,
          style: { color: colors.danger(0.9) },
          onClick: () => {
            Utils.cond(
              [isToolAnApp(toolLabel), () => setErrorAppId(currentApp(toolLabel)?.appName)],
              [Utils.DEFAULT, () => setErrorRuntimeId(currentRuntime?.id)]
            )
          },
          disabled: busy || !canCompute,
          messageChildren: [span('View'),
            span('Error')],
          tooltip: canCompute ? 'View error' : noCompute
        })
      default:
        return defaultIcon(toolLabel)
    }
  }

  // TODO: multiple runtime: build component around this logic for a multiple runtime approach. see getCostForTool for example usage
  const getRuntimeForTool = toolLabel => Utils.cond([toolLabel === currentRuntimeTool, () => currentRuntime],
    [Utils.DEFAULT, () => undefined])

  const getToolIcon = toolLabel => Utils.switchCase(toolLabel,
    [tools.Jupyter.label, () => jupyterLogo],
    [tools.galaxy.label, () => galaxyLogo],
    [tools.RStudio.label, () => rstudioLogo],
    [tools.cromwell.label, () => cromwellImg])

  // TODO: multiple runtime: this is a good example of how the code should look when multiple runtimes are allowed, over a tool-centric approach
  const getCostForTool = toolLabel => Utils.cond(
    [toolLabel === tools.galaxy.label, () => getGalaxyCostTextChildren(currentApp(toolLabel), appDataDisks)],
    [toolLabel === tools.cromwell.label, () => ''], // We will determine what to put here later
    [getRuntimeForTool(toolLabel), () => {
      const runtime = getRuntimeForTool(toolLabel)
      const totalCost = runtimeCost(runtime) + _.sum(_.map(disk => getPersistentDiskCostHourly(disk, computeRegion), persistentDisks))
      return span([`${getComputeStatusForDisplay(runtime.status)} (${Utils.formatUSD(totalCost)} / hr)`])
    }],
    [Utils.DEFAULT, () => span(['None'])]
  )

  const isCloudEnvModalDisabled = toolLabel => Utils.cond(
    [toolLabel === tools.galaxy.label, () => !canCompute || busy || isCurrentGalaxyDiskDetaching(apps) || getIsAppBusy(currentApp(toolLabel))],
    [Utils.DEFAULT, () => {
      const runtime = getRuntimeForTool(toolLabel)
      return runtime ?
        !canCompute || busy || getIsRuntimeBusy(runtime) :
        !canCompute || busy || getIsRuntimeBusy(currentRuntime) //TODO: multiple runtimes: change this to not have the last check in the or
    }]
  )

  const getToolLaunchClickableProps = toolLabel => {
    const app = currentApp(toolLabel)
    const doesCloudEnvForToolExist = currentRuntimeTool === toolLabel || app
    // TODO what does cookieReady do? Found it in the galaxy app launch code, is it needed here?
    const isToolBusy = isToolAnApp(toolLabel) ?
      getIsAppBusy(app) || app?.status === 'STOPPED' || app?.status === 'ERROR' :
      currentRuntime?.status === 'Error'
    const isDisabled = !doesCloudEnvForToolExist || !cookieReady || !canCompute || busy || isToolBusy || toolLabel === tools.Jupyter.label
    const baseProps = {
      'aria-label': `Launch ${toolLabel}`,
      disabled: isDisabled,
      style: {
        ...toolButtonStyles,
        color: isDisabled ? colors.dark(0.7) : colors.accent()
      },
      hover: { backgroundColor: colors.accent(0.2) },
      tooltip: Utils.cond(
        [doesCloudEnvForToolExist && !isDisabled, () => 'Launch'],
        [doesCloudEnvForToolExist && isDisabled && toolLabel !== tools.Jupyter.label, () => `Please wait until ${toolLabel} is running`],
        [doesCloudEnvForToolExist && isDisabled && toolLabel === tools.Jupyter.label,
          () => 'Select or create a notebook in the analyses tab to launch Jupyter'],
        [Utils.DEFAULT, () => 'No Environment found']
      )
    }
    return Utils.switchCase(toolLabel,
      [tools.galaxy.label, () => {
        return {
          ...baseProps,
          href: app?.proxyUrls?.galaxy,
          onClick: () => {
            onDismiss()
            Ajax().Metrics.captureEvent(Events.applicationLaunch, { app: 'Galaxy' })
          },
          ...Utils.newTabLinkPropsWithReferrer
        }
      }],
      [tools.cromwell.label, () => {
        return {
          ...baseProps,
          href: app?.proxyUrls['cromwell-service'],
          onClick: () => {
            onDismiss()
            Ajax().Metrics.captureEvent(Events.applicationLaunch, { app: tools.cromwell.appType })
          },
          ...Utils.newTabLinkPropsWithReferrer
        }
      }],
      [Utils.DEFAULT, () => {
        // TODO: Jupyter link isn't currently valid, and button will always be disabled for Jupyter because launching directly into tree view is problematic in terms of welder/nbextensions. We are investigating alternatives in https://broadworkbench.atlassian.net/browse/IA-2873
        const applicationLaunchLink = Nav.getLink(appLauncherTabName, { namespace, name: workspaceName, application: toolLabel })
        return {
          ...baseProps,
          href: applicationLaunchLink,
          onClick: () => {
            ((toolLabel === tools.Jupyter.label || toolLabel === tools.RStudio.label) && currentRuntime?.status === 'Stopped' ?
              () => startApp(toolLabel) :
              () => {})()
            onDismiss()
          }
        }
      }]
    )
  }

  const renderToolButtons = toolLabel => {
    const app = currentApp(toolLabel)
    const doesCloudEnvForToolExist = currentRuntimeTool === toolLabel || app
    const isCloudEnvForToolDisabled = isCloudEnvModalDisabled(toolLabel)
    return h(Fragment, [
      div({ style: toolPanelStyles }, [
        // Label at the top for each tool
        div({ style: toolLabelStyles }, [
          img({
            src: getToolIcon(toolLabel),
            style: { height: 20 }
          }),
          getCostForTool(toolLabel)
        ]),
        // Cloud environment button
        div({ style: toolButtonDivStyles }, [
          h(Clickable, {
            'aria-label': `${toolLabel} Env`,
            style: {
              ...toolButtonStyles,
              color: !isCloudEnvForToolDisabled ? colors.accent() : colors.dark(0.7)
            },
            hover: { backgroundColor: colors.accent(0.2) },
            tooltip: Utils.cond([isCloudEnvForToolDisabled, () => 'Edit disabled, processing'],
              [doesCloudEnvForToolExist, () => 'Edit existing Environment'],
              [!doesCloudEnvForToolExist, () => 'Create new Environment (may overwrite existing)']),
            disabled: isCloudEnvForToolDisabled,
            onClick: () => setViewMode(toolLabel)
          }, [
            img({ src: cloudIcon, style: { height: 20, width: 20, opacity: isCloudEnvForToolDisabled ? 0.4 : 1 } }),
            span('Cloud'),
            span('Environment')
          ]),
          // Status button with stop/start functionality
          renderStatusClickable(toolLabel),
          // Launch
          h(Clickable, { ...getToolLaunchClickableProps(toolLabel) }, [
            icon('rocket', { size: 20 }),
            span('Launch'),
            span(_.capitalize(toolLabel))
          ])
        ])
      ])
    ])
  }

  const NEW_JUPYTER_MODE = tools.Jupyter.label
  const NEW_RSTUDIO_MODE = tools.RStudio.label
  const NEW_GALAXY_MODE = tools.galaxy.label
  const NEW_CROMWELL_MODE = tools.cromwell.label

  const getView = () => Utils.switchCase(viewMode,
    [NEW_JUPYTER_MODE, () => renderComputeModal(NEW_JUPYTER_MODE)],
    [NEW_RSTUDIO_MODE, () => renderComputeModal(NEW_RSTUDIO_MODE)],
    [NEW_GALAXY_MODE, renderGalaxyModal],
    [NEW_CROMWELL_MODE, renderCromwellModal],
    [Utils.DEFAULT, renderDefaultPage]
  )

  const width = Utils.switchCase(viewMode,
    [NEW_JUPYTER_MODE, () => 675],
    [NEW_RSTUDIO_MODE, () => 675],
    [NEW_GALAXY_MODE, () => 675],
    [NEW_CROMWELL_MODE, () => 675],
    [Utils.DEFAULT, () => 430]
  )

  const modalBody = h(Fragment, [
    h(TitleBar, {
      id: titleId,
      title: 'Cloud Environment Details',
      titleStyles: _.merge(viewMode === undefined ? {} : { display: 'none' }, { margin: '1.5rem 0 .5rem 1rem' }),
      width,
      onDismiss,
      onPrevious: !!viewMode ? () => setViewMode(undefined) : undefined
    }),
    viewMode !== undefined && hr({ style: { borderTop: '1px solid', width: '100%', color: colors.accent() } }),
    getView(),
    errorAppId && h(AppErrorModal, {
      app: _.find({ appName: errorAppId }, apps),
      onDismiss: () => setErrorAppId(undefined)
    }),
    errorRuntimeId && h(RuntimeErrorModal, {
      runtime: _.find({ id: errorRuntimeId }, runtimes),
      onDismiss: () => setErrorRuntimeId(undefined)
    }),
    busy && spinnerOverlay
  ])

  const modalProps = {
    'aria-labelledby': titleId, isOpen, width,
    onDismiss: () => {
      setViewMode(undefined)
      onDismiss()
    }
  }
  return h(ModalDrawer, { ...modalProps, children: modalBody })
}
