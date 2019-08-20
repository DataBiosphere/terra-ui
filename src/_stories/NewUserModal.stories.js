import { action } from '@storybook/addon-actions'
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import { Fragment, useEffect, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { NewUserModal } from 'src/components/group-common'
import { ajaxOverridesStore } from 'src/libs/state'
import { delay } from 'src/libs/utils'


const clearOverrides = () => ajaxOverridesStore.set([])

const setOverrides = ({ isRegistered, ms }) => {
  ajaxOverridesStore.set([{
    filter: /api\/users\/v1\/(?!invite)/,
    fn: () => async () => {
      action('Checking if user is registered')()
      await delay(ms)
      return isRegistered ? new Response(null, { status: 200 }) : new Response(null, { status: 404 })
    }
  }, {
    filter: /users\/v1\/invite/,
    fn: () => async () => {
      action('Requesting user invite')()
      await delay(ms)
      return new Response(null, { status: 201 })
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
        addFunction: async (role, userEmail) => {
          action(`Attempting to add user ${userEmail} as a ${role}`)()
          await delay(ms)
          if (addUnregisteredUser ? addSucceeds : isRegistered && addSucceeds) {
            return
          } else {
            throw new Response(JSON.stringify({ message: 'Failed to add user' }), { status: 400 })
          }
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
