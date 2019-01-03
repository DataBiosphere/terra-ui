import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { div, h, a } from 'react-hyperscript-helpers'
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
      div({ style: { flex: 1, display: 'flex', alignItems: 'center', padding: '1rem 5rem 1rem 5rem' } },
        [
          div({ style: { fontSize: 25, borderRight: '1px solid', marginRight: '1rem', paddingRight: '1rem', padding: '1rem' } }, 'Welcome to Terra!'),
          ' You have free compute and storage credits available to upload your data and launch analyses. ',
          a({
            style: { textDecoration: 'underline', marginLeft: '0.5rem' },
            target: 'blank',
            href: 'https://software.broadinstitute.org/firecloud/documentation/freecredits'
          }, ['Learn more', icon('pop-out', { style: { marginLeft: '0.25rem' } })]),
          h(Clickable, {
            style: { marginLeft: '2rem', marginRight: '0.1rem', border: '1px solid', padding: '0.5rem', borderRadius: '0.5rem' },
            onClick: () => {
              this.setState({ accessingCredits: true })
            }
          }, ['Start Trial'])
        ]),
      showX && h(Clickable, {
        style: { padding: '1rem', marginRight: '3rem' },
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
