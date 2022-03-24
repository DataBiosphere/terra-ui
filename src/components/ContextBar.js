import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, img } from 'react-hyperscript-helpers'
import { Clickable } from 'src/components/common'
import { ComputeModal } from 'src/components/ComputeModal'
import { CromwellModal } from 'src/components/CromwellModal'
import { GalaxyModal } from 'src/components/GalaxyModal'
import { icon } from 'src/components/icons'
import { getAppType, isToolAnApp, tools } from 'src/components/notebook-utils'
import { appLauncherTabName } from 'src/components/runtime-common'
import { AppErrorModal, RuntimeErrorModal } from 'src/components/RuntimeManager'
import cloudIcon from 'src/icons/cloud-compute.svg'
import cromwellImg from 'src/images/cromwell-logo.png' // To be replaced by something square
import galaxyLogo from 'src/images/galaxy-logo.png'
import jupyterLogo from 'src/images/jupyter-logo.svg'
import rstudioSquareLogo from 'src/images/rstudio-logo-square.png'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import Events from 'src/libs/events'
import * as Nav from 'src/libs/nav'
import { getComputeStatusForDisplay, getCurrentApp, getCurrentRuntime } from 'src/libs/runtime-utils'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { CloudEnvironmentModal } from 'src/pages/workspaces/workspace/notebooks/modals/CloudEnvironmentModal'


const contextBarStyles = {
  contextBarContainer: {
    display: 'flex', flexWrap: 'wrap'
  },
  contextBarButton: {
    display: 'flex',
    justifyContent: 'center',
    width: 70,
    borderBottom: `1px solid ${colors.accent()}`,
    padding: '.75rem',
    height: 70,
    color: colors.accent(),
    backgroundColor: colors.accent(0.2)
  },
  hover: { backgroundColor: colors.accent(0.4) }
}

