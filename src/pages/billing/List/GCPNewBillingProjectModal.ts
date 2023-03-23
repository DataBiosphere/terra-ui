import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, Link, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportErrorAndRethrow } from 'src/libs/error'
import { getUser } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import { billingProjectNameValidator } from 'src/pages/billing/billing-utils'
import CreateGCPBillingProject from 'src/pages/billing/CreateGCPBillingProject'
import { GoogleBillingAccount } from 'src/pages/billing/models/GoogleBillingAccount'
import { validate } from 'validate.js'


interface GCPNewBillingProjectModalProps {
  billingAccounts: Record<string, GoogleBillingAccount>
  onSuccess: (string) => void
  onDismiss: () => void
  loadAccounts: () => void
}

export const GCPNewBillingProjectModal = (props: GCPNewBillingProjectModalProps) => {
  const [billingProjectName, setBillingProjectName] = useState('')
  const [existing, setExisting] = useState<string[]>([])
  const [isBusy, setIsBusy] = useState(false)
  const [chosenBillingAccount, setChosenBillingAccount] = useState<GoogleBillingAccount>()

  const submit = _.flow(
    reportErrorAndRethrow('Error creating billing project'),
    Utils.withBusyState(setIsBusy)
  )(async () => {
    try {
      await Ajax().Billing.createGCPProject(billingProjectName, chosenBillingAccount?.accountName)
      props.onSuccess(billingProjectName)
    } catch (error: any) {
      if (error?.status === 409) {
        setExisting(_.concat(billingProjectName, existing))
      } else {
        throw error
      }
    }
  })

  const errors = validate({ billingProjectName }, { billingProjectName: billingProjectNameValidator(existing) })
  const billingLoadedAndEmpty = props.billingAccounts && _.isEmpty(props.billingAccounts)
  const billingPresent = !_.isEmpty(props.billingAccounts)

  return h(Modal, {
    onDismiss: props.onDismiss,
    shouldCloseOnOverlayClick: false,
    title: 'Create Terra Billing Project',
    showCancel: !billingLoadedAndEmpty,
    showButtons: !!props.billingAccounts,
    okButton: billingPresent ?
      h(ButtonPrimary, {
        disabled: errors || !chosenBillingAccount || !chosenBillingAccount.firecloudHasAccess,
        onClick: submit
      }, ['Create']) :
      h(ButtonPrimary, {
        onClick: props.onDismiss
      }, ['Ok'])
  }, [
    billingLoadedAndEmpty && h(Fragment, [
      'You don\'t have access to any billing accounts.  ',
      h(Link, {
        href: 'https://support.terra.bio/hc/en-us/articles/360026182251',
        ...Utils.newTabLinkProps
      }, ['Learn how to create a billing account.', icon('pop-out', { size: 12, style: { marginLeft: '0.5rem' } })])
    ]),
    billingPresent && h(Fragment, [
      CreateGCPBillingProject({
        billingAccounts: props.billingAccounts,
        chosenBillingAccount, setChosenBillingAccount,
        billingProjectName, setBillingProjectName, existing
      }),
      !!chosenBillingAccount && !chosenBillingAccount.firecloudHasAccess && div({ style: { fontWeight: 500, fontSize: 13 } }, [
        div({ style: { margin: '0.25rem 0 0.25rem 0', color: colors.danger() } },
          ['Terra does not have access to this account. ']),
        div({ style: { marginBottom: '0.25rem' } }, ['To grant access, add ', span({ style: { fontWeight: 'bold' } }, ['terra-billing@terra.bio']),
          ' as a ', span({ style: { fontWeight: 'bold' } }, ['Billing Account User']), ' on the ',
          h(Link, {
            href: `https://console.cloud.google.com/billing/${chosenBillingAccount.accountName.split('/')[1]}?authuser=${getUser().email}`,
            ...Utils.newTabLinkProps
          }, ['Google Cloud Console', icon('pop-out', { style: { marginLeft: '0.25rem' }, size: 12 })])]),
        div({ style: { marginBottom: '0.25rem' } }, ['Then, ',
          h(Link, { onClick: props.loadAccounts }, ['click here']), ' to refresh your billing accounts.']),
        div({ style: { marginTop: '0.5rem' } }, [
          h(Link, {
            href: 'https://support.terra.bio/hc/en-us/articles/360026182251',
            ...Utils.newTabLinkProps
          }, ['Need help?', icon('pop-out', { style: { marginLeft: '0.25rem' }, size: 12 })])
        ])
      ])
    ]),
    (isBusy || !props.billingAccounts) && spinnerOverlay
  ])
}
