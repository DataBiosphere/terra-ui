import { a, div, h, span } from 'react-hyperscript-helpers'
import { buttonPrimary, LabeledCheckbox, spinnerOverlay } from 'src/components/common'
import FreeTrialEulas from 'src/components/FreeTrialEulas'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { refreshTerraProfile } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import { freeCreditsActive } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


const FreeCreditsModal = Utils.connectAtom(freeCreditsActive, 'isActive')(class FreeCreditsModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      pageTwo: false,
      termsAgreed: false,
      cloudTermsAgreed: false,
      loading: false
    }
  }

  render() {
    const { isActive } = this.props
    const { pageTwo, termsAgreed, cloudTermsAgreed, loading } = this.state

    return isActive && h(Modal, {
      onDismiss: () => {
        this.setState({ pageTwo: false })
        FreeCreditsModal.dismiss()
      },
      title: 'Welcome to the Terra Free Credit Program!',
      width: '65%',
      okButton: pageTwo ? buttonPrimary({
        onClick: async () => {
          this.acceptCredits()
        },
        disabled: (termsAgreed === false) || (cloudTermsAgreed === false),
        tooltip: ((termsAgreed === false) || (cloudTermsAgreed === false)) && 'You must check the boxes to accept.'
      }, ['Accept']) : buttonPrimary({
        onClick: () => this.setState({ pageTwo: true })
      }, ['Review Terms of Service'])
    }, [
      h(FreeTrialEulas, { pageTwo }),
      pageTwo && div({
        style: {
          marginTop: '0.5rem',
          padding: '1rem',
          border: `1px solid ${colors.dark(0.5)}`,
          borderRadius: '0.25rem',
          backgroundColor: colors.dark(0.05)
        }
      }, [
        h(LabeledCheckbox, {
          checked: termsAgreed === true,
          onChange: v => this.setState({ termsAgreed: v })
        }, [span({ style: { marginLeft: '0.5rem' } }, ['I agree to the terms of this Agreement.'])]),
        div({
          style: {
            flexGrow: 1,
            marginBottom: '0.5rem'
          }
        }),
        h(LabeledCheckbox, {
          checked: cloudTermsAgreed === true,
          onChange: v => this.setState({ cloudTermsAgreed: v })
        }, [
          span({ style: { marginLeft: '0.5rem' } }, [
            'I agree to the Google Cloud Terms of Service.', div({ style: { marginLeft: '1.5rem' } }, [
              'Google Cloud Terms of Service:',
              a({
                style: {
                  textDecoration: 'underline',
                  marginLeft: '0.25rem'
                },
                href: 'https://cloud.google.com/terms/',
                ...Utils.newTabLinkProps
              }, ['https://cloud.google.com/terms/', icon('pop-out', { style: { marginLeft: '0.25rem' } })])
            ])
          ])
        ])
      ]),
      loading && spinnerOverlay
    ])
  }

  static dismiss() {
    freeCreditsActive.set(false)
  }

  async acceptCredits() {
    try {
      this.setState({ loading: true })
      await Ajax().User.acceptEula()
      await Ajax().User.startTrial()
      await refreshTerraProfile()
      FreeCreditsModal.dismiss()
    } catch (error) {
      reportError('Error starting trial', error)
    } finally {
      this.setState({ loading: false })
    }
  }
})

export default FreeCreditsModal
