import _ from 'lodash/fp'
import { useEffect, useState } from 'react'
import { b, div, h } from 'react-hyperscript-helpers'
import { spinnerOverlay } from 'src/components/common'
import { icon, spinner } from 'src/components/icons'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorIgnoring, withErrorReporting } from 'src/libs/error'
import { usableStatuses } from 'src/libs/runtime-utils'
import * as Utils from 'src/libs/utils'


export const StatusMessage = ({ hideSpinner, children }) => {
  return div({ style: { paddingLeft: '2rem', display: 'flex', alignItems: 'center' } }, [
    !hideSpinner && spinner({ style: { marginRight: '0.5rem' } }),
    div([children])
  ])
}

export const RuntimeKicker = ({ runtime, refreshRuntimes, onNullRuntime }) => {
  const getRuntime = Utils.useGetter(runtime)
  const signal = Utils.useCancellation()
  const [busy, setBusy] = useState()

  const startRuntimeOnce = withErrorReporting('Error starting notebook runtime', async () => {
    while (!signal.aborted) {
      const currentRuntime = getRuntime()
      const { status, googleProject, runtimeName } = currentRuntime || {}

      if (status === 'Stopped') {
        setBusy(true)
        await Ajax().Runtimes.runtime(googleProject, runtimeName).start()
        await refreshRuntimes()
        setBusy(false)
        return
      } else if (currentRuntime === undefined || status === 'Stopping') {
        await Utils.delay(500)
      } else if (currentRuntime === null) {
        onNullRuntime()
        return
      } else {
        return
      }
    }
  })

  Utils.useOnMount(() => {
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
  const currentStatus = runtime && runtime.status
  const prevStatus = Utils.usePrevious(currentStatus)

  useEffect(() => {
    if (prevStatus === 'Running' && !_.includes(currentStatus, usableStatuses)) {
      onRuntimeStoppedRunning()
    } else if (prevStatus !== 'Running' && _.includes(currentStatus, usableStatuses)) {
      onRuntimeStartedRunning()
    }
  }, [currentStatus, onRuntimeStartedRunning, onRuntimeStoppedRunning, prevStatus])

  return null
}

export const PeriodicCookieSetter = ({ namespace, runtimeName, leading }) => {
  const signal = Utils.useCancellation()
  Utils.usePollingEffect(
    withErrorIgnoring(() => Ajax(signal).Runtimes.notebooks(namespace, runtimeName).setCookie()),
    { ms: 15 * 60 * 1000, leading })
  return null
}
