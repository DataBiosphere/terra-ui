import _ from 'lodash/fp'
import { a, div, h, span } from 'react-hyperscript-helpers'
import { buttonPrimary, Clickable } from 'src/components/common'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { refreshTerraProfile } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import { getAppName } from 'src/libs/logos'
import { authStore, freeCreditsActive } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


const getMessages = () => {
  return {
    'Enabled': {
      'title': `Welcome to ${getAppName()}!`,
      'message': 'You have free compute and storage credits available to upload your data and launch analyses.',
      'isWarning': false,
      'enabledLink': {
        'label': 'Learn more',
        'url': 'https://support.terra.bio/hc/en-us/articles/360027940952'
      },
      'button': {
        'label': 'Start trial',
        'isExternal': false
      }
    },
    'Enrolled': {
      'title': 'Access Free Credits',
      'message': `You currently have access to your free credits. Learn how to use ${getAppName()}, about this free credit period, and transitioning to your own billing account once the free credits have expired.`,
      'isWarning': false,
      'button': {
        'label': 'Learn More',
        'url': 'https://support.terra.bio/hc/en-us/articles/360027940952',
        'isExternal': true
      }
    },
    'Terminated': {
      'title': 'Your free credits have expired',
      'message': 'Your data will be stored for 30 days from credit expiration date. Learn how you can create your own Google Billing Account and move your data to continue working.',
      'isWarning': true,
      'button': {
        'label': 'Learn more',
        'url': 'https://support.terra.bio/hc/en-us/articles/360027940952',
        'isExternal': true
      }
    }
  }
}


export const TrialBanner = Utils.connectAtom(authStore, 'authState')(class TrialBanner extends Component {
  constructor(props) {
    super(props)
    this.state = {
      finalizeTrial: false
    }
  }

  render() {
    const { authState: { isSignedIn, profile, acceptedTos } } = _.omit('isVisible', this.props)
    const { finalizeTrial } = this.state
    const { trialState } = profile
    const removeBanner = localStorage.getItem('removeBanner')
    if (!trialState || !isSignedIn || !acceptedTos || trialState === 'Finalized' || removeBanner === 'true') return null
    const { [trialState]: { title, message, enabledLink, button, isWarning } } = getMessages()
    return div([
      div({
        style: {
          display: 'flex', alignItems: 'center', padding: '1.5rem', height: 95,
          backgroundColor: isWarning ? colors.warning() : '#359448',
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
              ...Utils.newTabLinkProps,
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
              await Ajax().User.finalizeTrial()
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
