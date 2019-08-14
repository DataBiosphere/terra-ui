import { action } from '@storybook/addon-actions'
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import { Fragment, useEffect, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { NewUserModal } from 'src/components/group-common'
import { ajaxOverridesStore } from 'src/libs/state'


const INVITE_SUCCEEDED = 201
const USER_NOT_REGISTERED = 404
const USER_IS_REGISTERED = 200
const FAILED_REQUEST = 400

const delayed = ({ ms, resolved, status }) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (resolved) {
        resolve(new Response({ status }))
      } else {
        reject({ status, json: () => ({ message: 'Failed to add user' }) })
      }
    }, ms)
  })
}

const clearOverrides = () => ajaxOverridesStore.set([])

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

const Modal = () => {
  const ms = number('Latency', 100)
  const addUnregisteredUser = boolean('Allow adding unregistered user', true)
  const isRegistered = boolean('User is registered', false)
  const addSucceeds = boolean('User added successfully', true)
  const title = text('Title', 'Add user to Terra Group')
  const adminLabel = text('Admin Label', 'admin')
  const userLabel = text('User Label', 'user')
  const [showModal, setShowModal] = useState(true)

  useEffect(() => {
    setOverrides({ isRegistered, ms })
    return clearOverrides
  }, [isRegistered, ms])

  return h(Fragment, [
    h('button', { onClick: () => setShowModal(true), style: { width: '100px' } }, 'Add User'),
    div({ id: 'modal-root' }, [
      showModal && h(NewUserModal, {
        addUnregisteredUser,
        title,
        adminLabel,
        userLabel,
        addFunction: (role, userEmail) => {
          action(`Attempting to add user ${userEmail} as a ${role}`)()
          const resolved = addUnregisteredUser ? addSucceeds : isRegistered && addSucceeds
          return delayed({ resolved, ms, status: FAILED_REQUEST })
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
  .add(`Add user`, () => h(Modal))
