import _ from 'lodash/fp'
import { forwardRef, useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import Modal from 'src/components/Modal'
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
  const Wrapper = forwardRef((props, ref) => {
    const [showModal, setShowModal] = useState(false)
    return showModal ?
      h(Modal, {
        title: 'Cannot access data',
        onDismiss: () => onDismiss(props),
        showCancel: false
      }, [
        'This data is in a requester pays bucket.'
      ]) :
      h(WrappedComponent, {
        ref, ...props,
        onRequesterPaysError: () => setShowModal(true)
      })
  })
  return Wrapper
}
