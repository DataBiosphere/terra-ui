import _ from 'lodash/fp'
import { Fragment, useEffect, useState } from 'react'
import { b, div, h, p } from 'react-hyperscript-helpers'
import { ButtonPrimary, Link, spinnerOverlay } from 'src/components/common'
import { cookiesAcceptedKey } from 'src/components/CookieWarning'
import { icon, spinner } from 'src/components/icons'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorIgnoring, withErrorReporting } from 'src/libs/error'
import Events from 'src/libs/events'
import { getLocalPref } from 'src/libs/prefs'
import { useCancellation, useGetter, useOnMount, usePollingEffect, usePrevious, useStore } from 'src/libs/react-utils'
import { authStore, azureCookieReadyStore, cookieReadyStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import { getConvertedRuntimeStatus, usableStatuses } from 'src/pages/workspaces/workspace/analysis/runtime-utils'


export const StatusMessage = ({ hideSpinner, children }) => {
  return div({ style: { paddingLeft: '2rem', display: 'flex', alignItems: 'center' } }, [
    !hideSpinner && spinner({ style: { marginRight: '0.5rem' } }),
    div([children])
  ])
}

export const RuntimeKicker = ({ runtime, refreshRuntimes }) => {
  const getRuntime = useGetter(runtime)
  const signal = useCancellation()
  const [busy, setBusy] = useState()

  const startRuntimeOnce = withErrorReporting('Error starting cloud environment', async () => {
    while (!signal.aborted) {
      const currentRuntime = getRuntime()
      const { googleProject, runtimeName } = currentRuntime || {}
      const status = getConvertedRuntimeStatus(currentRuntime)

      if (status === 'Stopped') {
        setBusy(true)
        await Ajax().Runtimes.runtime(googleProject, runtimeName).start()
        await refreshRuntimes()
        setBusy(false)
        return
      } else if (currentRuntime === undefined || status === 'Stopping') {
        await Utils.delay(500)
      } else {
        return
      }
    }
  })

  useOnMount(() => {
    startRuntimeOnce()
  })

  return busy ? spinnerOverlay : null
}

export const ApplicationHeader = ({ label, labelBgColor, bgColor, children }) => {
  return div({
    style: {
      backgroundColor: bgColor, display: 'flex', alignItems: 'center', borderBottom: `2px solid ${colors.dark(0.2)}`, whiteSpace: 'pre'
    }
  }, [
    b({ style: { backgroundColor: labelBgColor, padding: '0.75rem 2rem', alignSelf: 'stretch', display: 'flex', alignItems: 'center' } }, [label]),
    children
  ])
}

export const PlaygroundHeader = ({ children }) => {
  return h(ApplicationHeader, {
    label: 'PLAYGROUND MODE',
    labelBgColor: colors.warning(0.4),
    bgColor: colors.warning(0.25)
  }, [
    icon('warning-standard', { style: { color: colors.warning(), marginLeft: '1rem' } }),
    div({ style: { margin: '0.5rem 1rem', whiteSpace: 'initial' } }, [children])
  ])
}

export const RuntimeStatusMonitor = ({ runtime, onRuntimeStoppedRunning = _.noop, onRuntimeStartedRunning = _.noop }) => {
  const currentStatus = getConvertedRuntimeStatus(runtime)
  const prevStatus = usePrevious(currentStatus)

  useEffect(() => {
    if (prevStatus === 'Running' && !_.includes(currentStatus, usableStatuses)) {
      onRuntimeStoppedRunning()
    } else if (prevStatus !== 'Running' && _.includes(currentStatus, usableStatuses)) {
      onRuntimeStartedRunning()
    }
  }, [currentStatus, onRuntimeStartedRunning, onRuntimeStoppedRunning, prevStatus])

  return null
}

export const AuthenticatedCookieSetter = () => {
  const { termsOfService } = useStore(authStore)
  const cookiesAccepted = getLocalPref(cookiesAcceptedKey) !== false
  const userCanUseTerra = termsOfService.userAcceptedTos

  return userCanUseTerra && cookiesAccepted ? h(PeriodicCookieSetter) : null
}

export const PeriodicCookieSetter = () => {
  const signal = useCancellation()
  usePollingEffect(
    withErrorIgnoring(async () => {
      await Ajax(signal).Runtimes.setCookie()
      cookieReadyStore.set(true)
    }),
    { ms: 5 * 60 * 1000, leading: true }
  )
  return null
}

export const PeriodicAzureCookieSetter = ({ proxyUrl }) => {
  const signal = useCancellation()
  usePollingEffect(
    withErrorIgnoring(async () => {
      await Ajax(signal).Runtimes.azureProxy(proxyUrl).setAzureCookie()
      azureCookieReadyStore.set(true)
    }),
    { ms: 5 * 60 * 1000, leading: true }
  )
  return null
}

export const SaveFilesHelp = (isGalaxyDisk = false) => {
  return h(Fragment, [
    p([
      'If you want to save some files permanently, such as input data, analysis outputs, or installed packages, ',
      h(Link, {
        'aria-label': 'Save file help',
        href: 'https://support.terra.bio/hc/en-us/articles/360026639112',
        ...Utils.newTabLinkProps
      }, ['move them to the workspace bucket.'])
    ]),
    !isGalaxyDisk && p(['Note: Jupyter notebooks are autosaved to the workspace bucket, and deleting your disk will not delete your notebooks.'])
  ])
}

export const SaveFilesHelpRStudio = () => {
  return h(Fragment, [
    p([
      'If you want to save files permanently, including input data, analysis outputs, installed packages or code in your session, ',
      h(Link, {
        'aria-label': 'RStudio save help',
        href: 'https://support.terra.bio/hc/en-us/articles/360026639112',
        ...Utils.newTabLinkProps
      }, ['move them to the workspace bucket.'])
    ])
  ])
}

export const SaveFilesHelpGalaxy = () => {
  return h(Fragment, [
    p([
      'Deleting your Cloud Environment will stop your ',
      'running Galaxy application and your application costs. You can create a new Cloud Environment ',
      'for Galaxy later, which will take 8-10 minutes.'
    ]),
    p(['If you want to save some files permanently, such as input data, analysis outputs, or installed packages, ',
      h(Link, {
        'aria-label': 'Galaxy save help',
        href: 'https://support.terra.bio/hc/en-us/articles/360026639112',
        ...Utils.newTabLinkProps
      }, ['move them to the workspace bucket.'])])
  ])
}

export const SaveFilesHelpAzure = () => {
  return h(Fragment, [
    p([
      'If you want to save some files permanently, such as input data, analysis outputs, or installed packages, ',
      'please move them to your workspace storage container.' // TODO: Link support article once published
    ])
  ])
}

export const GalaxyWarning = () => {
  return h(Fragment, [
    p({ style: { fontWeight: 600 } }, 'Important: Please keep this tab open and logged in to Terra while using Galaxy.'),
    p('Galaxy will open in a new tab. ')
  ])
}

export const GalaxyLaunchButton = ({ app, onClick, ...props }) => {
  const cookieReady = useStore(cookieReadyStore)
  return h(ButtonPrimary, {
    disabled: !cookieReady || _.lowerCase(app.status) !== 'running',
    // toolTip: _.lowerCase(app.status) == 'running' ? 'Cannot launch galaxy that is not Running' : '',
    href: app.proxyUrls.galaxy,
    onClick: () => {
      onClick()
      Ajax().Metrics.captureEvent(Events.applicationLaunch, { app: 'Galaxy' })
    },
    ...Utils.newTabLinkPropsWithReferrer, // Galaxy needs the referrer to be present so we can validate it, otherwise we fail with 401
    ...props
  }, ['Open Galaxy'])
}

export const appLauncherTabName = 'workspace-application-launch'
export const analysisLauncherTabName = 'workspace-analysis-launch'
export const analysisTabName = 'workspace-analyses'
