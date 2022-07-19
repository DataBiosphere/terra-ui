import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { br, div, h, img, span } from 'react-hyperscript-helpers'
import { Clickable } from 'src/components/common'
import { icon } from 'src/components/icons'
import { getAppType, tools } from 'src/components/notebook-utils'
import { getRegionInfo } from 'src/components/region-common'
import { appLauncherTabName } from 'src/components/runtime-common'
import cloudIcon from 'src/icons/cloud-compute.svg'
import cromwellImg from 'src/images/cromwell-logo.png' // To be replaced by something square
import galaxyLogo from 'src/images/galaxy-project-logo-square.png'
import jupyterLogo from 'src/images/jupyter-logo.svg'
import rstudioSquareLogo from 'src/images/rstudio-logo-square.png'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import Events from 'src/libs/events'
import * as Nav from 'src/libs/nav'
import { getCostDisplayForDisk, getCostDisplayForTool, getCurrentApp, getCurrentAppDataDisk, getCurrentPersistentDisk, getCurrentRuntime, getGalaxyCost, getPersistentDiskCostHourly, getRuntimeCost } from 'src/libs/runtime-utils'
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
  const [selectedToolIcon, setSelectedToolIcon] = useState(undefined)

  const computeRegion = getRegionInfo(location, locationType).computeRegion
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
    [tools.Jupyter.label, () => img({ src: jupyterLogo, style: { height: 45, width: 45 }, alt: '' })],
    [tools.Galaxy.label, () => img({ src: galaxyLogo, style: { height: 40, width: 40 }, alt: '' })],
    [tools.Cromwell.label, () => img({ src: cromwellImg, style: { width: 45 }, alt: '' })],
    [tools.RStudio.label, () => img({ src: rstudioSquareLogo, style: { height: 45, width: 45 }, alt: '' })],
    [tools.Azure.label, () => img({ src: jupyterLogo, style: { height: 45, width: 45 }, alt: '' })]
  )

  const getColorForStatus = status => Utils.cond(
    [_.upperCase(status) === 'RUNNING', () => colors.success()],
    [_.upperCase(status) === 'ERROR', () => colors.danger()],
    [_.includes('ING', _.upperCase(status)), () => colors.accent()],
    [Utils.DEFAULT, () => colors.warning()])

  const currentApp = toolLabel => getCurrentApp(getAppType(toolLabel))(apps)

  const getIconForTool = (toolLabel, status) => {
    const app = currentApp(toolLabel)
    return h(Clickable, {
      style: { display: 'flex', flexDirection: 'column', justifyContent: 'center', ...contextBarStyles.contextBarButton, borderBottom: '0px' },
      hover: contextBarStyles.hover,
      onClick: () => {
        setSelectedToolIcon(toolLabel)
        setCloudEnvOpen(true)
      },
      tooltipSide: 'left',
      tooltip: div([
        div({ style: { fontWeight: 'bold' } }, `${toolLabel} Environment`),
        div(getCostDisplayForTool(app, appDataDisks, currentRuntime, currentRuntimeTool, toolLabel)),
        div(getCostDisplayForDisk(app, appDataDisks, computeRegion, currentRuntimeTool, persistentDisks, runtimes, toolLabel))
      ]),
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

  //This excludes cromwellapp in the calculation.
  const getTotalToolAndDiskCostDisplay = () => {
    const galaxyApp = getCurrentApp(tools.Galaxy.appType)(apps)
    const galaxyDisk = getCurrentAppDataDisk(tools.Galaxy.appType, apps, appDataDisks, workspaceName)
    const galaxyCost = galaxyApp && galaxyDisk ? getGalaxyCost(galaxyApp, galaxyDisk) : 0
    const runtimeCost = currentRuntime ? getRuntimeCost(currentRuntime) : 0
    const curPd = getCurrentPersistentDisk(runtimes, persistentDisks)
    const diskCost = curPd ? getPersistentDiskCostHourly(curPd, computeRegion) : 0
    return `${Utils.formatUSD(galaxyCost + runtimeCost + diskCost)}`
  }

  return h(Fragment, [
    h(CloudEnvironmentModal, {
      isOpen: isCloudEnvOpen,
      filterForTool: selectedToolIcon,
      onSuccess: async () => {
        setCloudEnvOpen(false)
        setSelectedToolIcon(undefined)
        await refreshRuntimes(true)
        await refreshApps()
      },
      onDismiss: async () => {
        setCloudEnvOpen(false)
        setSelectedToolIcon(undefined)
        await refreshRuntimes(true)
        await refreshApps()
      },
      runtimes, apps, appDataDisks, refreshRuntimes, refreshApps, workspace, canCompute, persistentDisks, location, computeRegion
    }),
    div({ style: { ...Style.elements.contextBarContainer, width: 70 } }, [
      div({ style: contextBarStyles.contextBarContainer }, [
        h(Fragment, [
          h(Clickable, {
            style: { flexDirection: 'column', justifyContent: 'center', ...contextBarStyles.contextBarButton, padding: '0', borderBottom: '0px', cursor: 'default' },
            hover: { ...contextBarStyles.hover },
            tooltipSide: 'left',
            tooltip: [
              div('This rate reflects the estimated aggregate hourly cost for running and paused applications, as well as associated persistent disks. For more details, click on the Cloud icon.'),
              br(),
              div('Workflow and workspace storage costs are not included.')
            ],
            tooltipDelay: 100
          }, [
            div({ style: { textAlign: 'center', color: colors.dark(), fontSize: '0.8em' } }, 'Rate'),
            div({
              style: {
                textAlign: 'center', color: colors.dark(),
                fontWeight: 'bold', fontSize: '1em'
              }
            },
            [
              getTotalToolAndDiskCostDisplay(),
              span({ style: { fontWeight: 'normal', fontSize: '0.8em' } }, '/hr')
            ])
          ]),
          h(Clickable, {
            style: { flexDirection: 'column', justifyContent: 'center', padding: '.75rem', ...contextBarStyles.contextBarButton, borderBottom: '0px' },
            hover: contextBarStyles.hover,
            tooltipSide: 'left',
            onClick: () => setCloudEnvOpen(true),
            tooltip: 'Environment Configuration',
            tooltipDelay: 100,
            useTooltipAsLabel: true
          }, [
            img({ src: cloudIcon, style: { display: 'flex', margin: 'auto', height: 40, width: 40 }, alt: '' })
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
          tooltip: !isTerminalEnabled ? 'Terminal can only be launched from here for Google Jupyter environments.' : 'Terminal',
          tooltipDelay: 100,
          useTooltipAsLabel: false,
          ...Utils.newTabLinkProps
        }, [icon('terminal', { size: 40 })])
      ])
    ])
  ])
}
