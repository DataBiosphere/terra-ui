import _ from 'lodash/fp'
import { div } from 'react-hyperscript-helpers'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


/**
 * @param props
 * @param {bool} props.isVisible
 */
export default class CornerBanner extends Component {
  componentDidMount() {
    Utils.waitOneTick().then(() => this.setState({ show: !!this.props.isVisible }), 0)
  }

  static getDerivedStateFromProps(props, state) {
    return _.isUndefined(state.show) ? null : { show: !!props.isVisible }
  }

  render() {
    const { children, ...props } = _.omit('isVisible', this.props)
    const { show } = this.state

    return div(_.merge({
      style: {
        transition: 'all 0.25s linear',
        transform: `translate(0px, ${show ? '-100%' : '0px'})`,
        position: 'fixed', top: '100%', right: 0,
        minWidth: 450, maxWidth: '100%',
        padding: '1rem', backgroundColor: Style.colors.accent,
        borderRadius: '1rem 0 0',
        color: 'white', fontSize: '1rem'
      }
    },
    props), children)
  }
}
