import { InactivityCountdownTimer } from 'inactivity-countdown-timer'
import _ from 'lodash/fp'
import { useEffect, useRef, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import Modal from 'src/components/Modal'
import { authStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


const localStorageKey = 'terra-test'

const InactivityModalx = Utils.connectAtom(authStore, 'authState')(({ authState: { isSignedIn } }) => {
  const [countdown, setCountdown] = useState()
  const [hasTimedOut, setHasTimedOut] = useState()
  const [timer, setTimer] = useState()
  // const [idleTimeoutTime, setIdleTimeoutTime] = useState(computeTimeout)

  useEffect(() => {
    Utils.cond([isSignedIn && !timer, () => {
      const inactivityConfig = {
        idleTimeoutTime: 15000,
        startCountDownTimerAt: 10000,
        countDownCallback: setCountdown,
        countDownCancelledCallback: () => setCountdown(),
        localStorageKey,
        resetEvents: ['keydown', 'mousedown'],
        timeoutCallback: () => setHasTimedOut(true)
      }
      const activityTimer = new InactivityCountdownTimer(inactivityConfig)
      activityTimer.start()
      setTimer(activityTimer)
    }],
    [!isSignedIn && timer, () => {
      timer.stop()
      timer.cleanup()
      setTimer()
    }])
  }, [isSignedIn, timer])

  return Utils.cond(
    [hasTimedOut, () => h(Modal, {
      onDismiss: () => {
        setHasTimedOut()
        setCountdown()
        timer.cleanup()
        localStorage.removeItem(localStorageKey)
        setTimer()
      }
    }, [`Your session has timed out`])],
    [
      countdown, () => h(Modal, { width: '400px', onDismiss: () => setCountdown() },
        [
          div({ style: { whiteSpace: 'pre' } },
            [`Your session will timout in: ${countdown} seconds.\nClick or press any key to resume`])
        ])
    ],
    false
  )
})

const timeout = 10000
const countdownStart = 5000

const getLastActiveTime = () => parseInt(localStorage.getItem(localStorageKey), 10) || Date.now()
const computePrecision = timer => Math.max(timer - (Date.now() - getLastActiveTime()), 0)

const InactivityModal = () => {
  const [timedOut, setTimedOut] = useState(Date.now() - getLastActiveTime() > timeout)
  const [countdown, setCountdown] = useState()
  const [showCountdown, setShowCountdown] = useState()
  const countdownRef = useRef()

  useEffect(() => {
    const remaining = timeout - (Date.now() - getLastActiveTime())
    const precision = remaining > countdownStart ? computePrecision(countdownStart) : 1000

    if (!timedOut) {
      countdownRef.current = setTimeout(() => {
        const timeRemaining = timeout - (Date.now() - getLastActiveTime())
        setShowCountdown(timeRemaining < countdownStart)
        setTimedOut(Date.now() - getLastActiveTime() > timeout)
        setCountdown(Math.ceil(timeRemaining / 1000))
      }, precision)
    }
  }, [countdown, timedOut])

  Utils.useOnMount(() => {
    const targetEvents = ['mousedown', 'keydown']
    const updateLastActive = () => localStorage.setItem(localStorageKey, Date.now().toString())

    _.forEach(event => document.addEventListener(event, updateLastActive), targetEvents)

    return () => {
      clearTimeout(countdownRef.current)
      _.forEach(event => document.removeEventListener(event, updateLastActive), targetEvents)
    }
  })

  return Utils.cond([
    timedOut, () => h(Modal, {
      onDismiss: () => {
        setTimedOut()
        setShowCountdown()
      }
    }, [`Your session has timed out`])
  ], [
    showCountdown, h(Modal, { width: '400px', onDismiss: () => setShowCountdown() },
      [
        div({ style: { whiteSpace: 'pre' } },
          [`Your session will timout in: ${countdown} seconds.\nClick or press any key to resume`])
      ])
  ],
  false)
}

export default InactivityModal
