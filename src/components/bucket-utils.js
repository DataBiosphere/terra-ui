import _ from 'lodash/fp'
import { forwardRef, useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import Modal from 'src/components/Modal'
import * as Utils from 'src/libs/utils'
import { workspaceStore } from 'src/libs/state'
import { RequiredFormLabel } from 'src/libs/forms'
import { Select, buttonPrimary } from 'src/components/common'
import { Ajax, useCancellation } from 'src/libs/ajax'

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
    const [billingList, setBillingList] = useState([])
    const [selectedBilling, setSelectedBilling] = useState(workspaceStore.get().userProject)
    const signal = useCancellation()

    return Utils.cond(
      // This is where the free credits modal will be used: SATURN-862
      [showModal && billingList.length === 0, h(Modal, {
        title: 'Cannot access data',
        showCancel: false,
        okButton: () => onDismiss()
      }, [
        'This data is in a requester pays bucket and there are no billing projects setup to bill to.'
      ])],
      [showModal && billingList.length > 0,  h(Modal, {
        title: 'Cannot access data',
        onDismiss: () => onDismiss(props),
        shouldCloseOnOverlayClick: false,
        showCancel: true,
        okButton: buttonPrimary({
          disabled: !selectedBilling,
          onClick: () => {
            workspaceStore.set({ userProject: selectedBilling, ...workspaceStore.get() })
            setShowModal(false)
          }
        }, ['Ok'])
      }, [
        'This data is in a requester pays bucket. Choose a billing project to continue:',
        h(RequiredFormLabel, ['Billing Project']),
        h(Select, {
          isClearable: false,
          value: selectedBilling,
          placeholder: 'Select a billing project',
          onChange: ({ value }) => setSelectedBilling(value),
          options: _.uniq(_.map('projectName', billingList)).sort()
        })
      ])],
      [!showModal, h(WrappedComponent, {
        ref, ...props,
        onRequesterPaysError: async () => {
          setBillingList(await Ajax(signal).Billing.listProjects())
          return setShowModal(true)
        }
      })]
    )
  })
  return Wrapper
}
