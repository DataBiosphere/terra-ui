import _ from 'lodash/fp'
import { Children, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useGetter, useOnMount } from 'src/libs/react-utils'
import * as Utils from 'src/libs/utils'


export const useDynamicPosition = selectors => {
  const pickValues = _.pick(['top', 'bottom', 'left', 'right', 'width', 'height'])
  const [dimensions, setDimensions] = useState(_.map(({ viewport }) => {
    return viewport ? { width: 0, height: 0 } : pickValues(new DOMRect())
  }, selectors))
  const getDimensions = useGetter(dimensions)
  const animation = useRef()
  const computePosition = () => {
    const newDimensions = _.map(({ ref, id, viewport }) => {
      return Utils.cond(
        [ref, () => pickValues(ref.current?.getBoundingClientRect())],
        [id, () => pickValues(document.getElementById(id)?.getBoundingClientRect())],
        [viewport, () => ({ width: window.innerWidth, height: window.innerHeight })]
      )
    }, selectors)
    if (!_.isEqual(newDimensions, getDimensions())) {
      setDimensions(newDimensions)
    }
    animation.current = requestAnimationFrame(computePosition)
  }
  useOnMount(() => {
    computePosition()
    return () => cancelAnimationFrame(animation.current)
  })
  return dimensions
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
