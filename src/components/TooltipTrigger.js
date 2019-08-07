import _ from 'lodash/fp'
import { Children, cloneElement, Fragment, useRef, useState } from 'react'
import { div, h, path, svg } from 'react-hyperscript-helpers'
import { computePopupPosition, PopupPortal, useDynamicPosition } from 'src/components/popup-utils'
import colors from 'src/libs/colors'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const baseToolTip = {
  position: 'fixed', top: 0, left: 0, pointerEvents: 'none',
  maxWidth: 400, borderRadius: 4
}

const styles = {
  tooltip: {
    background: 'black', color: 'white',
    padding: '0.5rem',
    ...baseToolTip
  },
  notch: {
    fill: 'black',
    position: 'absolute',
    width: 16, height: 8,
    marginLeft: -8, marginRight: -8, marginTop: -8,
    transformOrigin: 'bottom'
  },
  lightBox: {
    background: 'white',
    border: `1px solid ${colors.dark(0.55)}`,
    boxShadow: Style.standardShadow,
    ...baseToolTip
  }
}

const Tooltip = ({ side = 'bottom', type, target: targetId, children, id }) => {
  const elementRef = useRef()
  const [target, element, viewport] = useDynamicPosition([{ id: targetId }, { ref: elementRef }, { viewport: true }])
  const gap = type === 'light' ? 5 : 10
  const { side: finalSide, position } = computePopupPosition({ side, target, element, viewport, gap })
  const getNotchPosition = () => {
    const left = _.clamp(12, element.width - 12,
      (target.left + target.right) / 2 - position.left
    )
    const top = _.clamp(12, element.height - 12,
      (target.top + target.bottom) / 2 - position.top
    )
    return Utils.switchCase(finalSide,
      ['top', () => ({ bottom: 0, left, transform: 'rotate(180deg)' })],
      ['bottom', () => ({ top: 0, left })],
      ['left', () => ({ right: 0, top, transform: 'rotate(90deg)' })],
      ['right', () => ({ left: 0, top, transform: 'rotate(270deg)' })]
    )
  }
  return h(PopupPortal, [
    div({
      id, role: 'tooltip',
      ref: elementRef,
      style: {
        transform: `translate(${position.left}px, ${position.top}px)`,
        visibility: !viewport.width ? 'hidden' : undefined,
        ...(type === 'light') ? styles.lightBox : styles.tooltip
      }
    }, [
      children,
      type !== 'light' && svg({ viewBox: '0 0 2 1', style: { ...getNotchPosition(), ...styles.notch } }, [
        path({ d: 'M0,1l1,-1l1,1Z' })
      ])
    ])
  ])
}

const TooltipTrigger = ({ children, content, ...props }) => {
  const [open, setOpen] = useState(false)
  const id = Utils.useUniqueId()
  const tooltipId = Utils.useUniqueId()
  const child = Children.only(children)
  const childId = child.props.id || id
  return h(Fragment, [
    cloneElement(child, {
      id: childId,
      'aria-describedby': open ? tooltipId : undefined,
      onMouseEnter: (...args) => {
        child.props.onMouseEnter && child.props.onMouseEnter(...args)
        setOpen(true)
      },
      onMouseLeave: (...args) => {
        child.props.onMouseLeave && child.props.onMouseLeave(...args)
        setOpen(false)
      },
      onFocus: (...args) => {
        child.props.onFocus && child.props.onFocus(...args)
        setOpen(true)
      },
      onBlur: (...args) => {
        child.props.onBlur && child.props.onBlur(...args)
        setOpen(false)
      }
    }),
    open && !!content && h(Tooltip, { target: childId, id: tooltipId, ...props }, [content])
  ])
}

export default TooltipTrigger
