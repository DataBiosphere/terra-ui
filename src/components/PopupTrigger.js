import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Children, cloneElement, Component, Fragment, useRef } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import onClickOutside from 'react-onclickoutside'
import { Clickable, FocusTrapper } from 'src/components/common'
import { icon } from 'src/components/icons'
import { computePopupPosition, PopupPortal, useDynamicPosition } from 'src/components/popup-utils'
import colors from 'src/libs/colors'
import * as Style from 'src/libs/style'


const styles = {
  popup: {
    position: 'fixed', top: 0, left: 0,
    backgroundColor: 'white',
    border: `1px solid ${colors.dark(0.55)}`, borderRadius: 4,
    boxShadow: Style.standardShadow
  }
}

const Popup = onClickOutside(({ side = 'bottom', target: targetId, onClick, children }) => {
  const elementRef = useRef()
  const [target, element, viewport] = useDynamicPosition([{ id: targetId }, { ref: elementRef }, { viewport: true }])
  const { position } = computePopupPosition({ side, target, element, viewport, gap: 10 })
  return h(PopupPortal, [
    div({
      onClick,
      ref: elementRef,
      style: {
        transform: `translate(${position.left}px, ${position.top}px)`,
        visibility: !viewport.width ? 'hidden' : undefined,
        ...styles.popup
      }
    }, [children])
  ])
})

export default class PopupTrigger extends Component {
  static propTypes = {
    content: PropTypes.node,
    side: PropTypes.string,
    closeOnClick: PropTypes.bool,
    children: PropTypes.node,
    onToggle: PropTypes.func,
    open: PropTypes.bool
  }

  static defaultProps = {
    side: 'right',
    closeOnClick: false,
    onToggle: _.noop
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
    const { children, content, side, closeOnClick, onToggle, open: forceOpen } = this.props
    const { open } = this.state
    const child = Children.only(children)
    const shouldShow = forceOpen === undefined ? open : forceOpen
    const setOpen = v => {
      this.setState({ open: v })
      onToggle(v)
    }
    return h(Fragment, [
      cloneElement(child, {
        id: this.id,
        className: `${child.props.className || ''} ${this.id}`,
        onClick: (...args) => {
          child.props.onClick && child.props.onClick(...args)
          setOpen(!shouldShow)
        }
      }),
      shouldShow && h(Popup, {
        side, target: this.id,
        handleClickOutside: () => setOpen(false),
        outsideClickIgnoreClass: this.id,
        onClick: closeOnClick ? () => this.close() : undefined
      },
      [h(FocusTrapper, { onBreakout: () => this.setState({ open: false }) }, [content])])
    ])
  }
}

export const InfoBox = ({ size, children, style, side }) => h(PopupTrigger, {
  side,
  content: div({ style: { padding: '0.5rem', width: 300 } }, [children])
}, [
  h(Clickable, { as: 'span' }, [icon('info-circle', { size, style: { cursor: 'pointer', color: colors.accent(), ...style } })])
])
