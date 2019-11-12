import _ from 'lodash/fp'
import { useEffect, useRef, useState } from 'react'
import { div, h, iframe } from 'react-hyperscript-helpers'
import Modal from 'src/components/Modal'
import { authStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


const localStorageKey = 'terra-app-timeout'

const timeout = 15000 //15 * 1000 * 60
const countdownStart = 8000 ///890000 //(14 * 1000 * 60) + 55

const getLastActiveTime = () => parseInt(localStorage.getItem(localStorageKey), 10) || Date.now()
const computePrecision = (totalCountdown, countdownStart) => Math.max((totalCountdown - countdownStart) - (Date.now() - getLastActiveTime()), 0)
const displayRemainingTime = remainingSeconds => {
  return `${Math.floor(remainingSeconds / 60)}`.padStart(2, '0') + ':' + `${remainingSeconds % 60}`.padStart(2, '0')
}

const InactivityModal = Utils.connectAtom(authStore, 'authState')(({ authState: { isSignedIn } }) => {
  const [timedOut, setTimedOut] = useState(isSignedIn && Date.now() - getLastActiveTime() > timeout)
  const [countdown, setCountdown] = useState()
  const [showCountdown, setShowCountdown] = useState()
  const countdownRef = useRef()

  useEffect(() => {
    const remaining = timeout - (Date.now() - getLastActiveTime())
    const precision = remaining > countdownStart ? computePrecision(timeout, countdownStart) : 1000

    if (!timedOut && isSignedIn) {
      countdownRef.current = setTimeout(() => {
        const timeRemaining = timeout - (Date.now() - getLastActiveTime())
        setShowCountdown(timeRemaining < countdownStart)
        setTimedOut(Date.now() - getLastActiveTime() > timeout)
        setCountdown(Math.ceil(timeRemaining / 1000))
      }, precision)
    } else {
      clearTimeout(countdownRef.current)
    }
  }, [countdown, isSignedIn, timedOut])

  Utils.useOnMount(() => {
    const targetEvents = ['mousedown', 'keydown']
    const updateLastActive = () => localStorage.setItem(localStorageKey, Date.now().toString())

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
        onDismiss: () => {
          setTimedOut()
          setShowCountdown()
        }
      }, [
        `You will need to log back in to access Terra`,
        iframe({ style: { display: 'none' }, src: 'https://www.google.com/accounts/Logout' })
      ])
    }
  ], [
    showCountdown, h(Modal, { title: 'Inactive Session', showCancel: false, width: '400px', onDismiss: () => setShowCountdown() },
      [
        div({ style: { whiteSpace: 'pre' } },
          [`Your session will timout in ${displayRemainingTime(countdown)}\nClick or press any key to resume`])
      ])
  ],
  false)
})

export default InactivityModal
