import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Component } from 'react'
import { Collapse as rCollapse } from 'react-collapse'
import { div, h } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import { icon } from 'src/components/icons'


export default class Collapse extends Component {
  static propTypes = {
    title: PropTypes.node.isRequired,
    defaultHidden: PropTypes.bool,
    showIcon: PropTypes.bool,
    animate: PropTypes.bool,
    buttonStyle: PropTypes.object,
    children: PropTypes.node
  }

  static defaultProps = {
    defaultHidden: false,
    showIcon: true,
    animate: false
  }

  constructor(props) {
    super(props)
    this.state = { isOpened: !props.defaultHidden }
  }

  render() {
    const { title, showIcon, animate, buttonStyle, children, ...props } = _.omit('defaultHidden', this.props)
    const { isOpened } = this.state

    return div(props, [
      h(Link, {
        style: { display: 'flex', alignItems: 'center', marginBottom: '0.5rem', ...buttonStyle },
        onClick: () => this.setState({ isOpened: !isOpened })
      }, [
        showIcon && icon(isOpened ? 'angle-down' : 'angle-right', { style: { marginRight: '0.25rem', flexShrink: 0 } }),
        title
      ]),
      animate ?
        h(rCollapse, { isOpened }, [children]) :
        div({ style: { display: isOpened ? 'initial' : 'none' } },
          [children])
    ])
  }
}
