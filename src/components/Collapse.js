import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Collapse as rCollapse } from 'react-collapse'
import { div, h } from 'react-hyperscript-helpers'
import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'
import { Component } from 'src/libs/wrapped-components'


export default class Collapse extends Component {
  static propTypes = {
    title: PropTypes.node.isRequired,
    defaultHidden: PropTypes.bool,
    showIcon: PropTypes.bool,
    animate: PropTypes.bool,
    expandTitle: PropTypes.bool,
    buttonStyle: PropTypes.object,
    children: PropTypes.node
  }

  static defaultProps = {
    defaultHidden: false,
    showIcon: true,
    animate: false,
    expandTitle: false
  }

  constructor(props) {
    super(props)
    this.state = { isOpened: !props.defaultHidden }
  }

  render() {
    const { title, showIcon, animate, expandTitle, buttonStyle, children, ...props } = _.omit('defaultHidden', this.props)
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
