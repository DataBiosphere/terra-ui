// import { action } from '@storybook/addon-actions'
import { number, text, withKnobs } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import IdleTimeoutModal from 'components/IdleTimeoutModal'
import { Fragment, useRef, useState } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { ButtonPrimary } from 'src/components/common'
import Modal from 'src/components/Modal'
import { removeLocalPref } from 'src/libs/browser-storage'
import { authStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


const Container = ({ modal }) => {
  const modalRef = useRef()
  const [counter, setCounter] = useState(0)
  const [agree, setAgree] = useState()
  const domain = text('User email domain', 'foo.com')
  agree && authStore.set({ user: `user@${domain}`, isSignedIn: true, profile: { email: `user@${domain}` } })

  const { user } = authStore.get()
  !agree && user && removeLocalPref('terra-timeout')

  Utils.useOnMount(() => {
    const observer = new MutationObserver(() => {
      const logout = document.evaluate('//iframe[@src="https://www.google.com/accounts/Logout"]',
        document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
      logout && authStore.set({ profile: {} })
    })

    observer.observe(modalRef.current, { attributes: false, childList: true, subtree: true })
    return () => observer.disconnect()
  })


  const agreement = h(Fragment, [
    span({ style: { width: 600 } }, [
      'Running this story will log you out of all of your google accounts in this browser.',
      ' You may want to use a browser where you do not have accounts logged in, such as a private window.'
    ]),
    div([
      h(ButtonPrimary, {
        style: { margin: '1rem 1rem 0 0 ' },
        onClick: () => setAgree(!agree)
      }, [agree ? 'Please Stop' : 'I Understand']),
      !!agree && h(ButtonPrimary, {
        style: { margin: '1rem 0 0 0 ' },
        onClick: () => setCounter(counter + 1)
      }, ['Reset Timeout'])
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
      timeout: number('Timeout (seconds)', 10) * 1000,
      countdownStart: number('Timeout Start (seconds)', 5) * 1000
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


