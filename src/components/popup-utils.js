import _ from 'lodash/fp'
import { Children, Component, createRef } from 'react'
import { createPortal } from 'react-dom'
import { h } from 'react-hyperscript-helpers'
import * as Utils from 'src/libs/utils'


export const withDynamicPosition = () => WrappedComponent => {
  const Wrapper = class extends Component {
    constructor(props) {
      super(props)
      this.state = {
        dimensions: {
          element: { width: 0, height: 0 },
          target: { top: 0, bottom: 0, left: 0, right: 0 },
          viewport: { width: 0, height: 0 }
        }
      }
      this.element = createRef()
    }

    static displayName = `withDynamicPosition()`

    componentDidMount() {
      this.reposition()
    }

    componentWillUnmount() {
      cancelAnimationFrame(this.animation)
    }

    reposition() {
      const { target } = this.props
      const { dimensions } = this.state
      this.animation = requestAnimationFrame(() => this.reposition())
      const newDimensions = {
        element: _.pick(['width', 'height'], this.element.current.getBoundingClientRect()),
        target: _.pick(['top', 'bottom', 'left', 'right'], document.getElementById(target).getBoundingClientRect()),
        viewport: { width: window.innerWidth, height: window.innerHeight }
      }
      if (!_.isEqual(newDimensions, dimensions)) {
        this.setState({ dimensions: newDimensions })
      }
    }

    render() {
      const { dimensions } = this.state
      return h(WrappedComponent, {
        dimensions,
        elementRef: this.element,
        ...this.props
      })
    }
  }
  return Wrapper
}

export const computePopupPosition = ({ side, viewport, target, element, gap }) => {
  const getPosition = s => {
    const left = _.flow(
      _.clamp(0, viewport.width - element.width),
      _.clamp(target.left - element.width + 16, target.right - 16)
    )(((target.left + target.right) / 2) - (element.width / 2))
    const top = _.flow(
      _.clamp(0, viewport.height - element.height),
      _.clamp(target.top - element.height + 16, target.bottom - 16)
    )(((target.top + target.bottom) / 2) - (element.height / 2))
    return Utils.switchCase(s,
      ['top', () => ({ top: target.top - element.height - gap, left })],
      ['bottom', () => ({ top: target.bottom + gap, left })],
      ['left', () => ({ left: target.left - element.width - gap, top })],
      ['right', () => ({ left: target.right + gap, top })]
    )
  }
  const position = getPosition(side)
  const maybeFlip = d => {
    return Utils.switchCase(d,
      ['top', () => position.top < 0 ? 'bottom' : 'top'],
      ['bottom', () => position.top + element.height >= viewport.height ? 'top' : 'bottom'],
      ['left', () => position.left < 0 ? 'right' : 'left'],
      ['right', () => position.left + element.width >= viewport.width ? 'left' : 'right']
    )
  }
  const finalSide = maybeFlip(side)
  const finalPosition = getPosition(finalSide)
  return { side: finalSide, position: finalPosition }
}

export const PopupPortal = ({ children }) => {
  return createPortal(Children.only(children), document.getElementById('modal-root'))
}
