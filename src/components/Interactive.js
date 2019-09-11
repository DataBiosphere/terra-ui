import _ from 'lodash/fp'
import { h } from 'react-hyperscript-helpers'


const allowedHoverVariables = ['backgroundColor', 'color', 'boxShadow', 'opacity', 'textDecoration']
const pointerTags = ['button', 'area', 'a', 'select']
const pointerTypes = ['radio', 'checkbox', 'submit', 'button']

const Interactive = ({ className = '', as, type, role, onClick, disabled, children, tabIndex, hover = {}, style = {}, ...props }) => {
  const { cursor } = style

  const onClickPointer = !disabled && (onClick ||
    pointerTags.includes(as) ||
    pointerTypes.includes(type)) ? { cursor: 'pointer' } : {}
  const computedCursor = cursor ? { cursor } : onClickPointer

  const onClickTabIndex = onClick ? { tabIndex: 0 } : {}
  const computedTabIndex = _.isNumber(tabIndex) ? { tabIndex } : onClickTabIndex

  const onClickRole = onClick && !['input', ...pointerTags].includes(as) ? { role: 'button' } : {}
  const computedRole = role ? { role } : onClickRole

  const computedProps = _.merge(computedTabIndex, computedRole)

  const cssVariables = _.flow(
    _.toPairs,
    _.reduce((result, [key, value]) => {
      console.assert(
        allowedHoverVariables.includes(key),
        `${key} needs to be added to the hover-style in style.css for the style to be applied`)
      result[`--app-hover-${key}`] = value
      result[key] = `var(--hover-${key}, ${style[key]})`
      return result
    }, {}))(hover)

  return h(as, {
    className: `hover-style ${className}`,
    style: _.merge({ ...style, ...cssVariables }, computedCursor),
    onKeyDown: evt => evt.key === 'Enter' && onClick && onClick(evt),
    onClick,
    disabled,
    ...props,
    ...computedProps
  }, [children])
}

export default Interactive
