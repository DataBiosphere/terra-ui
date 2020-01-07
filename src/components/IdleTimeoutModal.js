import _ from 'lodash/fp'
import { useEffect, useState } from 'react'
import { div, h, iframe } from 'react-hyperscript-helpers'
import ButtonBar from 'src/components/ButtonBar'
import Modal from 'src/components/Modal'
import { getUser } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { authStore, lastActiveTimeStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


const displayRemainingTime = remainingSeconds => {
  return _.join(':', [
    `${Math.floor(remainingSeconds / 60).toString().padStart(2, '0')}`,
    `${Math.ceil(remainingSeconds % 60).toString().padStart(2, '0')}`
  ])
}

const setLastActive = lastActive => lastActiveTimeStore.update(existing => ({ ...existing, [getUser().id]: lastActive }))

const IdleTimeoutModal = ({
  timeout = Utils.hhmmssToMs({ ss: 5 }),
  countdownStart = Utils.hhmmssToMs({ ss: 3 }), emailDomain = 'gmail'
}) => {
  const lastActiveTime = Utils.useStore(lastActiveTimeStore)
  const { isSignedIn, profile: { email }, user: { id } } = Utils.useStore(authStore)
  const isClinicalDomain = email && emailDomain ? email.includes(`@${emailDomain}`) : false
  const expired = lastActiveTime[id] === 'expired'
  console.log('e:', expired, lastActiveTime[id])

  return Utils.cond(
    [isSignedIn && isClinicalDomain, h(InactivityTimer, { id, expired, timeout, countdownStart })],
    [expired && !isSignedIn, () => h(Modal, {
      title: 'Session Expired',
      showCancel: false,
      onDismiss: () => setLastActive(),
      onOk: () => setLastActive()
    }, ['Your session has expired to maintain security and protect clinical data'])],
    null)
}

const InactivityTimer = ({ id, timeout, countdownStart }) => {
  const lastActiveTime = Utils.useStore(lastActiveTimeStore)[id]
  const [logoutRequested, setLogoutRequested] = useState()
  const [currentTime, setDelay] = Utils.useCurrentTime()

  const lastActive = lastActiveTime ? parseInt(lastActiveTime, 10) : Date.now()
  const timeoutTime = lastActive + timeout
  const timedOut = currentTime > timeoutTime
  const showCountdown = currentTime > timeoutTime - countdownStart
  const countdown = Math.max(0, timeoutTime - currentTime)

  setDelay(showCountdown ? 1000 : Math.max(250, countdown - countdownStart))

  Utils.useOnMount(() => {
    const targetEvents = ['mousedown', 'keydown']
    const updateLastActive = () => setLastActive(Date.now().toString())

    if (!lastActiveTime || lastActiveTime === 'expired') {
      setLastActive(Date.now().toString())
    }

    _.forEach(event => document.addEventListener(event, updateLastActive), targetEvents)

    return () => {
      _.forEach(event => document.removeEventListener(event, updateLastActive), targetEvents)
    }
  })

  useEffect(() => { logoutRequested && setLastActive() }, [logoutRequested])
  useEffect(() => { timedOut && setLastActive('expired') }, [timedOut])

  return Utils.cond(
    [timedOut || logoutRequested, () => {
      console.log('iframe')
      return iframe({ style: { display: 'none' }, src: 'https://www.google.com/accounts/Logout' })
    }],
    [
      showCountdown, () => h(Modal, {
        title: 'Your session is about to expire!',
        onDismiss: () => null,
        showButtons: false
      },
      [
        'To maintain security and protect clinical data, you will be logged out in',
        div({ style: { whiteSpace: 'pre', textAlign: 'center', color: colors.accent(1), fontSize: '4rem' } },
          [displayRemainingTime(countdown / 1000)]),
        'You can extend your session to continue working',
        h(ButtonBar, {
          style: { marginTop: '1rem', display: 'flex', alignItem: 'baseline', justifyContent: 'flex-end' },
          okText: 'Extend Session',
          cancelText: 'Log Out',
          onCancel: () => setLogoutRequested(true)
        })
      ])
    ],
    false)
}

export default IdleTimeoutModal
