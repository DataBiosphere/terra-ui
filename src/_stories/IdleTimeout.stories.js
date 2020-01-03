import { number, text, withKnobs } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import IdleTimeoutModal from 'components/IdleTimeoutModal'
import { Fragment, useEffect, useRef, useState } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { ButtonPrimary } from 'src/components/common'
import Modal from 'src/components/Modal'
import { getDynamic, listenDynamic, setDynamic } from 'src/libs/browser-storage'
import { authStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


const domain = text('User email domain', 'foo.com')
// const domain = 'foo.com'

const dynamicStorageSlot = (storage, key) => {
  const { subscribe, next } = Utils.subscribable()
  const get = () => getDynamic(storage, key)
  const set = newValue => {
    setDynamic(storage, key, newValue)
    next(newValue)
  }
  listenDynamic(storage, key, next)
  return { subscribe, get, set, update: fn => set(fn(get())) }
}

const agreeTest = dynamicStorageSlot(localStorage, 'terra-timeout-agree')
agreeTest.set(false)

const authTest = dynamicStorageSlot(localStorage, 'auth-story')
authTest.set({
  user: { id: 'test-123' }, isSignedIn: false, profile: { email: `user@${domain}` }
})

const Container = ({ modal }) => {
  const auth = Utils.useAtom(authTest)
  const { isSignedIn } = auth
  const agree = Utils.useAtom(agreeTest)
  const modalRef = useRef()
  const [counter, setCounter] = useState(0)

  agree && authStore.set(auth)

  Utils.useOnMount(() => {
    const observer = new MutationObserver(() => {
      const logout = document.evaluate('//iframe[@src="https://www.google.com/accounts/Logout"]',
        modalRef.current, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
      logout && authTest.set({ user: { id: 'test-123' }, profile: {} })
    })

    observer.observe(modalRef.current, { attributes: false, childList: true, subtree: true })
    return () => observer.disconnect()
  })

  const agreement = h(Fragment, [
    span({ style: { width: 300 } }, [
      'Running this story will log you out of all of your google accounts in this browser.',
      ' You may want to use a browser where you do not have accounts logged in, such as a private window.'
    ]),
    div([
      h(ButtonPrimary, {
        style: { margin: '1rem 1rem 0 0 ' },
        onClick: () => agreeTest.set(!agree)
      },
      [agree ? 'Please Stop' : 'I Understand']),
      !!agree && h(ButtonPrimary, {
        style: { margin: '1rem 0 0 0 ' },
        onClick: () => {
          authTest.set({ user: { id: 'test-123' }, isSignedIn: true, profile: { email: `user@${domain}` } })
          setCounter(counter + 1)
        }
      },
      ['Reset Timeout']),
      !!agree && h(ButtonPrimary, {
        style: { margin: '1rem 0 0 1rem ' },
        onClick: () => { authTest.update(v => ({ ...v, isSignedIn: !isSignedIn })) }
      },
      [isSignedIn ? 'Sign Out' : 'Sign In'])
    ])
  ])

  return h(Fragment, [
    div({
      id: 'modal-root',
      ref: node => modalRef.current = node
    }),
    modal ? h(Modal, { title: 'Test', onDismiss: () => undefined, showCancel: false }, [agreement]) :
      div({ style: { margin: '1rem' } }, [agreement]),
    !!agree && h(IdleTimeoutModal, {
      key: counter,
      emailDomain: text(`Email domain that will be timed out`, 'foo.com'),
      timeout: number('Timeout (seconds)', 15) * 1000,
      countdownStart: number('Timeout Start (seconds)', 10) * 1000
    })
  ])
}

storiesOf('Idle Timeout', module)
  .addDecorator(withKnobs({ escapeHTML: false }))
  .add('Timeout Only', () => {
    return h(Container)
  })
  .add('With Modal Already Showing', () => {
    return h(Container, { modal: true })
  })
