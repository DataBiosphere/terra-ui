import _ from 'lodash/fp'
import { Children, cloneElement, Component, createRef, Fragment } from 'react'
import { createPortal } from 'react-dom'
import { div, h, path, svg } from 'react-hyperscript-helpers'
import * as Utils from 'src/libs/utils'


const includesAll = (arr, col) => _.overEvery(_.map(_.includes, arr))(col)

const styles = {
  tooltip: (side, dir) => ({
    position: 'fixed', pointerEvents: 'none',
    background: 'black', color: 'white',
    padding: '0.5rem', maxWidth: 400,
    borderRadius: Utils.cond(
      [includesAll(['bottom', 'right'], [side, dir]), () => '0 4px 4px 4px'],
      [includesAll(['bottom', 'left'], [side, dir]), () => '4px 0 4px 4px'],
      [includesAll(['top', 'right'], [side, dir]), () => '4px 4px 4px 0'],
      [includesAll(['top', 'left'], [side, dir]), () => '4px 4px 0 4px'],
      undefined
    )
  }),
  notch: (side, dir) => ({
    width: 8, height: 8,
    fill: 'black',
    position: 'absolute',
    ...Utils.switchCase(side,
      ['top', () => ({ top: '100%' })],
      ['bottom', () => ({ bottom: '100%' })],
      ['left', () => ({ left: '100%' })],
      ['right', () => ({ right: '100%' })]
    ),
    ...Utils.switchCase(dir,
      ['top', () => ({ bottom: 0 })],
      ['bottom', () => ({ top: 0 })],
      ['left', () => ({ right: 0 })],
      ['right', () => ({ left: 0 })]
    ),
    transform: `
      scaleY(${side === 'top' || dir === 'bottom' ? -1 : 1})
      scaleX(${side === 'right' || dir === 'left' ? -1 : 1})
    `
  })
}

class Tooltip extends Component {
  state = {
    tooltip: { width: 0, height: 0 },
    target: { top: 0, bottom: 0, left: 0, right: 0 },
    viewport: { width: 0, height: 0 }
  }

  element = createRef()

  container = document.createElement('div')

  static defaultProps = {
    side: 'bottom'
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
    const { children, side } = this.props
    const { target, tooltip, viewport } = this.state
    const dir = _.includes(side, ['top', 'bottom']) ? 'right' : 'bottom'
    const getPosition = (s, d) => {
      return {
        ...Utils.switchCase(s,
          ['top', () => ({ top: target.top - tooltip.height - 10 })],
          ['bottom', () => ({ top: target.bottom + 10 })],
          ['left', () => ({ left: target.left - tooltip.width - 10 })],
          ['right', () => ({ left: target.right + 10 })]
        ),
        ...Utils.switchCase(d,
          ['top', () => ({ top: (target.bottom + target.top) / 2 - tooltip.height })],
          ['bottom', () => ({ top: (target.bottom + target.top) / 2 })],
          ['left', () => ({ left: (target.right + target.left) / 2 - tooltip.width })],
          ['right', () => ({ left: (target.right + target.left) / 2 })]
        )
      }
    }
    const initial = getPosition(side, dir)
    const maybeFlip = d => {
      return Utils.switchCase(d,
        ['top', () => initial.top < 0 ? 'bottom' : 'top'],
        ['bottom', () => initial.top + tooltip.height >= viewport.height ? 'top' : 'bottom'],
        ['left', () => initial.left < 0 ? 'right' : 'left'],
        ['right', () => initial.left + tooltip.width >= viewport.width ? 'left' : 'right']
      )
    }
    const finalSide = maybeFlip(side)
    const finalDir = maybeFlip(dir)
    return createPortal(
      div({
        ref: this.element,
        style: { ...styles.tooltip(finalSide, finalDir), ...getPosition(finalSide, finalDir) }
      }, [
        children,
        svg({ viewBox: '0 0 1 1', style: styles.notch(finalSide, finalDir) }, [
          path({ d: 'M0,0V1H1Z' })
        ])
      ]),
      this.container
    )
  }
}

/**
 * @param {object} [props.content] - content of tooltip
 * @param {string} [props.side='bottom'] - preferred side
 */
export default class TooltipTrigger extends Component {
  state = { open: false }

  id = `tooltip-trigger-${_.uniqueId()}`

  render() {
    const { children, content, ...props } = this.props
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
      open && h(Tooltip, { target: this.id, ...props }, [content])
    ])
  }
}
