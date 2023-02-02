import _ from 'lodash/fp'
import * as qs from 'qs'
import { useEffect, useState } from 'react'
import { div, h, iframe } from 'react-hyperscript-helpers'
import ButtonBar from 'src/components/ButtonBar'
import Modal from 'src/components/Modal'
import { signOut } from 'src/libs/auth'
import colors from 'src/libs/colors'
import * as Nav from 'src/libs/nav'
import { useCurrentTime, useOnMount, useStore } from 'src/libs/react-utils'
import { authStore, getUser, lastActiveTimeStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


const displayRemainingTime = remainingSeconds => {
  return _.join(':', [
    `${Math.floor(remainingSeconds / 60).toString().padStart(2, '0')}`,
    `${Math.floor(remainingSeconds % 60).toString().padStart(2, '0')}`
  ])
}

const setLastActive = lastActive => lastActiveTimeStore.update(_.set(getUser().id, lastActive))
const getIdleData = ({ currentTime, lastRecordedActivity, timeout, countdownStart }) => {
  const lastActiveTime = Utils.cond(
    [!lastRecordedActivity, () => currentTime],
    () => parseInt(lastRecordedActivity, 10)
  )
  const timeoutTime = lastActiveTime + timeout

  return {
    timedOut: currentTime > timeoutTime,
    showCountdown: currentTime > timeoutTime - countdownStart,
    countdown: Math.max(0, timeoutTime - currentTime)
  }
}

// This monitor is to support a particular use case and UI skin, which was mandated by a contract.
const IdleStatusMonitor = ({
  timeout = Utils.durationToMillis({ minutes: 15 }),
  countdownStart = Utils.durationToMillis({ minutes: 3 })
}) => {
  // State
  const [signOutRequired, setSignOutRequired] = useState(false)

  const { isSignedIn, isTimeoutEnabled, user: { id } } = useStore(authStore)
  const { query } = Nav.useRoute()


  // Helpers
  const doSignOut = () => {
    setLastActive()
    Nav.history.replace({ search: qs.stringify(_.set(['sessionExpired'], true, qs.parse(query))) })
    signOut()
    setSignOutRequired(true)
  }

  const reloadSoon = () => setTimeout(() => {
    window.location.reload()
  }, 1000)


  // Render
  return Utils.cond(
    [isSignedIn && isTimeoutEnabled, () => h(InactivityTimer, { id, timeout, countdownStart, doSignOut })],
    [signOutRequired, () => iframe({ onLoad: reloadSoon, style: { display: 'none' }, src: 'https://www.google.com/accounts/Logout' })],
    [query?.sessionExpired && !isSignedIn, () => h(Modal, {
      title: 'Session Expired',
      showCancel: false,
      onDismiss: () => Nav.history.replace({ search: qs.stringify(_.unset(['sessionExpired'], qs.parse(query))) })
    }, ['Your session has expired to maintain security and protect clinical data'])],
    () => null
  )
}

const CountdownModal = ({ onCancel, countdown }) => {
  return h(Modal, {
    title: 'Your session is about to expire!',
    onDismiss: () => null,
    showButtons: false
  }, [
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

const InactivityTimer = ({ id, timeout, countdownStart, doSignOut }) => {
  const { [id]: lastRecordedActivity } = useStore(lastActiveTimeStore) || {}
  const [currentTime, setDelay] = useCurrentTime()
  const { timedOut, showCountdown, countdown } = getIdleData({ currentTime, lastRecordedActivity, timeout, countdownStart })

  setDelay(showCountdown ? 1000 : Math.max(250, countdown - countdownStart))

  useOnMount(() => {
    const targetEvents = ['click', 'keydown']
    const updateLastActive = () => setLastActive(Date.now())

    if (!lastRecordedActivity) {
      setLastActive(Date.now())
    }

    _.forEach(event => document.addEventListener(event, updateLastActive, true), targetEvents)

    return () => {
      _.forEach(event => document.removeEventListener(event, updateLastActive, true), targetEvents)
    }
  })

  useEffect(() => {
    if (timedOut) { doSignOut() }
  }, [doSignOut, timedOut])

  return showCountdown && h(CountdownModal, { onCancel: doSignOut, countdown })
}

export default IdleStatusMonitor
