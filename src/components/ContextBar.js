import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, img } from 'react-hyperscript-helpers'
import { Clickable } from 'src/components/common'
import { icon } from 'src/components/icons'
import { tools } from 'src/components/notebook-utils'
import { appLauncherTabName } from 'src/components/runtime-common'
import cloudIcon from 'src/icons/cloud-compute.svg'
import cromwellImg from 'src/images/cromwell-logo.png' // To be replaced by something square
import galaxyLogo from 'src/images/galaxy-logo.png'
import jupyterLogo from 'src/images/jupyter-logo.svg'
import rstudioSquareLogo from 'src/images/rstudio-logo-square.png'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import * as Nav from 'src/libs/nav'
import { getCurrentAppForType, getCurrentRuntime } from 'src/libs/runtime-utils'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { CloudEnvironmentModal } from 'src/pages/workspaces/workspace/notebooks/modals/CloudEnvironmentModal'
import { WorkspaceMenuTrigger } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const contextBarStyles = {
  contextBarContainer: {
    display: 'flex', flexWrap: 'wrap'
  },
  contextBarButton: {
    display: 'flex',
    borderBottom: `1px solid ${colors.accent()}`,
    padding: '1rem',
    color: colors.accent(),
    backgroundColor: colors.accent(0.2)
  },
  hover: { backgroundColor: colors.accent(0.4) }
}

export const ContextBar = ({ setDeletingWorkspace, setCloningWorkspace, setSharingWorkspace, runtimes, apps, appDataDisks, refreshRuntimes, location, locationType, refreshApps, workspace, persistentDisks, workspace: { workspace: { namespace, bucketName, name: workspaceName } } }) => {
  const [isCloudEnvOpen, setCloudEnvOpen] = useState(false)

  const currentRuntime = getCurrentRuntime(runtimes)
  const currentRuntimeTool = currentRuntime?.labels?.tool
  const isTerminalEnabled = currentRuntimeTool === tools.Jupyter.label && currentRuntime && currentRuntime.status !== 'Error'
  const terminalLaunchLink = Nav.getLink(appLauncherTabName, { namespace, name: workspaceName, application: 'terminal' })
  const isOwner = workspace && Utils.isOwner(workspace.accessLevel)
  const canShare = !!workspace?.canShare
  const canCompute = !!(workspace?.canCompute || runtimes?.length)

  const startCurrentRuntime = () => {
    const { googleProject, runtimeName } = currentRuntime
    Ajax().Runtimes.runtime(googleProject, runtimeName).start()
  }

  const getImgForTool = toolLabel => Utils.switchCase(toolLabel,
    [tools.Jupyter.label, () => img({ src: jupyterLogo, style: { height: 30, width: 30 } })],
    [tools.galaxy.label, () => img({ src: galaxyLogo, style: { height: 12, width: 35 } })],
    [tools.cromwell.label, () => img({ src: cromwellImg, style: { width: 30 } })],
    [tools.RStudio.label, () => img({ src: rstudioSquareLogo, style: { height: 30, width: 30 } })]
  )

  const getColorForStatus = status => Utils.cond(
    [_.upperCase(status) === 'RUNNING', () => colors.success()],
    [_.upperCase(status) === 'ERROR', () => colors.danger()],
    [_.includes('ING', _.upperCase(status)), () => colors.accent()],
    [Utils.DEFAULT, () => colors.warning()])

  const getIconForTool = (toolLabel, status) => {
    return div({ style: { display: 'flex', flexDirection: 'column' } }, [
      div({ style: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1rem' } }, [
        getImgForTool(toolLabel)
      ]),
      div({ style: { display: 'flex', justifyContent: 'flex-end', color: getColorForStatus(status) } }, [
        icon('circle', { size: 6 })
      ])
    ])
  }

  const getEnvironmentStatusIcons = () => {
    const galaxyApp = getCurrentAppForType(tools.galaxy.appType)(apps)
    const cromwellApp = !tools.cromwell.isAppHidden && getCurrentAppForType(tools.cromwell.appType)(apps)
    return h(Fragment, [
      ...(currentRuntime ? [getIconForTool(currentRuntimeTool, currentRuntime.status)] : []),
      ...(galaxyApp ? [getIconForTool(tools.galaxy.label, galaxyApp.status)] : []),
      ...(cromwellApp ? [getIconForTool(tools.cromwell.label, cromwellApp.status)] : [])
    ])
  }

  return h(Fragment, [
    h(CloudEnvironmentModal, {
      isOpen: isCloudEnvOpen,
      onSuccess: async () => {
        setCloudEnvOpen(false)
        await refreshRuntimes(true)
      },
      onDismiss: async () => {
        setCloudEnvOpen(false)
        await refreshRuntimes(true)
      },
      runtimes, apps, appDataDisks, refreshRuntimes, refreshApps,
      workspace,
      canCompute,
      persistentDisks,
      location,
      locationType
    }),
    div({ style: Style.elements.contextBarContainer }, [
      div({ style: contextBarStyles.contextBarContainer }, [
        h(WorkspaceMenuTrigger, { canShare, isOwner, setCloningWorkspace, setSharingWorkspace, setDeletingWorkspace }, [
          h(Clickable, {
            style: contextBarStyles.contextBarButton,
            hover: contextBarStyles.hover,
            tooltipSide: 'left',
            tooltip: 'Workspace menu',
            tooltipDelay: 100,
            useTooltipAsLabel: true
          }, [icon('ellipsis-v', { size: 24 })])
        ]),
        h(Clickable, {
          style: { ...contextBarStyles.contextBarButton, flexDirection: 'column', justifyContent: 'center', padding: '.75rem' },
          hover: contextBarStyles.hover,
          tooltipSide: 'left',
          onClick: () => setCloudEnvOpen(!isCloudEnvOpen),
          tooltip: 'Environment Configuration',
          tooltipDelay: 100,
          useTooltipAsLabel: true
        }, [
          img({ src: cloudIcon, style: { display: 'flex', margin: 'auto', height: 26, width: 26 } }),
          getEnvironmentStatusIcons()
        ]),
        h(Clickable, {
          'aria-label': 'Terminal button',
          style: { ...contextBarStyles.contextBarButton, color: !isTerminalEnabled ? colors.dark(0.7) : contextBarStyles.contextBarButton.color },
          hover: contextBarStyles.hover,
          tooltipSide: 'left',
          disabled: !isTerminalEnabled,
          href: terminalLaunchLink,
          onClick: window.location.hash === terminalLaunchLink && currentRuntime?.status === 'Stopped' ? () => startCurrentRuntime() : undefined,
          tooltip: !isTerminalEnabled ? 'Terminal can only be launched for Jupyter environments' : 'Terminal',
          tooltipDelay: 100,
          useTooltipAsLabel: false,
          ...Utils.newTabLinkProps
        }, [icon('terminal', { size: 24 })])
      ])
    ])
  ])
}
