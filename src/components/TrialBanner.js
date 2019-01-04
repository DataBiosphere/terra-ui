import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { div, h, a, span } from 'react-hyperscript-helpers'
import colors from 'src/libs/colors'
import { buttonPrimary, Clickable, LabeledCheckbox, link } from 'src/components/common'
import { icon } from 'src/components/icons'
import { withWorkspaces } from 'src/components/workspace-utils'
import { ajaxCaller } from 'src/libs/ajax'
import { Component } from 'src/libs/wrapped-components'
import Modal from 'src/components/Modal'
import FreeTrialEulas from 'src/pages/FreeTrialEulas'


export default _.flow(
  ajaxCaller,
  withWorkspaces()
)(class TrialBanner extends Component {
  static propTypes = {
    isVisible: PropTypes.bool,
    showX: PropTypes.bool,
    onDismiss: PropTypes.func
  }

  static defaultProps = {
    isVisible: true,
    showX: true,
    onDismiss: _.noop
  }

  constructor(props) {
    super(props)
    this.state = {
      accessingCredits: false,
      pageTwo: false,
      show: true,
      termsAgreed: 'false',
      cloudTermsAgreed: 'false'
    }
  }

  componentDidMount() {
    this.setState({ show: this.props.isVisible })
  }

  render() {
    const { showX, onDismiss, ...props } = _.omit('isVisible', this.props)
    const { show, accessingCredits, pageTwo, termsAgreed, cloudTermsAgreed } = this.state
    console.log({ termsAgreed, cloudTermsAgreed })
    return div(_.merge({
      style: {
        display: 'flex', alignItems: 'center',
        transition: 'all 0.25s linear',
        transform: `translate(-50%, ${show ? '0px' : '-150%'})`,
        position: 'fixed', top: 0, left: '50%',
        width: '100%',
        maxWidth: '100%',
        backgroundColor: '#359448',
        color: 'white', fontSize: '1rem',
        borderRadius: '0 0 4px 4px'
      }
    },
    props), [
      div({ style: { flex: 1, display: 'flex', alignItems: 'center', padding: '1rem', justifyContent: 'center' } },
        [
          div({
            style: {
              fontSize: '1.5rem', fontWeight: 500, textAlign: 'right', borderRight: '1px solid', paddingRight: '1rem', marginRight: '1rem',
              maxWidth: 200, flexShrink: 0
            }
          }, 'Welcome to Terra!'),
          span({ style: { maxWidth: 600, lineHeight: '1.5rem' } },
            [
              'You have free compute and storage credits available to upload your data and launch analyses.',
              a({
                style: { textDecoration: 'underline', marginLeft: '0.5rem' },
                target: 'blank',
                href: 'https://software.broadinstitute.org/firecloud/documentation/freecredits'
              }, ['Learn more', icon('pop-out', { style: { marginLeft: '0.25rem' } })])
            ]),
          h(Clickable, {
            style: {
              display: 'block', fontWeight: 500, fontSize: '1.125rem', border: '2px solid', borderRadius: '0.25rem', padding: '0.5rem 1rem',
              marginLeft: '0.5rem', flexShrink: 0
            },
            onClick: () => {
              this.setState({ accessingCredits: true })
            }
          }, ['Start Trial'])
        ]),
      showX && h(Clickable, {
        style: { marginRight: '1.5rem' },
        tooltip: 'Hide for now',
        onClick: () => {
          this.setState({ show: false })
          onDismiss()
        }
      }, [icon('times', { size: 25, style: { stroke: 'white', strokeWidth: 3 } })]),
      accessingCredits && h(Modal, {
        title: 'Welcome to the Terra Free Credit Program!',
        width: 900,
        onDismiss: () => this.setState({ accessingCredits: false, pageTwo: false }),
        okButton: buttonPrimary({
          onClick: pageTwo ? async () => this.acceptCredits() : () => this.setState({ pageTwo: true }),
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
                link({
                  style: { textDecoration: 'underline', marginLeft: '0.25rem' },
                  target: 'blank',
                  href: 'https://cloud.google.com/terms/'
                }, ['https://cloud.google.com/terms/', icon('pop-out', { style: { marginLeft: '0.25rem' } })])
              ])
            ])
          ])
        ])
      ])
    ])
  }

  async acceptCredits() {
    const { ajax: { User } } = this.props
    try {
      await User.acceptEula()
      await User.startTrial()
    } catch (error) {
      this.setState({ error: await error.text() })
    }
  }
})
