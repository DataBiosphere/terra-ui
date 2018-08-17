import _ from 'lodash/fp'
import { Collapse as rCollapse } from 'react-collapse'
import { div, h } from 'react-hyperscript-helpers'
import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'
import { Component } from 'src/libs/wrapped-components'


/**
 * @param {boolean} [defaultHidden=false]
 * @param {boolean} [showIcon=true]
 * @param {boolean} [animate=false]
 * @param {boolean} [expandTitle=false]
 * @param title
 * @param [buttonStyle]
 * @param children
 */
export default class Collapse extends Component {
  constructor(props) {
    super(props)
    this.state = { isOpened: !props.defaultHidden }
  }

  render() {
    const { title, showIcon = true, animate, expandTitle, buttonStyle, children, ...props } = _.omit('defaultHidden', this.props)
    const { isOpened } = this.state

    return div(props, [
      div(
        {
          style: { display: 'flex', cursor: 'pointer', alignItems: 'center', marginBottom: '0.5rem', ...buttonStyle },
          onClick: () => this.setState({ isOpened: !isOpened })
        },
        [
          div({ style: { color: colors.blue[0], flex: expandTitle ? 1 : undefined } }, title),
          showIcon && icon(isOpened ? 'angle down' : 'angle left', { style: { marginLeft: '0.25rem', flexShrink: 0 } })
        ]),
      animate ?
        h(rCollapse, { isOpened }, [children]) :
        div({ style: { display: isOpened ? 'initial' : 'none' } },
          [children])
    ])
  }
}
