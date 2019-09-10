import _ from 'lodash/fp'
import { h } from 'react-hyperscript-helpers'
import * as Utils from 'src/libs/utils'


const allowedHoverVariables = ['backgroundColor', 'color', 'boxShadow', 'opacity', 'textDecoration']
const pointerTags = ['button', 'area', 'a', 'select']
const pointerTypes = ['radio', 'checkbox', 'submit', 'button']

const Interactive = ({ as, type, onClick, disabled, children, tabIndex, hover = {}, style = {}, ...props }) => {
  const { cursor } = style
  const computedCursor = cursor || (!disabled && (onClick ||
    pointerTags.includes(as) ||
    pointerTypes.includes(type)) ? 'pointer' : 'initial')
  const potentialTabIndex = onClick ? { tabIndex: 0 }: {}

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

  const computedTabIndex = { tabIndex: 0 } //Number.isNaN(tabIndex) ? potentialTabIndex : { tabIndex }

  return h(as, {
    className: 'hover-style',
    tabIndex: potentialTabIndex,
    style: {
      ...style,
      ...cssVariables,
      cursor: computedCursor
    },
    onKeyDown: evt => evt.key === 'Enter' && onClick(evt),
    onClick,
    ...computedTabIndex,
    ...props
  }, [children])
}

export default Interactive
