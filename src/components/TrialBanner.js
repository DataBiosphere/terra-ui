import _ from 'lodash/fp'
import { div, h, a, span } from 'react-hyperscript-helpers'
import { authStore, refreshTerraProfile } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { buttonPrimary, Clickable, LabeledCheckbox, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { ajaxCaller } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import Modal from 'src/components/Modal'
import FreeTrialEulas from 'src/components/FreeTrialEulas'


export const freeCreditsActive = Utils.atom(false)

const messages =
  {
    'Enabled': {
      'title': 'Welcome to Terra!',
      'message': 'You have free compute and storage credits available to upload your data and launch analyses.',
      'isWarning': false,
      'enabledLink': {
        'label': 'Learn more',
        'url': 'https://broadinstitute.zendesk.com/hc/en-us/articles/360022704371-Getting-started-with-Terra#free-credits-signup'
      },
      'button': {
        'label': 'Start trial',
        'isExternal': false
      }
    },
    'Enrolled': {
      'title': 'Access Free Credits',
      'message': 'You currently have access to your free credits. Learn how to use Terra, about this free credit period, and transitioning to your own billing account once the free credits have expired.',
      'isWarning': false,
      'button': {
        'label': 'Learn More',
        'url': 'https://broadinstitute.zendesk.com/hc/en-us/articles/360022704371-Getting-started-with-Terra#free-credits-signup',
        'isExternal': true
      }
    },
    'Terminated': {
      'title': 'Your free credits have expired',
      'message': 'Your data will be stored for 30 days from credit expiration date. Learn how you can create your own Google Billing Account and move your data to continue working.',
      'isWarning': true,
      'button': {
        'label': 'Learn more',
        'url': 'https://broadinstitute.zendesk.com/hc/en-us/articles/360026182251-Billing-Projects-Google-Billing-Accounts-and-Free-Credits#free-credits',
        'isExternal': true
      }
    }
  }

const FreeCreditsModal = ajaxCaller(class FreeCreditsModal extends Component {
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
    const { pageTwo, termsAgreed, cloudTermsAgreed, loading } = this.state
    return h(Modal, {
      onDismiss: () => FreeCreditsModal.dismiss(),
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
          border: `1px solid ${colors.green[0]}`,
          borderRadius: '0.25rem',
          backgroundColor: '#f4f4f4'
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
                target: '_blank',
                href: 'https://cloud.google.com/terms/'
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
    const { ajax: { User } } = this.props
    try {
      this.setState({ loading: true })
      await User.acceptEula()
      await User.startTrial()
      await refreshTerraProfile()
      FreeCreditsModal.dismiss()
    } catch (error) {
      reportError('Error starting trial', error)
    } finally {
      this.setState({ loading: false })
    }
  }
})

export const TrialBanner = _.flow(
  ajaxCaller,
  Utils.connectAtom(freeCreditsActive, 'isActive'),
  Utils.connectAtom(authStore, 'authState')
)(class TrialBanner extends Component {
  constructor(props) {
    super(props)
    this.state = {
      finalizeTrial: false
    }
  }

  render() {
    const { authState: { isSignedIn, profile, acceptedTos }, ajax: { User }, isActive } = _.omit('isVisible', this.props)
    const { finalizeTrial } = this.state
    const { trialState } = profile
    const removeBanner = localStorage.getItem('removeBanner')
    if (isActive) return h(FreeCreditsModal)
    if (!trialState || !isSignedIn || !acceptedTos || trialState === 'Finalized' || removeBanner === 'true') return null
    const { [trialState]: { title, message, enabledLink, button, isWarning } } = messages
    return div([
      div({
        style: {
          display: 'flex', alignItems: 'center', padding: '1.5rem', height: 110,
          backgroundColor: isWarning ? colors.orange[0] : '#359448',
          justifyContent: 'center', color: 'white', width: '100%', fontSize: '1rem'
        }
      },
      [
        div({
          style: {
            fontSize: '1.5rem', fontWeight: 500, textAlign: 'right', borderRight: '1px solid', paddingRight: '1rem', marginRight: '1rem',
            maxWidth: 200, flexShrink: 0
          }
        }, title),
        span({ style: { maxWidth: 600, lineHeight: '1.5rem' } },
          [
            message,
            enabledLink && a({
              style: { textDecoration: 'underline', marginLeft: '0.5rem' },
              target: '_blank',
              href: enabledLink.url
            }, [enabledLink.label, icon('pop-out', { style: { marginLeft: '0.25rem' } })])
          ]),
        h(Clickable, {
          style: {
            fontWeight: 500, fontSize: '1.125rem', border: '2px solid', borderRadius: '0.25rem', padding: '0.5rem 1rem',
            marginLeft: '0.5rem', flexShrink: 0
          },
          onClick: () => {
            button.isExternal ? window.open(button.url, '_blank') : freeCreditsActive.set(true)
          }
        }, [button.label, button.isExternal ? icon('pop-out', { style: { marginLeft: '0.25rem' } }) : null]),
        div({
          style: {
            marginLeft: '3rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end'
          }
        }, [
          h(Clickable, {
            style: { borderBottom: 'none' },
            tooltip: 'Hide banner',
            onClick: trialState === 'Terminated' ? () => this.setState({ finalizeTrial: true }) : () => {
              localStorage.setItem('removeBanner', 'true')
              this.forceUpdate()
            }
          }, [icon('times-circle', { size: 25, style: { fontSize: '1.5rem', cursor: 'pointer' } })])
        ])
      ]),
      finalizeTrial && h(Modal, {
        title: 'Remove banner',
        onDismiss: () => this.setState({ finalizeTrial: false }),
        okButton: buttonPrimary({
          onClick: async () => {
            try {
              await User.finalizeTrial()
              await refreshTerraProfile()
            } catch (error) {
              reportError('Error finalizing trial', error)
            } finally {
              this.setState({ finalizeTrial: false })
            }
          }
        }, ['Confirm'])
      }, ['Click confirm to remove banner forever.'])
    ])
  }
})