export const ContextBar = ({
  runtimes, apps, appDataDisks, refreshRuntimes, location, locationType, refreshApps,
  workspace, persistentDisks, workspace: { workspace: { namespace, name: workspaceName } }
}) => {
  const [isCloudEnvOpen, setCloudEnvOpen] = useState(false)
  const [isComputeModalOpen, setComputeModalOpen] = useState(false)
  const [isGalaxyModalOpen, setGalaxyModalOpen] = useState(false)
  const [isCromwellModalOpen, setCromwellModalOpen] = useState(false)
  const [selectedToolIcon, setSelectedToolIcon] = useState(null)
  const [errorRuntimeId, setErrorRuntimeId] = useState(undefined)
  const [errorAppId, setErrorAppId] = useState(undefined)

  const currentRuntime = getCurrentRuntime(runtimes)
  const currentRuntimeTool = currentRuntime?.labels?.tool
  const isTerminalEnabled = currentRuntimeTool === tools.Jupyter.label && currentRuntime && currentRuntime.status !== 'Error'
  const terminalLaunchLink = Nav.getLink(appLauncherTabName, { namespace, name: workspaceName, application: 'terminal' })
  const canCompute = !!(workspace?.canCompute || runtimes?.length)

  const startCurrentRuntime = () => {
    const { googleProject, runtimeName } = currentRuntime
    Ajax().Runtimes.runtime(googleProject, runtimeName).start()
  }

  const getImgForTool = toolLabel => Utils.switchCase(toolLabel,
    [tools.Jupyter.label, () => img({ src: jupyterLogo, style: { height: 45, width: 45 } })],
    [tools.Galaxy.label, () => img({ src: galaxyLogo, style: { height: 14, width: 45 } })],
    [tools.Cromwell.label, () => img({ src: cromwellImg, style: { width: 45 } })],
    [tools.RStudio.label, () => img({ src: rstudioSquareLogo, style: { height: 45, width: 45 } })]
  )

  const getColorForStatus = status => Utils.cond(
    [_.upperCase(status) === 'RUNNING', () => colors.success()],
    [_.upperCase(status) === 'ERROR', () => colors.danger()],
    [_.includes('ING', _.upperCase(status)), () => colors.accent()],
    [Utils.DEFAULT, () => colors.warning()])

  const currentApp = toolLabel => getCurrentApp(getAppType(toolLabel))(apps)


  const getIconForTool = (toolLabel, status) => {
    return h(Clickable, {
      style: { display: 'flex', flexDirection: 'column', justifyContent: 'center', ...contextBarStyles.contextBarButton, borderBottom: '0px' },
      hover: contextBarStyles.hover,
      onClick: () => { // onclick displays an error message if the tool is in error, otherwise opens the config modal (I.e. ComputeModal or GalaxyModal)
        if (_.toLower(status) === 'error') {
          Utils.cond(
            [isToolAnApp(toolLabel), () => setErrorAppId(currentApp(toolLabel)?.appName)],
            [Utils.DEFAULT, () => setErrorRuntimeId(currentRuntime?.id)]
          )
        } else {
          Utils.switchCase(toolLabel,
            [tools.Galaxy.label, () => setGalaxyModalOpen(true)],
            [tools.Cromwell.label, () => setCromwellModalOpen(true)],
            [Utils.DEFAULT, () => {
              setSelectedToolIcon(toolLabel)
              setComputeModalOpen(true)
            }])
        }
      },
      tooltipSide: 'left',
      tooltip: `${toolLabel} environment ( ${getComputeStatusForDisplay(status)} )`,
      tooltipDelay: 100,
      useTooltipAsLabel: true
    }, [
      div({ style: { display: 'flex', justifyContent: 'center', alignItems: 'center' } }, [
        getImgForTool(toolLabel)
      ]),
      div({ style: { justifyContent: 'flex-end', display: 'flex', color: getColorForStatus(status) } }, [
        icon('circle', { style: { border: '1px solid white', borderRadius: '50%' }, size: 12 })
      ])
    ])
  }

  const getEnvironmentStatusIcons = () => {
    const galaxyApp = getCurrentApp(tools.Galaxy.appType)(apps)
    const cromwellApp = !tools.Cromwell.isAppHidden && getCurrentApp(tools.Cromwell.appType)(apps)
    return h(Fragment, [
      ...(currentRuntime ? [getIconForTool(currentRuntimeTool, currentRuntime.status)] : []),
      ...(galaxyApp ? [getIconForTool(tools.Galaxy.label, galaxyApp.status)] : []),
      ...(cromwellApp ? [getIconForTool(tools.Cromwell.label, cromwellApp.status)] : [])
    ])
  }

  return h(Fragment, [
    h(CloudEnvironmentModal, {
      isOpen: isCloudEnvOpen,
      onSuccess: async () => {
        setCloudEnvOpen(false)
        await refreshRuntimes(true)
        await refreshApps()
      },
      onDismiss: async () => {
        setCloudEnvOpen(false)
        await refreshRuntimes(true)
        await refreshApps()
      },
      runtimes, apps, appDataDisks, refreshRuntimes, refreshApps, workspace, canCompute, persistentDisks, location, locationType
    }),
    h(ComputeModal, {
      isOpen: isComputeModalOpen,
      isAnalysisMode: true,
      tool: selectedToolIcon,
      workspace,
      runtimes,
      persistentDisks,
      location,
      onDismiss: () => setComputeModalOpen(false),
      onSuccess: _.flow(
        withErrorReporting('Error loading cloud environment'),
        Utils.withBusyState(v => this.setState({ busy: v }))
      )(async () => {
        setComputeModalOpen(false)
        await refreshRuntimes(true)
      })
    }),
    h(GalaxyModal, {
      workspace,
      apps,
      appDataDisks,
      isOpen: isGalaxyModalOpen,
      onDismiss: () => setGalaxyModalOpen(false),
      onSuccess: () => {
        withErrorReporting('Error loading galaxy environment')(
          setGalaxyModalOpen(false),
          refreshApps()
        )
      }
    }),
    h(CromwellModal, {
      workspace,
      apps,
      appDataDisks,
      isOpen: isCromwellModalOpen,
      onDismiss: () => setCromwellModalOpen(false),
      onSuccess: () => {
        withErrorReporting('Error loading galaxy environment')(
          setCromwellModalOpen(false),
          refreshApps()
        )
      }
    }),
    errorAppId && h(AppErrorModal, {
      app: _.find({ appName: errorAppId }, apps),
      onDismiss: () => setErrorAppId(undefined)
    }),
    errorRuntimeId && h(RuntimeErrorModal, {
      runtime: _.find({ id: errorRuntimeId }, runtimes),
      onDismiss: () => setErrorRuntimeId(undefined)
    }),
    div({ style: { ...Style.elements.contextBarContainer, width: 70 } }, [
      div({ style: contextBarStyles.contextBarContainer }, [
        h(Fragment, [
          h(Clickable, {
            style: { flexDirection: 'column', justifyContent: 'center', padding: '.75rem', ...contextBarStyles.contextBarButton, borderBottom: '0px' },
            hover: contextBarStyles.hover,
            tooltipSide: 'left',
            onClick: () => setCloudEnvOpen(!isCloudEnvOpen),
            tooltip: 'Environment Configuration',
            tooltipDelay: 100,
            useTooltipAsLabel: true
          }, [
            img({ src: cloudIcon, style: { display: 'flex', margin: 'auto', height: 40, width: 40 } })
          ]),
          getEnvironmentStatusIcons()
        ]),
        h(Clickable, {
          'aria-label': 'Terminal button',
          style: { borderTop: `1px solid ${colors.accent()}`, paddingLeft: '1rem', alignItems: 'center', ...contextBarStyles.contextBarButton, color: !isTerminalEnabled ? colors.dark(0.7) : contextBarStyles.contextBarButton.color },
          hover: contextBarStyles.hover,
          tooltipSide: 'left',
          disabled: !isTerminalEnabled,
          href: terminalLaunchLink,
          onClick: () => {
            Ajax().Metrics.captureEvent(Events.analysisLaunch,
              { origin: 'contextBar', source: 'terminal', application: 'terminal', workspaceName, namespace })
            if (window.location.hash === terminalLaunchLink && currentRuntime?.status === 'Stopped') {
              startCurrentRuntime()
            }
          },
          tooltip: !isTerminalEnabled ? 'Terminal can only be launched for Jupyter environments' : 'Terminal',
          tooltipDelay: 100,
          useTooltipAsLabel: false,
          ...Utils.newTabLinkProps
        }, [icon('terminal', { size: 40 })])
      ])
    ])
  ])
}
