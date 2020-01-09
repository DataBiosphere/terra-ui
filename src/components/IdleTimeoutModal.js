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
    `${Math.floor(remainingSeconds % 60).toString().padStart(2, '0')}`
  ])
}

const setLastActive = lastActive => lastActiveTimeStore.update(_.set(getUser().id, lastActive))
const getLastActiveTime = lastRecordedActivity => Utils.cond(
  [lastRecordedActivity === 'expired' || !lastRecordedActivity, () => Date.now()],
  () => parseInt(lastRecordedActivity, 10)
)

const IdleStatusMonitor = ({
  timeout = Utils.durationToMillis({ minutes: 15 }),
  countdownStart = Utils.durationToMillis({ minutes: 3 }), emailDomain = ''
}) => {
  const { isSignedIn, user: { id, email } } = Utils.useStore(authStore)
  // Placeholder code until the clinical user information is available in the user's profile.
  // This will likely be a boolean property in the profile
  const isClinicalDomain = email && emailDomain && email.endsWith(`@${emailDomain}`)
  const { [id]: lastRecordedActivity } = Utils.useStore(lastActiveTimeStore)
  const timedOut = Date.now() > getLastActiveTime(lastRecordedActivity) + timeout

  useEffect(() => { timedOut && !isSignedIn && setLastActive('expired') }, [isSignedIn, timedOut])

  return Utils.cond(
    [isSignedIn && isClinicalDomain, h(InactivityTimer, { id, timeout, countdownStart })],
    [lastRecordedActivity === 'expired' && !isSignedIn, () => h(Modal, {
      title: 'Session Expired',
      showCancel: false,
      onDismiss: () => setLastActive(),
      onOk: () => setLastActive()
    }, ['Your session has expired to maintain security and protect clinical data'])],
    null)
}

const CountdownModal = ({ onCancel, countdown }) => {
  return h(Modal, {
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
      onCancel
    })
  ])
}

const InactivityTimer = ({ id, timeout, countdownStart }) => {
  const { [id]: lastRecordedActivity } = Utils.useStore(lastActiveTimeStore)
  const [logoutRequested, setLogoutRequested] = useState()
  const [currentTime, setDelay] = Utils.useCurrentTime()

  const timeoutTime = getLastActiveTime(lastRecordedActivity) + timeout
  const timedOut = currentTime > timeoutTime
  const showCountdown = currentTime > timeoutTime - countdownStart
  const countdown = Math.max(0, timeoutTime - currentTime)

  setDelay(showCountdown ? 1000 : Math.max(250, countdown - countdownStart))

  Utils.useOnMount(() => {
    const targetEvents = ['click', 'keydown']
    const updateLastActive = () => setLastActive(Date.now().toString())

    if (!lastRecordedActivity || lastRecordedActivity === 'expired') {
      setLastActive(Date.now().toString())
    }

    _.forEach(event => document.addEventListener(event, updateLastActive), targetEvents)

    return () => {
      _.forEach(event => document.removeEventListener(event, updateLastActive), targetEvents)
    }
  })

  useEffect(() => { logoutRequested && setLastActive() }, [logoutRequested])

  return Utils.cond([
    timedOut || logoutRequested, () => {
      return iframe({ style: { display: 'none' }, src: 'https://www.google.com/accounts/Logout' })
    }
  ],
  [showCountdown, () => h(CountdownModal, { onCancel: () => setLogoutRequested(true), countdown })],
  null)
}

export default IdleStatusMonitor
