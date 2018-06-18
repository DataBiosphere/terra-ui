import _ from 'lodash/fp'
import { Children, cloneElement, Component, Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import onClickOutside from 'react-onclickoutside'
import ToolTip from 'react-portal-tooltip'
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
  state = {
    open: false
  }

  id = `popup-trigger-${_.uniqueId()}`

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
        className: this.id,
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
