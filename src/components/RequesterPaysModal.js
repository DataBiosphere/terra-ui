import { div, h } from 'react-hyperscript-helpers'
import { buttonPrimary, link, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import colors from 'src/libs/colors'
import * as Nav from 'src/libs/nav'
import { freeCreditsActive } from 'src/libs/state'
import { Component } from 'src/libs/wrapped-components'
import * as Utils from 'src/libs/utils'


const requesterPaysMessage = div({ style: { color: colors.warning() } }, [
  icon('error-standard', { size: 16, style: { marginRight: '0.5rem' } }),
  'You need a billing project to interact with this workspace because the Google Cloud storage has requester pays enabled. ',
  link({
    href: '', // add link to documentation
    ...Utils.newTabLinkProps
  }, 'Click here for information on Requester Pays.')
])

export default class RequesterPaysModal extends Component {
  render() {
    const hasFreeCredits = true
    const loading = false

    return Utils.cond(
      [loading, spinnerOverlay],
      [hasFreeCredits, () => h(Modal, {
        title: 'Set up Billing',
        //onDismiss,
        showCancel: false,
        okButton: buttonPrimary({
          onClick: () => {
            //onDismiss()
            freeCreditsActive.set(true)
          }
        }, 'Get Free Credits')
      }, [
        div({ style: { marginTop: '0.5rem', fontWeight: 500, marginBottom: '0.5rem' } }, [
          requesterPaysMessage,
          'You have $300 in ',
          link({
            href: 'https://support.terra.bio/hc/en-us/articles/360027940952',
            ...Utils.newTabLinkProps
          }, 'free credits'), ' available!'
        ])
      ])],
      () => h(Modal, {
        title: 'Set up Billing',
        showCancel: false,
        //onDismiss,
        okButton: buttonPrimary({
          onClick: () => Nav.goToPath('billing')
        }, 'Go to Billing')
      }, [requesterPaysMessage])
    )
  }
}
