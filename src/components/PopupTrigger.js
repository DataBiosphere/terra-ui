import { Children, cloneElement, forwardRef, Fragment, useImperativeHandle, useRef, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import onClickOutside from 'react-onclickoutside'
import { Clickable, FocusTrapper } from 'src/components/common'
import { icon } from 'src/components/icons'
import { computePopupPosition, PopupPortal, useDynamicPosition } from 'src/components/popup-utils'
import colors from 'src/libs/colors'
import * as Style from 'src/libs/style'
import { useUniqueId } from 'src/libs/utils'


const styles = {
  popup: {
    position: 'fixed', top: 0, left: 0,
    backgroundColor: 'white',
    border: `1px solid ${colors.dark(0.55)}`, borderRadius: 4,
    boxShadow: Style.standardShadow
  }
}

export const Popup = onClickOutside(({ side = 'right', target: targetId, onClick, children }) => {
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
      },
      role: 'dialog'
    }, [children])
  ])
})

const PopupTrigger = forwardRef(({ content, children, closeOnClick, ...props }, ref) => {
  const [open, setOpen] = useState(false)
  const id = useUniqueId()
  useImperativeHandle(ref, () => ({
    close: () => setOpen(false)
  }))
  const child = Children.only(children)
  const childId = child.props.id || id
  return h(Fragment, [
    cloneElement(child, {
      id: childId,
      className: `${child.props.className || ''} ${childId}`,
      onClick: (...args) => {
        child.props.onClick && child.props.onClick(...args)
        setOpen(!open)
      }
    }),
    open && h(Popup, {
      target: childId,
      handleClickOutside: () => setOpen(false),
      outsideClickIgnoreClass: childId,
      onClick: closeOnClick ? () => setOpen(false) : undefined,
      ...props
    }, [h(FocusTrapper, { onBreakout: () => setOpen(false) }, [content])])
  ])
})

export default PopupTrigger

export const InfoBox = ({ size, children, style, side }) => h(PopupTrigger, {
  side,
  content: div({ style: { padding: '0.5rem', width: 300 } }, [children])
}, [
  h(Clickable, { as: 'span', 'aria-label': 'More info' }, [
    icon('info-circle', { size, style: { cursor: 'pointer', color: colors.accent(), ...style } })
  ])
])
