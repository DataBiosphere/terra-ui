import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Children, cloneElement, Component, Fragment } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import onClickOutside from 'react-onclickoutside'
import ToolTip from 'react-portal-tooltip'
import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'
import * as Style from 'src/libs/style'


const styles = {
  popup: {
    transition: 'none',
    border: `1px solid ${colors.gray[3]}`,
    boxShadow: Style.standardShadow,
    padding: 0
  }
}

const PopupBody = onClickOutside(({ children }) => {
  return children
})

export default class PopupTrigger extends Component {
  static propTypes = {
    content: PropTypes.node,
    position: PropTypes.string,
    align: PropTypes.string,
    closeOnClick: PropTypes.bool,
    children: PropTypes.node
  }

  constructor(props) {
    super(props)
    this.state = { open: false }
    this.id = `popup-trigger-${_.uniqueId()}`
  }

  close() {
    this.setState({ open: false })
  }

  render() {
    const { children, content, position, align, closeOnClick } = this.props
    const { open } = this.state
    const child = Children.only(children)
    return h(Fragment, [
      cloneElement(child, {
        id: this.id,
        className: `${child.props.className || ''} ${this.id}`,
        onClick: (...args) => {
          child.props.onClick && child.props.onClick(...args)
          this.setState({ open: !open })
        }
      }),
      open && h(ToolTip, {
        active: open, position, align,
        parent: `#${this.id}`, group: 'popup-trigger',
        style: { style: styles.popup, arrowStyle: {} },
        tooltipTimeout: 0
      }, [
        h(PopupBody, {
          handleClickOutside: () => this.setState({ open: false }),
          outsideClickIgnoreClass: this.id
        }, [div({ onClick: closeOnClick ? () => this.close() : undefined }, [content])])
      ])
    ])
  }
}

export const InfoBox = ({ size, children, style, position, align }) => h(PopupTrigger, {
  position, align,
  content: div({ style: { padding: '0.5rem', width: 300 } }, children)
}, [
  span({ style: { cursor: 'pointer', color: colors.blue[0], ...style } }, [
    icon('info-circle', { className: 'is-solid', size })
  ])
])
