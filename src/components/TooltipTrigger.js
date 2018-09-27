import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Children, cloneElement, Component, createRef, Fragment } from 'react'
import { createPortal } from 'react-dom'
import { div, h, path, svg } from 'react-hyperscript-helpers'
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
    background: 'white', color: colors.gray[0],
    border: `1px solid ${colors.gray[3]}`,
    boxShadow: Style.standardShadow,
    ...baseToolTip
  }
}

class Tooltip extends Component {
  static propTypes = {
    side: PropTypes.string,
    target: PropTypes.string,
    children: PropTypes.node
  }

  static defaultProps = {
    side: 'bottom'
  }

  constructor(props) {
    super(props)
    this.state = {
      tooltip: { width: 0, height: 0 },
      target: { top: 0, bottom: 0, left: 0, right: 0 },
      viewport: { width: 0, height: 0 }
    }
    this.element = createRef()
    this.container = document.createElement('div')
  }

  componentDidMount() {
    document.getElementById('modal-root').appendChild(this.container)
    this.reposition()
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.animation)
    document.getElementById('modal-root').removeChild(this.container)
  }

  reposition() {
    const { target } = this.props
    this.animation = requestAnimationFrame(() => this.reposition())
    const newState = {
      tooltip: _.pick(['width', 'height'], this.element.current.getBoundingClientRect()),
      target: _.pick(['top', 'bottom', 'left', 'right'], document.getElementById(target).getBoundingClientRect()),
      viewport: { width: window.innerWidth, height: window.innerHeight }
    }
    if (!_.isEqual(newState, _.pick(['tooltip', 'target', 'viewport'], this.state))) {
      this.setState(newState)
    }
  }

  render() {
    const { children, side, type } = this.props
    const { target, tooltip, viewport } = this.state
    const gap = type === 'light' ? 5 : 10
    const getPosition = s => {
      const left = _.flow(
        _.clamp(0, viewport.width - tooltip.width),
        _.clamp(target.left - tooltip.width + 16, target.right - 16)
      )(((target.left + target.right) / 2) - (tooltip.width / 2))
      const top = _.flow(
        _.clamp(0, viewport.height - tooltip.height),
        _.clamp(target.top - tooltip.height + 16, target.bottom - 16)
      )(((target.top + target.bottom) / 2) - (tooltip.height / 2))
      return Utils.switchCase(s,
        ['top', () => ({ top: target.top - tooltip.height - gap, left })],
        ['bottom', () => ({ top: target.bottom + gap, left })],
        ['left', () => ({ left: target.left - tooltip.width - gap, top })],
        ['right', () => ({ left: target.right + gap, top })]
      )
    }
    const initial = getPosition(side)
    const maybeFlip = d => {
      return Utils.switchCase(d,
        ['top', () => initial.top < 0 ? 'bottom' : 'top'],
        ['bottom', () => initial.top + tooltip.height >= viewport.height ? 'top' : 'bottom'],
        ['left', () => initial.left < 0 ? 'right' : 'left'],
        ['right', () => initial.left + tooltip.width >= viewport.width ? 'left' : 'right']
      )
    }
    const finalSide = maybeFlip(side)
    const finalPos = getPosition(finalSide)
    const getNotchPosition = () => {
      const left = _.clamp(12, tooltip.width - 12,
        (target.left + target.right) / 2 - finalPos.left
      )
      const top = _.clamp(12, tooltip.height - 12,
        (target.top + target.bottom) / 2 - finalPos.top
      )
      return Utils.switchCase(finalSide,
        ['top', () => ({ bottom: 0, left, transform: 'rotate(180deg)' })],
        ['bottom', () => ({ top: 0, left })],
        ['left', () => ({ right: 0, top, transform: 'rotate(90deg)' })],
        ['right', () => ({ left: 0, top, transform: 'rotate(270deg)' })]
      )
    }
    return createPortal(
      div({
        ref: this.element,
        style: {
          transform: `translate(${finalPos.left}px, ${finalPos.top}px)`,
          ...(type === 'light') ? styles.lightBox : styles.tooltip
        }
      }, [
        children,
        (type === 'light') ? undefined :
          svg({
            viewBox: '0 0 2 1', style: { ...getNotchPosition(), ...styles.notch }
          }, [
            path({ d: 'M0,1l1,-1l1,1Z' })
          ])
      ]),
      this.container
    )
  }
}

export default class TooltipTrigger extends Component {
  static propTypes = {
    content: PropTypes.node, // No tooltip if falsy
    side: PropTypes.string,
    children: PropTypes.node
  }

  constructor(props) {
    super(props)
    this.state = { open: false }
    this.id = `tooltip-trigger-${_.uniqueId()}`
  }

  static defaultProps = {
    type: 'default'
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
