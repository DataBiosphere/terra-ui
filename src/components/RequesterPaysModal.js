import { div, h } from 'react-hyperscript-helpers'
import { buttonPrimary, link, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import * as Nav from 'src/libs/nav'
import { authStore, freeCreditsActive } from 'src/libs/state'
import { Component } from 'src/libs/wrapped-components'
import * as Utils from 'src/libs/utils'


export default Utils.connectAtom(authStore, 'authState')(class RequesterPaysModal extends Component {
  render() {
    const { authState: { profile } } = this.props
    const { trialState } = profile
    const hasFreeCredits = trialState === 'Enabled'
    const loading = false
    const onDismiss = this.props

    return Utils.cond(
      [loading, spinnerOverlay],
      [hasFreeCredits, () => h(Modal, {
        title: 'Set up Billing',
        onDismiss,
        showCancel: false,
        okButton: buttonPrimary({
          onClick: () => {
            //onDismiss()
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
        title: 'Set up Billing',
        onDismiss,
        showCancel: false,
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
})
