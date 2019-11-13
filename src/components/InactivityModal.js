import _ from 'lodash/fp'
import { useRef, useState } from 'react'
import { div, h, iframe } from 'react-hyperscript-helpers'
import Modal from 'src/components/Modal'
import { useCancellation } from 'src/libs/ajax'
import { authStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


const displayRemainingTime = remainingSeconds => {
  return `${Math.floor(remainingSeconds / 60)}`.padStart(2, '0') + ':' + `${Math.floor(remainingSeconds % 60)}`.padStart(2, '0')
}

const useCurrentTime = () => {
  const [currentTime, setCurrentTime] = useState(Date.now())
  const signal = useCancellation()
  const delayRef = useRef(250)

  Utils.useOnMount(() => {
    const poll = async () => {
      while (!signal.aborted) {
        await Utils.delay(delayRef.current)
        setCurrentTime(Date.now())
      }
    }
    poll()
  })

  return [currentTime, delay => { delayRef.current = delay }]
}

const timeout = 15 * 1000 * 60
const countdownStart = 3 * 1000 * 60

const InactivityModal = () => {
  const { isSignedIn, profile: { email } } = Utils.useAtom(authStore)
  return !!email && !!isSignedIn && h(InactivityTimer, { localStorageKey: `terra-timeout-${email}` })
}

const InactivityTimer = ({ localStorageKey }) => {
  const [dismiss, setDismiss] = useState()
  const lastActiveTime = parseInt(localStorage.getItem(localStorageKey), 10) || Date.now()
  const [currentTime, setDelay] = useCurrentTime()

  const timeoutTime = lastActiveTime + timeout
  const timedOut = currentTime > timeoutTime
  const showCountdown = currentTime > timeoutTime - countdownStart
  const countdown = Math.max(0, timeoutTime - currentTime)

  setDelay(showCountdown ? 1000 : Math.max(250, countdown - countdownStart))

  Utils.useOnMount(() => {
    const targetEvents = ['mousedown', 'keydown']
    const updateLastActive = () => localStorage.setItem(localStorageKey, Date.now().toString())

    !localStorage.getItem(localStorageKey) && localStorage.setItem(localStorageKey, Date.now().toString())
    _.forEach(event => document.addEventListener(event, updateLastActive), targetEvents)

    return () => {
      _.forEach(event => document.removeEventListener(event, updateLastActive), targetEvents)
    }
  })

  return Utils.cond([
    timedOut, () => {
      localStorage.removeItem(localStorageKey)
      return h(Modal, {
        title: 'Your Session Has Timed Out',
        showCancel: false,
        onDismiss: () => { }
      }, [
        `You will need to log back in to access Terra`,
        iframe({ style: { display: 'none' }, src: 'https://www.google.com/accounts/Logout' })
      ])
    }
  ], [
    showCountdown, h(Modal, {
      title: 'Inactive Session', showCancel: false, width: 400,
      onDismiss: () => setDismiss(!dismiss)
    },
    [
      div({ style: { whiteSpace: 'pre' } },
        [`Your session will timout in ${displayRemainingTime(countdown / 1000)}\nClick or press any key to resume`])
    ])
  ],
  false)
}

export default InactivityModal
