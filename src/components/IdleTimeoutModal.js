import _ from 'lodash/fp'
import { useState } from 'react'
import { div, h, iframe } from 'react-hyperscript-helpers'
import ButtonBar from 'src/components/ButtonBar'
import Modal from 'src/components/Modal'
import { getLocalPref, removeLocalPref, setLocalPref } from 'src/libs/browser-storage'
import { authStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'

import colors from '../libs/colors'


const displayRemainingTime = remainingSeconds => {
  return `${Math.floor(remainingSeconds / 60).toString().padStart(2, '0')}:${Math.ceil(remainingSeconds % 60).toString().padStart(2, '0')}`
}

const IdleTimeoutModal = ({ timeout = 15 * 1000 * 60, countdownStart = 2 * 1000 * 60, emailDomain }) => {
  const [expired, setExpired] = useState()
  const { isSignedIn, profile: { email } } = Utils.useAtom(authStore)
  const domain = RegExp(`@${emailDomain}`)

  return Utils.cond(
    [!!isSignedIn && domain.test(email), h(InactivityTimer, { expired, setExpired, timeout, countdownStart })],
    [expired && !email && !isSignedIn, () => h(Modal, {
      title: 'Session Expired',
      showCancel: false,
      onDismiss: () => setExpired(),
      onOk: () => setExpired()
    }, ['Your session has expired to maintain security and protect clinical data'])],
    null)
}

const InactivityTimer = ({ setExpired, expired, timeout, countdownStart }) => {
  const [dismiss, setDismiss] = useState()
  const [logoutRequested, setLogoutRequested] = useState()
  const [currentTime, setDelay] = Utils.usePolling()

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
    expired || logoutRequested, () => {
      removeLocalPref('terra-timeout')
      return iframe({ style: { display: 'none' }, src: 'https://www.google.com/accounts/Logout' })
    }
  ], [
    timedOut, () => {
      setExpired(true)
      return null
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

export default IdleTimeoutModal
