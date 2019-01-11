import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { div, h, a, span } from 'react-hyperscript-helpers'
import { authStore, refreshTerraProfile } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { buttonPrimary, Clickable, LabeledCheckbox } from 'src/components/common'
import { icon, spinner } from 'src/components/icons'
import { ajaxCaller } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import Modal from 'src/components/Modal'
import FreeTrialEulas from 'src/components/FreeTrialEulas'


export const TrialBanner = _.flow(
  ajaxCaller,
  Utils.connectAtom(authStore, 'authState')
)(class TrialBanner extends Component {
  static propTypes = {
    children: PropTypes.node
  }

  constructor(props) {
    super(props)
    this.state = {
      accessingCredits: false,
      pageTwo: false,
      termsAgreed: 'false',
      cloudTermsAgreed: 'false',
      show: true
    }
  }

  async componentDidMount() {
    try {
      const res = await fetch('trial.json')
      this.setState({ messages: await res.json() })
    } catch (error) {
      reportError('Error loading user information', error)
    }
  }

  render() {
    const { children, authState: { isSignedIn, profile }, ajax: { User } } = _.omit('isVisible', this.props)
    const { accessingCredits, pageTwo, termsAgreed, cloudTermsAgreed, messages, loading, show } = this.state
    const { trialState } = profile
    if (!messages || !trialState || !isSignedIn || trialState === 'Finalized' || !show) return null
    const { [trialState]: { title, message, enabledLink, button, isWarning } } = messages

    const freeCreditModal = h(Modal, {
      title: 'Welcome to the Terra Free Credit Program!',
      width: '65%',
      onDismiss: () => this.setState({ accessingCredits: false, pageTwo: false }),
      okButton: buttonPrimary({
        onClick: pageTwo ? async () => {
          this.acceptCredits()
          this.setState({ accessingCredits: false })
        } : () => this.setState({ pageTwo: true }),
        disabled: pageTwo ? (termsAgreed === 'false') || (cloudTermsAgreed === 'false') : false,
        tooltip: (pageTwo && ((termsAgreed === 'false') || (cloudTermsAgreed === 'false'))) && 'You must check the boxes to accept.'
      }, [pageTwo ? 'Accept' : 'Review Terms of Service'])
    }, [
      h(FreeTrialEulas, { pageTwo }),
      pageTwo && div({ style: { marginTop: '0.5rem', padding: '1rem', border: `1px solid ${colors.blue[0]}`, borderRadius: '0.25rem', backgroundColor: '#f4f4f4' } }, [
        h(LabeledCheckbox, {
          checked: termsAgreed === 'true',
          onChange: v => this.setState({ termsAgreed: v.toString() })
        }, [span({ style: { marginLeft: '0.5rem' } }, ['I agree to the terms of this Agreement.'])]),
        div({ style: { flexGrow: 1, marginBottom: '0.5rem' } }),
        h(LabeledCheckbox, {
          checked: cloudTermsAgreed === 'true',
          onChange: v => this.setState({ cloudTermsAgreed: v.toString() })
        }, [
          span({ style: { marginLeft: '0.5rem' } }, [
            'I agree to the Google Cloud Terms of Service.', div({ style: { marginLeft: '1.5rem' } }, [
              'Google Cloud Terms of Service:',
              a({
                style: { textDecoration: 'underline', marginLeft: '0.25rem' },
                target: 'blank',
                href: 'https://cloud.google.com/terms/'
              }, ['https://cloud.google.com/terms/', icon('pop-out', { style: { marginLeft: '0.25rem' } })])
            ])
          ])
        ])
      ])
    ])

    return div([
      div({
        style: {
          flex: 1, display: 'flex', alignItems: 'center', padding: '1.5rem', height: 110,
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
              target: 'blank',
              href: enabledLink.url
            }, [enabledLink.label, icon('pop-out', { style: { marginLeft: '0.25rem' } })])
          ]),
        h(Clickable, {
          style: {
            display: 'block', fontWeight: 500, fontSize: '1.125rem', border: '2px solid', borderRadius: '0.25rem', padding: '0.5rem 1rem',
            marginLeft: '0.5rem', flexShrink: 0
          },
          onClick: () => {
            button.isExternal ? window.open(button.url, '_blank') : this.setState({ accessingCredits: true })
          }
        }, [
          loading ? spinner({ style: { fontSize: '1rem', color: 'white' } }) : button.label,
          button.isExternal ? icon('pop-out', { style: { marginLeft: '0.25rem' } }) : null
        ]),
        div({ style: { marginLeft: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' } }, [
          h(Clickable, {
            style: { borderBottom: 'none' },
            tooltip: 'Hide for now',
            onClick: () => this.setState({ show: false })
          }, [icon('times-circle', { size: 25, style: { fontSize: '1.5rem', cursor: 'pointer', strokeWidth: 1.5 } })]),
          (trialState === 'Terminated') && h(Clickable, {
            style: { margin: '0.5rem -0.75rem -1.5rem', fontSize: 'small' },
            onClick: async () => await User.finalizeTrial()
          }, 'or hide forever?')
        ])
      ]),
      children,
      accessingCredits && freeCreditModal
    ])
  }

  async acceptCredits() {
    const { ajax: { User } } = this.props
    try {
      this.setState({ loading: true })
      await User.acceptEula()
      await User.startTrial()
      await refreshTerraProfile()
    } catch (error) {
      reportError('Error starting trial', error)
    } finally {
      this.setState({ loading: false })
    }
  }
})
