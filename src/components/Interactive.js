import _ from 'lodash/fp'
import { h } from 'react-hyperscript-helpers'


const allowedHoverVariables = ['backgroundColor', 'color', 'boxShadow', 'opacity', 'textDecoration']
const pointerTags = ['button', 'area', 'a', 'select']
const pointerTypes = ['radio', 'checkbox', 'submit', 'button']

const Interactive = ({ as, type, role, onClick, disabled, children, tabIndex, hover = {}, style = {}, ...props }) => {
  const { cursor } = style

  const onClickPointer = !disabled && (onClick ||
    pointerTags.includes(as) ||
    pointerTypes.includes(type)) ? { cursor: 'pointer' } : {}
  const computedCursor = cursor ? { cursor } : onClickPointer

  const onClickTabIndex = onClick ? { tabIndex: 0 } : {}
  const computedTabIndex = _.isNumber(tabIndex) ? { tabIndex } : onClickTabIndex

  const onClickRole = onClick ? { role: 'button' } : {}
  const computedRole = role ? { role } : onClickRole
  console.assert((computedRole.role || ['input', ...pointerTags].includes(as)), `The role for this ${as} was not set but should have been`)

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
    className: 'hover-style',
    style: _.merge({ ...style, ...cssVariables }, computedCursor),
    onKeyDown: evt => evt.key === 'Enter' && onClick(evt),
    onClick,
    disabled,
    role: computedRole,
    ...props,
    ...computedProps
  }, [children])
}

export default Interactive
