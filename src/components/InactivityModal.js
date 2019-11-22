import _ from 'lodash/fp'
import { Fragment, useRef, useState } from 'react'
import { div, h, iframe } from 'react-hyperscript-helpers'
import ButtonBar from 'src/components/ButtonBar'
import Modal from 'src/components/Modal'
import { notify } from 'src/components/Notifications'
import { useCancellation } from 'src/libs/ajax'
import { getLocalPref, removeLocalPref, setLocalPref } from 'src/libs/browser-storage'
import { authStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'

import colors from '../libs/colors'


const displayRemainingTime = remainingSeconds => {
  return `${Math.floor(remainingSeconds / 60)}`.padStart(2, '0') + ':' + `${Math.floor(remainingSeconds % 60)}`.padStart(2, '0')
}

export const usePolling = (initialDelay = 250) => {
  const [currentTime, setCurrentTime] = useState(Date.now())
  const signal = useCancellation()
  const delayRef = useRef(initialDelay)

  Utils.useOnMount(() => {
    const poll = async () => {
      while (!signal.aborted) {
        await Utils.delay(delayRef.current)
        !signal.aborted && setCurrentTime(Date.now())
      }
    }
    poll()
  })

  return [currentTime, delay => { delayRef.current = delay }]
}

const InactivityModal = () => {
  const { isSignedIn, profile: { email } } = Utils.useAtom(authStore)
  return !!email && !!isSignedIn && h(InactivityTimer)
}

const InactivityTimer = ({
  timeout = 10 * 1000 * 1,
  countdownStart = 5 * 1000 * 1
}) => {
  const [dismiss, setDismiss] = useState()
  const [logoutRequested, setLogoutRequested] = useState()
  const [currentTime, setDelay] = usePolling()

  const lastActiveTime = getLocalPref('terra-timeout') ? parseInt(getLocalPref('terra-timeout'), 10) : Date.now()
  const timeoutTime = lastActiveTime + timeout
  const timedOut = currentTime > timeoutTime
  const showCountdown = currentTime > timeoutTime - countdownStart
  const countdown = Math.max(0, timeoutTime - currentTime)

  setDelay(showCountdown ? 1000 : Math.max(250, countdown - countdownStart))

  Utils.useOnMount(() => {
    const targetEvents = ['mousedown', 'keydown']
    const updateLastActive = () => setLocalPref('terra-timeout', Date.now().toString())

    !getLocalPref('terra-timeout') && setLocalPref('terra-timeout', Date.now().toString())
    _.forEach(event => document.addEventListener(event, updateLastActive), targetEvents)

    return () => {
      _.forEach(event => document.removeEventListener(event, updateLastActive), targetEvents)
    }
  })

  return Utils.cond([
    timedOut || logoutRequested, () => {
      removeLocalPref('terra-timeout')
      !logoutRequested && notify('info', 'Session Expired', { message: 'Your session has expired to maintain security and protect clinical data.' })
      return h(Fragment, [
        iframe({ style: { display: 'none' }, src: 'https://www.google.com/accounts/Logout' })
      ])
    }
  ], [
    showCountdown, () => h(Modal, {
      title: 'Your session is about to expire!',
      onDismiss: () => setDismiss(!dismiss),
      showButtons: false
    },
    [
      'To maintain security and protect clinical data, you will be logged out in',
      div({ style: { whiteSpace: 'pre', textAlign: 'center', color: colors.accent(1), fontSize: '4rem' } }, [displayRemainingTime(countdown / 1000)]),
      'You can extend your session to continue working',
      h(ButtonBar, {
        style: { marginTop: '1rem', display: 'flex', alignItem: 'baseline', justifyContent: 'flex-end' },
        okText: 'Extend Session',
        cancelText: 'Log Out',
        onCancel: () => setLogoutRequested(true),
        onOk: () => setDismiss(!dismiss)
      })
    ])
  ],
  false)
}

export default InactivityModal
