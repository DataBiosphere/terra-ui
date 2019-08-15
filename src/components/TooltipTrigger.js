import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Children, cloneElement, Component, Fragment, useRef } from 'react'
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

const Tooltip = ({ side = 'bottom', type, target: targetId, children }) => {
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

export default class TooltipTrigger extends Component {
  static propTypes = {
    content: PropTypes.node, // No tooltip if falsy
    side: PropTypes.string,
    children: PropTypes.node,
    type: PropTypes.string
  }

  static defaultProps = {
    side: 'bottom',
    type: 'default'
  }

  constructor(props) {
    super(props)
    this.state = { open: false }
    this.id = `tooltip-trigger-${_.uniqueId()}`
  }

  render() {
    const { children, type, content, ...props } = this.props
    const { open } = this.state
    if (!content) {
      return children
    }
    const child = Children.only(children)
    return h(Fragment, [
      cloneElement(child, {
        id: this.id,
        onMouseEnter: (...args) => {
          child.props.onMouseEnter && child.props.onMouseEnter(...args)
          this.setState({ open: true })
        },
        onMouseLeave: (...args) => {
          child.props.onMouseLeave && child.props.onMouseLeave(...args)
          this.setState({ open: false })
        }
      }),
      open && h(Tooltip, { target: this.id, type, ...props }, [content])
    ])
  }
}
