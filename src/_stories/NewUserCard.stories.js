import { action } from '@storybook/addon-actions'
import { number, select, text, withKnobs } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { NewUserModal } from 'src/components/group-common'


const delayedResolve = ms => new Promise(resolve => setTimeout(resolve, ms))
const delayedReject = ms => new Promise((resolve, reject) => {
  const rejection = {
    status: 404,
    json: () => ({ message: 'Failed to add user' })
  }
  return setTimeout(() => reject(rejection), ms)
})

const Modal = ({ addFn }) => {
  const checkRegistrationDelay = number('Check Registration Latency', 100)
  const addUserDelay = number('Add User Latency', 100)
  const inviteUserDelay = number('Invite User Latency', 100)
  const isRegistered = select('Is user registered', { yes: true, no: false }, false)
  const title = text('Title', 'Title')
  const adminLabel = text('Admin Label', 'admin')
  const userLabel = text('User Label', 'user')
  const [showModal, setShowModal] = useState(true)

  return h(Fragment, [
    h('button', { onClick: () => setShowModal(true), style: { width: '100px' } }, 'Add User'),
    div({ id: 'modal-root' }, [
      showModal && h(NewUserModal, {
        title,
        adminLabel,
        userLabel,
        addFunction: (role, userEmail) => {
          action(`Attempting to add user ${userEmail} as a ${role}`)()
          return addFn(addUserDelay)
        },
        onSuccess: () => {
          action('Successfuly added user')()
          setShowModal(false)
        },
        checkRegistrationFunction: async userEmail => {
          action(`Checking if ${userEmail} is registered`)()
          await delayedResolve(checkRegistrationDelay)
          return isRegistered
        },
        inviteFunction: async userEmail => {
          await delayedResolve(inviteUserDelay)
          action(`Inviting ${userEmail}`)()
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
