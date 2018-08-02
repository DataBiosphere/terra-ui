import _ from 'lodash/fp'
import { div, h } from 'react-hyperscript-helpers'
import { Clickable } from 'src/components/common'
import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


/**
 * @param {bool} isVisible
 * @param {bool} [showX=true]
 * @param {function} [onDismiss]
 */
export default class TopBanner extends Component {
  componentDidMount() {
    Utils.waitOneTick().then(() => this.setState({ show: this.props.isVisible }))
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
        padding: '1rem', backgroundColor: colors.purple[0],
        color: 'white', fontSize: '1rem'
      }
    },
    props), [
      div({ style: { flex: 1, display: 'flex', alignItems: 'center' } },
        children),
      showX && h(Clickable, {
        style: { marginLeft: '1rem' },
        title: 'Hide banner',
        onClick: () => {
          this.setState({ show: false })
          onDismiss && onDismiss()
        }
      }, [icon('times-circle', { size: 20 })])
    ])
  }
}
