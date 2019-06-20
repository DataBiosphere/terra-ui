import * as _ from 'lodash/fp'
import { useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { buttonPrimary, link, Select, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { Ajax, useCancellation } from 'src/libs/ajax'
import { withErrorReporting } from 'src/libs/error'
import { RequiredFormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import { authStore, freeCreditsActive, workspaceStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


const RequesterPaysModal = ({ onDismiss, onSuccess }) => {
  const { profile } = Utils.useAtom(authStore)
  const { trialState } = profile
  const hasFreeCredits = trialState === 'Enabled'
  const [loading, setLoading] = useState(false)
  const [billingList, setBillingList] = useState([])
  const [selectedBilling, setSelectedBilling] = useState(workspaceStore.get().userProject)
  const signal = useCancellation()

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
      title: 'Cannot access data',
      onDismiss,
      showCancel: false,
      okButton: false
    }, [
      spinnerOverlay
    ])],
    [billingList.length > 0, () => h(Modal, {
      title: 'Cannot access data',
      onDismiss,
      shouldCloseOnOverlayClick: false,
      okButton: buttonPrimary({
        disabled: !selectedBilling,
        onClick: () => {
          onSuccess(selectedBilling)
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
      }),
      div({ style: { marginTop: '1rem' } }, [
        link({
          href: '', // add link to documentation
          ...Utils.newTabLinkProps
        }, ['Why is billing required for this workspace?', icon('pop-out', { style: { marginLeft: '0.25rem' }, size: 12 })])
      ])
    ])],
    [hasFreeCredits, () => h(Modal, {
      title: 'Cannot access data',
      onDismiss,
      okButton: buttonPrimary({
        onClick: () => {
          onDismiss()
          freeCreditsActive.set(true)
        }
      }, 'Get Free Credits')
    }, [
      div('To view or download data in this workspace, please set up a billing project.'),
      div([
        'You have $300 in',
        link({
          style: { marginLeft: '0.25rem' },
          href: 'https://support.terra.bio/hc/en-us/articles/360027940952',
          ...Utils.newTabLinkProps
        }, [
          'free credits', icon('pop-out', { style: { margin: '0 0.25rem' }, size: 12 })
        ]), 'available!'
      ]),
      div({ style: { marginTop: '1rem' } }, [
        link({
          href: '', // add link to documentation
          ...Utils.newTabLinkProps
        }, ['Why is billing required for this workspace?', icon('pop-out', { style: { marginLeft: '0.25rem' }, size: 12 })])
      ])
    ])],
    () => h(Modal, {
      title: 'Cannot access data',
      onDismiss,
      okButton: buttonPrimary({
        onClick: () => {
          Nav.goToPath('billing')
        }
      }, 'Go to Billing')
    }, [
      div('To view or download data in this workspace, please set up a billing project.'),
      div([
        link({
          href: '', // add link to documentation
          ...Utils.newTabLinkProps
        }, ['Why is billing required for this workspace?', icon('pop-out', { style: { marginLeft: '0.25rem' }, size: 12 })])
      ])
    ])
  )
}

export default RequesterPaysModal
