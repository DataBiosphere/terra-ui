import { action } from '@storybook/addon-actions'
import { number, select, text, withKnobs } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { NewUserModal } from 'src/components/group-common'
import { ajaxOverridesStore } from 'src/libs/state'


const INVITE_SUCCEEDED = 201
const USER_NOT_REGISTERED = 404
const USER_IS_REGISTERED = 200

const delayed = ({ ms, resolved, status }) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (resolved) {
        resolve(new Response({ status }))
      } else {
        reject({ status })
      }
    }, ms)
  })
}

const setOverrides = ({ isRegistered, ms }) => {
  ajaxOverridesStore.set([{
    filter: /api\/users\/v1\/(?!invite)/,
    fn: () => {
      action('Checking if user is registered')()
      const status = isRegistered ? USER_IS_REGISTERED : USER_NOT_REGISTERED
      return delayed({ ms, resolved: isRegistered, status })
    }
  }, {
    filter: /users\/v1\/invite/,
    fn: () => {
      action('Requesting user invite')()
      return delayed({ ms, resolved: true, status: INVITE_SUCCEEDED })
    }
  }])
}


const delayedResolve = ms => new Promise((resolve, reject) => setTimeout(resolve, ms))
const delayedReject = ms => new Promise((resolve, reject) => {
  const rejection = {
    status: 404,
    json: () => ({ message: 'Failed to add user' })
  }
  return setTimeout(() => reject(rejection), ms)
})

const Modal = ({ addFn }) => {
  const ms = number('Latency', 100)
  const isRegistered = select('Is user registered', { yes: true, no: false }, false)
  const title = text('Title', 'Add user to Terra Group')
  const adminLabel = text('Admin Label', 'admin')
  const userLabel = text('User Label', 'user')
  const [showModal, setShowModal] = useState(true)

  setOverrides({ isRegistered, ms })

  return h(Fragment, [
    h('button', { onClick: () => setShowModal(true), style: { width: '100px' } }, 'Add User'),
    div({ id: 'modal-root' }, [
      showModal && h(NewUserModal, {
        title,
        adminLabel,
        userLabel,
        addFunction: (role, userEmail) => {
          action(`Attempting to add user ${userEmail} as a ${role}`)()
          return addFn(ms)
        },
        onSuccess: () => {
          action('Successfuly added user')()
          setShowModal(false)
        },
        onDismiss: () => setShowModal(false)
      })
    ])
  ])
}

storiesOf('Add User To Group Modal', module)
  .addDecorator(withKnobs)
  .add(`Successfully add user`, () => h(Modal, { addFn: delayedResolve }))
  .add(`Reject adding user`, () => h(Modal, { addFn: delayedReject }))
