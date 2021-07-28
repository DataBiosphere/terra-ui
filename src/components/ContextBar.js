import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, img } from 'react-hyperscript-helpers'
import { Clickable, comingSoon } from 'src/components/common'
import { icon } from 'src/components/icons'
import { tools } from 'src/components/notebook-utils'
import { makeMenuIcon, MenuButton, MenuTrigger } from 'src/components/PopupTrigger'
import cloudIcon from 'src/icons/cloud-compute.svg'
import galaxyLogo from 'src/images/galaxy-logo.png'
import jupyterLogo from 'src/images/jupyter-logo.svg'
import rstudioSquareLogo from 'src/images/rstudio-logo-square.png'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import * as Nav from 'src/libs/nav'
import {
  getCurrentApp,
  getCurrentRuntime
} from 'src/libs/runtime-utils'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { CloudEnvironmentModal } from 'src/pages/workspaces/workspace/notebooks/modals/CloudEnvironmentModal'


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

export const ContextBar = ({ setDeletingWorkspace, setCloningWorkspace, setSharingWorkspace, isOwner, canShare, canCompute, runtimes, apps, galaxyDataDisks, refreshRuntimes, refreshApps, workspace, persistentDisks, workspace: { workspace: { namespace, bucketName, name: workspaceName } } }) => {
  const [isCloudEnvOpen, setCloudEnvOpen] = useState(false)
  const currentRuntime = getCurrentRuntime(runtimes)
  const currentApp = getCurrentApp(apps)
  const currentRuntimeTool = currentRuntime?.labels?.tool

  const isTerminalEnabled = currentRuntimeTool === tools.Jupyter.label && currentRuntime && currentRuntime.status !== 'Error'
  const terminalLaunchLink = Nav.getLink('workspace-application-launch', { namespace, name: workspaceName, application: 'terminal' })

  const startCurrentRuntime = () => {
    const { googleProject, runtimeName } = currentRuntime
    Ajax().Runtimes.runtime(googleProject, runtimeName).start()
  }

  const getImgForTool = toolLabel => Utils.switchCase(toolLabel,
    [tools.Jupyter.label, () => img({ src: jupyterLogo, style: { height: 30, width: 30 } })],
    [tools.galaxy.label, () => img({ src: galaxyLogo, style: { height: 12, width: 35 } })],
    [tools.RStudio.label, () => img({ src: rstudioSquareLogo, style: { height: 30, width: 30 } })]
  )

  const getColorForStatus = status => Utils.cond(
    [_.upperCase(status) === 'RUNNING', () => colors.success()],
    [_.upperCase(status) === 'ERROR', () => colors.danger()],
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
    return h(Fragment, [
      ...(currentRuntime ? [getIconForTool(currentRuntimeTool, currentRuntime.status)] : []),
      ...(currentApp ? [getIconForTool(tools.galaxy.label, currentApp.status)] : [])
    ])
  }

  return h(Fragment, [
    h(CloudEnvironmentModal, {
      isOpen: isCloudEnvOpen,
      onSuccess: () => {}, //TODO: I don't know if we want to do anything?
      onDismiss: () => setCloudEnvOpen(false),
      runtimes, apps, galaxyDataDisks, refreshRuntimes, refreshApps,
      workspace,
      canCompute,
      persistentDisks
    }),
    div({ style: Style.elements.contextBarContainer }, [
      div({ style: contextBarStyles.contextBarContainer }, [
        h(MenuTrigger, {
          closeOnClick: true,
          content: h(Fragment, [
            h(MenuButton, { onClick: () => setCloningWorkspace(true) }, [makeMenuIcon('copy'), 'Clone']),
            h(MenuButton, {
              disabled: !canShare,
              tooltip: !canShare && 'You have not been granted permission to share this workspace',
              tooltipSide: 'left',
              onClick: () => setSharingWorkspace(true)
            }, [makeMenuIcon('share'), 'Share']),
            h(MenuButton, { disabled: true }, [makeMenuIcon('export'), 'Publish', comingSoon]),
            h(MenuButton, {
              disabled: !isOwner,
              tooltip: !isOwner && 'You must be an owner of this workspace or the underlying billing project',
              tooltipSide: 'left',
              onClick: () => setDeletingWorkspace(true)
            }, [makeMenuIcon('trash'), 'Delete Workspace'])
          ]),
          side: 'bottom'
        }, [
          h(Clickable, {
            'aria-label': 'Menu',
            style: contextBarStyles.contextBarButton,
            hover: contextBarStyles.hover,
            tooltipSide: 'left',
            tooltip: 'Menu',
            tooltipDelay: 100
          }, [icon('ellipsis-v', { size: 24 })])
        ]),
        h(Clickable, {
          style: { ...contextBarStyles.contextBarButton, flexDirection: 'column', justifyContent: 'center', padding: '.75rem' },
          hover: contextBarStyles.hover,
          tooltipSide: 'left',
          onClick: () => setCloudEnvOpen(!isCloudEnvOpen),
          ...{ tooltip: 'Environment Configuration', tooltipDelay: 100 },
          'aria-label': 'Environment Configuration'
        }, [
          img({ src: cloudIcon, style: { display: 'flex', margin: 'auto', height: 26, width: 26 } }),
          getEnvironmentStatusIcons()
        ]),
        h(Clickable, {
          style: { ...contextBarStyles.contextBarButton, color: !isTerminalEnabled ? colors.dark(0.7) : contextBarStyles.contextBarButton.color },
          hover: contextBarStyles.hover,
          tooltipSide: 'left',
          disabled: !isTerminalEnabled,
          href: terminalLaunchLink,
          onClick: window.location.hash === terminalLaunchLink && currentRuntime?.status === 'Stopped' ? () => startCurrentRuntime() : undefined,
          tooltip: !isTerminalEnabled ? 'Terminal can only be launched for Jupyter environments' : 'Terminal',
          tooltipDelay: 100,
          'aria-label': 'Terminal',
          ...Utils.newTabLinkProps
        }, [icon('terminal', { size: 24 })])
      ])
    ])
  ])
}
