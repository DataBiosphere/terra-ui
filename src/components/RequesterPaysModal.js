import * as _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer, Link, Select, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { withErrorReporting } from 'src/libs/error'
import { FormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import { requesterPaysProjectStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


const billingHelpInfo = div({ style: { paddingTop: '1rem' } }, [
  h(Link, {
    href: 'https://support.terra.bio/hc/en-us/articles/360029801491',
    ...Utils.newTabLinkProps
  }, ['Why is billing required to access this data?', icon('pop-out', { style: { marginLeft: '0.25rem' }, size: 12 })])
])

const RequesterPaysModal = ({ onDismiss, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [billingList, setBillingList] = useState([])
  const [selectedBilling, setSelectedBilling] = useState(requesterPaysProjectStore.get())
  const signal = Utils.useCancellation()

  Utils.useOnMount(() => {
    const loadBillingProjects = _.flow(
      Utils.withBusyState(setLoading),
      withErrorReporting('Error loading billing projects')
    )(async () => {
      setBillingList(await Ajax(signal).Billing.listProjects())
    })
    loadBillingProjects()
  })

  return Utils.cond(
    [loading, () => h(Modal, {
      title: 'Loading',
      onDismiss,
      showCancel: false,
      okButton: false
    }, [
      spinnerOverlay
    ])],
    [billingList.length > 0, () => h(Modal, {
      title: 'Choose a billing project',
      onDismiss,
      shouldCloseOnOverlayClick: false,
      okButton: h(ButtonPrimary, {
        disabled: !selectedBilling,
        onClick: () => {
          onSuccess(selectedBilling)
        }
      }, ['Ok'])
    }, [
      'This data is in a requester pays bucket. Choose a billing project to continue:',
      h(IdContainer, [id => h(Fragment, [
        h(FormLabel, { htmlFor: id, required: true }, ['Billing Project']),
        h(Select, {
          id,
          isClearable: false,
          value: selectedBilling,
          placeholder: 'Select a billing project',
          onChange: ({ value }) => setSelectedBilling(value),
          options: _.uniq(_.map('projectName', billingList)).sort()
        }),
        billingHelpInfo
      ])])
    ])],
    () => h(Modal, {
      title: 'Cannot access data',
      onDismiss,
      okButton: h(ButtonPrimary, {
        onClick: () => {
          Nav.goToPath('billing')
        }
      }, 'Go to Billing')
    }, [
      div('To view or download data in this workspace, please set up a billing project.'),
      billingHelpInfo
    ])
  )
}

export default RequesterPaysModal
