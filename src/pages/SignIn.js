import { Component, Fragment } from 'react'
import { div, h, p } from 'react-hyperscript-helpers'
import { Clickable, HeroWrapper, Link } from 'src/components/common'
import Modal from 'src/components/Modal'
import SignInButton from 'src/components/SignInButton'
import colors from 'src/libs/colors'
import { isFirecloud } from 'src/libs/config'
import { getAppName } from 'src/libs/logos'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


export class CookiesModal extends Component {
  render() {
    const { onDismiss } = this.props
    return h(Modal, {
      showCancel: false,
      onDismiss
    }, [
      `${getAppName()} uses cookies to enable sign on and other essential features when signed in, and to provide statistics to our development team regarding how the site is used. For more information, see our `,
      h(Link, {
        ...Utils.newTabLinkProps,
        href: Nav.getLink('privacy')
      }, ['privacy policy.'])
    ])
  }
}

export default class SignIn extends Component {
  constructor(props) {
    super(props)
    this.state = { openCookiesModal: false }
  }

  render() {
    const { openCookiesModal } = this.state
    return h(HeroWrapper, { showMenu: false }, [
      div({ style: { maxWidth: 600 } }, [
        div({ style: { fontSize: 36, color: colors.dark(0.6) } }, ['New User?']),
        div({ style: { fontSize: 36, marginBottom: '2rem' } }, [`${getAppName()} requires a Google Account.`]),
        div({ style: { fontSize: 16, lineHeight: 1.5, marginBottom: '2rem' } }, [
          `${getAppName()} uses your Google account. Once you have signed in and completed the user profile registration step, you can start using ${getAppName()}.`
        ]),
        h(SignInButton),
        h(Clickable, {
          style: { color: colors.accent(), marginTop: '1rem' },
          onClick: () => this.setState({ openCookiesModal: true })
        }, ['Cookies policy']),
        div({ style: { lineHeight: 1.5, marginTop: '2rem', paddingTop: '1rem', borderTop: Style.standardLine } }, [
          div({ style: { fontWeight: 500 } }, ['WARNING NOTICE']),
          p([`
            By continuing to log in, you acknowledge that you are accessing a US Government web site 
            which may contain information that must be protected under the US Privacy Act or other 
            sensitive information and is intended for Government authorized use only.
            `]),
          p([`
              Unauthorized attempts to upload information, change information, or use of this web site
              may result in disciplinary action, civil, and/or criminal penalties. Unauthorized users
              of this website should have no expectation of privacy regarding any communications or
              data processed by this website.'
            `]),
          p([`
              Anyone accessing this website expressly consents to monitoring of their actions and all
              communications or data transiting or stored on related to this website and is advised
              that if such monitoring reveals possible evidence of criminal activity, NIH may provide
              that evidence to law enforcement officials.
            `]),
          isFirecloud() && h(Fragment, [
            div({ style: { fontWeight: 500 } }, ['WARNING NOTICE (when accessing TCGA controlled data)']),
            p([
              'You are reminded that when accessing TCGA controlled access information you are bound by the dbGaP TCGA ',
              h(Link, {
                ...Utils.newTabLinkProps,
                href: 'https://www.cancer.gov/about-nci/organization/ccg/research/structural-genomics/tcga/history/policies/tcga-data-use-certification-agreement.pdf'
              }, ['DATA USE CERTIFICATION AGREEMENT (DUCA)'])
            ])
          ])
        ]),
        openCookiesModal && h(CookiesModal, {
          onDismiss: () => this.setState({ openCookiesModal: false })
        })
      ])
    ])
  }
}
