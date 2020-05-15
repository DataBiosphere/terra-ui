import _ from 'lodash/fp'
import { useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import RequesterPaysModal from 'src/components/RequesterPaysModal'
import { requesterPaysProjectStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


export const withRequesterPaysHandler = _.curry((handler, fn) => async (...args) => {
  try {
    return await fn(...args)
  } catch (error) {
    if (error.requesterPaysError) {
      handler()
      return Utils.abandonedPromise()
    } else {
      throw error
    }
  }
})

export const requesterPaysWrapper = ({ onDismiss }) => WrappedComponent => {
  return Utils.forwardRefWithName('requesterPaysWrapper', (props, ref) => {
    const [showModal, setShowModal] = useState(false)
    const [onSuccess, setOnSuccess] = useState(() => {})

    return Utils.cond(
      [showModal, () => h(RequesterPaysModal, {
        onDismiss: () => onDismiss(props),
        onSuccess: selectedBilling => {
          requesterPaysProjectStore.set(selectedBilling)
          setShowModal(false)
          onSuccess()
        }
      })],
      () => h(WrappedComponent, {
        ref, ...props,
        onRequesterPaysError: ({ onSuccess = () => {} }) => {
          setShowModal(true)
          setOnSuccess(onSuccess)
        }
      })
    )
  })
}
