import _ from 'lodash/fp'
import { h } from 'react-hyperscript-helpers'
import * as Utils from 'src/libs/utils'


const allowedHoverVariables = ['backgroundColor', 'color', 'boxShadow', 'opacity', 'textDecoration']
const pointerTags = ['button', 'area', 'a', 'select']
const pointerTypes = ['radio', 'checkbox', 'submit', 'button']

const Interactive = ({ as, type, role, onClick, disabled, children, tabIndex, hover = {}, style = {}, ...props }) => {
  const { cursor } = style
  const computedCursor = cursor ? { cursor } : (!disabled && (onClick ||
    pointerTags.includes(as) ||
    pointerTypes.includes(type)) ? { cursor: 'pointer' } : {})

  const potentialTabIndex = onClick ? { tabIndex: 0 } : {}
  const computedTabIndex = _.isNumber(tabIndex) ? { tabIndex } : potentialTabIndex

  const cssVariables = _.flow(
    _.toPairs,
    _.reduce((result, [key, value]) => {
      Utils.useConsoleAssert(
        allowedHoverVariables.includes(key),
        `${key} needs to be added to the hover-style in style.css for the style to be applied`)
      result[`--app-hover-${key}`] = value
      result[key] = `var(--hover-${key}, ${style[key]})`
      return result
    }, {}))(hover)

  return h(as, _.merge({
    className: 'hover-style',
    tabIndex: potentialTabIndex,
    style: _.merge({ ...style, ...cssVariables }, computedCursor),
    onKeyDown: evt => evt.key === 'Enter' && onClick(evt),
    onClick,
    ...props
  }, computedTabIndex), [children])
}

export default Interactive
