import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { div, h, a, span } from 'react-hyperscript-helpers'
import { Clickable } from 'src/components/common'
import { icon } from 'src/components/icons'
import { withWorkspaces } from 'src/components/workspace-utils'
import { ajaxCaller } from 'src/libs/ajax'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import Modal from 'src/components/Modal'


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

  componentDidMount() {
    Utils.waitOneTick().then(() => this.setState({ show: this.props.isVisible }))
  }

  static getDerivedStateFromProps(props, state) {
    return _.isUndefined(state.show) ? null : { show: props.isVisible }
  }

  render() {
    const { showX, onDismiss, ...props } = _.omit('isVisible', this.props)
    const { show, accessingCredits } = this.state
    return div(_.merge({
      style: {
        display: 'flex', alignItems: 'center',
        transition: 'all 0.25s linear',
        transform: `translate(-50%, ${show ? '0px' : '-115%'})`,
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
        onDismiss: () => this.setState({ accessingCredits: false }),
        okButton: async () => this.acceptCredits()
      })
    ])
  }

  async acceptCredits() {
    const { ajax: { User } } = this.props
    try {
      await User.acceptEula()
    } catch (error) {
      this.setState({ error: await error.text() })
    }
  }
})
