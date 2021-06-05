import _ from 'lodash/fp'
import { Children, cloneElement, Fragment, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import onClickOutside from 'react-onclickoutside'
import { Clickable, FocusTrapper } from 'src/components/common'
import { icon } from 'src/components/icons'
import { VerticalNavigation } from 'src/components/keyboard-nav'
import { computePopupPosition, PopupPortal, useDynamicPosition } from 'src/components/popup-utils'
import colors from 'src/libs/colors'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const styles = {
  popup: {
    position: 'fixed', top: 0, left: 0,
    backgroundColor: 'white',
    border: `1px solid ${colors.dark(0.55)}`, borderRadius: 4,
    boxShadow: Style.standardShadow
  }
}

// This is written as a "function" function rather than an arrow function because react-onclickoutside wants it to have a prototype
// eslint-disable-next-line prefer-arrow-callback
export const Popup = onClickOutside(function({ id, side = 'right', target: targetId, onClick, children, popupProps = {} }) {
  // We're passing popupProps here rather than just props, because ...props also includes lots of internal onClickOutside properties which
  // aren't valid to be dropped on a DOM element.
  Utils.useConsoleAssert('aria-label' in popupProps || 'aria-labelledby' in popupProps, 'In order to be accessible, Popup needs a label')

  const elementRef = useRef()
  const [target, element, viewport] = useDynamicPosition([{ id: targetId }, { ref: elementRef }, { viewport: true }])
  const { position } = computePopupPosition({ side, target, element, viewport, gap: 10 })
  return h(PopupPortal, [
    div({
      id,
      onClick,
      ref: elementRef,
      style: {
        transform: `translate(${position.left}px, ${position.top}px)`,
        visibility: !viewport.width ? 'hidden' : undefined,
        ...styles.popup
      },
      role: 'dialog',
      'aria-modal': true,
      ...popupProps
    }, [children])
  ])
})

const PopupTrigger = Utils.forwardRefWithName('PopupTrigger', ({ content, side, closeOnClick, onChange, role = 'dialog', children, ...props }, ref) => {
  const [open, setOpen] = useState(false)
  const id = Utils.useUniqueId()
  const menuId = Utils.useUniqueId()
  useImperativeHandle(ref, () => ({
    close: () => setOpen(false)
  }))

  useEffect(() => {
    onChange && onChange(open)
  }, [open, onChange])

  const child = Children.only(children)
  const childId = child.props.id || id
  const labelledby = child.props['aria-labelledby'] || childId

  return h(Fragment, [
    cloneElement(child, {
      id: childId,
      className: `${child.props.className || ''} ${childId}`,
      onClick: (...args) => {
        child.props.onClick && child.props.onClick(...args)
        setOpen(!open)
      },
      'aria-haspopup': role, // 'dialog', 'listbox', 'menu' are valid values
      'aria-expanded': open,
      'aria-controls': open ? menuId : undefined,
      'aria-owns': open ? menuId : undefined
    }),
    open && h(Popup, {
      id: menuId,
      target: childId,
      handleClickOutside: () => setOpen(false),
      outsideClickIgnoreClass: childId,
      onClick: closeOnClick ? () => setOpen(false) : undefined,
      side,
      popupProps: {
        role,
        'aria-labelledby': labelledby,
        ...props
      }
    }, [h(FocusTrapper, { onBreakout: () => setOpen(false) }, [content])])
  ])
})

export default PopupTrigger

export const InfoBox = ({ size, children, style, side, tooltip, iconOverride }) => {
  const [open, setOpen] = useState(false)
  return h(PopupTrigger, {
    side,
    onChange: setOpen,
    content: div({ style: { padding: '0.5rem', width: 300 } }, [children])
  }, [
    h(Clickable, {
      tooltip,
      as: 'span', 'aria-label': 'More info', 'aria-expanded': open, 'aria-haspopup': true
    }, [
      icon(iconOverride || 'info-circle', { size, style: { cursor: 'pointer', color: colors.accent(), ...style } })
    ])
  ])
}

export const makeMenuIcon = (iconName, props) => {
  return icon(iconName, _.merge({ size: 15, style: { marginRight: '.5rem' } }, props))
}

export const MenuButton = Utils.forwardRefWithName('MenuButton', ({ disabled, children, ...props }, ref) => {
  return div({ role: 'menuitem' }, [
    h(Clickable, _.merge({
      ref,
      disabled,
      style: {
        display: 'flex', alignItems: 'center',
        fontSize: 12, minWidth: 125, height: '2.25rem',
        color: disabled ? colors.dark(0.7) : undefined,
        padding: '0.875rem',
        cursor: disabled ? 'not-allowed' : 'pointer'
      },
      hover: !disabled ? { backgroundColor: colors.light(0.4), color: colors.accent() } : undefined
    }, props), [children])
  ])
})

export const MenuTrigger = ({ children, content, ...props }) => {
  return h(PopupTrigger, {
    content: h(VerticalNavigation, [content]),
    role: 'menu',
    'aria-orientation': 'vertical',
    ...props
  }, [children])
}
