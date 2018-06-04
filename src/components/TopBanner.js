import _ from 'lodash/fp'
import { div, h } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import { icon } from 'src/components/icons'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


/**
 * @param {bool} isVisible
 * @param {bool} [showX=true]
 * @param {function} [onDismiss]
 */
export default class TopBanner extends Component {
  componentDidMount() {
    Utils.waitOneTick().then(() => this.setState({ show: this.props.isVisible }), 0)
  }

  static getDerivedStateFromProps(props, state) {
    return _.isUndefined(state.show) ? null : { show: props.isVisible }
  }

  render() {
    const { showX = true, children, onDismiss, ...props } = _.omit('isVisible', this.props)
    const { show } = this.state

    return div(_.merge({
      style: {
        display: 'flex', alignItems: 'center',
        transition: 'all 0.25s linear',
        transform: `translate(0px, ${show ? '0px' : '-100%'})`,
        position: 'fixed', top: 0,
        width: '100%',
        padding: '1rem', backgroundColor: Style.colors.accent,
        color: 'white', fontSize: '1rem'
      }
    },
    props), [
      children,
      showX && div({ style: { flex: 1 } }),
      showX && h(Interactive, {
        as: icon('times-circle', { size: 20 }),
        title: 'Hide banner',
        onClick: () => {
          this.setState({ show: false })
          onDismiss && onDismiss()
        }
      })
    ])
  }
}
