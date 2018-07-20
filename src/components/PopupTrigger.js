import _ from 'lodash/fp'
import { Children, cloneElement, Component, Fragment } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import onClickOutside from 'react-onclickoutside'
import ToolTip from 'react-portal-tooltip'
import { icon } from 'src/components/icons'
import * as Style from 'src/libs/style'


const styles = {
  popup: {
    transition: 'none',
    border: `1px solid ${Style.colors.border}`,
    boxShadow: Style.standardShadow,
    padding: 0
  }
}

const PopupBody = onClickOutside(({ children }) => {
  return div([children])
})

export default class PopupTrigger extends Component {
  constructor(props) {
    super(props)
    this.state = { open: false }
    this.id = `popup-trigger-${_.uniqueId()}`
  }

  close() {
    this.setState({ open: false })
  }

  render() {
    const { children, content, position, align } = this.props
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
        }, [content])
      ])
    ])
  }
}

export const InfoBox = ({ size, children, style, position, align }) => h(PopupTrigger, {
  position, align,
  content: div({ style: { padding: '0.5rem', width: 300 } }, children)
}, [
  span({ style: { cursor: 'pointer', color: Style.colors.secondary, ...style } }, [
    icon('info-circle', { className: 'is-solid', size })
  ])
])
