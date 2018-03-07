import { style } from 'react-hyperscript-helpers'
import toCss from 'to-css'
import _ from 'underscore'


const colors = {
  accent: '#8b5f95',
  background: '#e5e5e5',
  disabled: '#9b9b9b',
  highlight: '#bfd5e3',
  primary: '#5faee0',
  secondary: '#478eba',
  text: '#4a4a4a',
  textLight: '#bde5ff',
  title: '#224f83'
}

const elements = {
  button: { color: 'black', fontWeight: 500, textTransform: 'uppercase' },
  cardTitle: { color: colors.secondary, fontSize: 16, fontWeight: 500 },
  pageTitle: { color: colors.title, fontSize: 22, fontWeight: 500, textTransform: 'uppercase' },
  sectionHeader: { color: colors.title, fontSize: 16 }
}

/**
 * Takes an element, props with a hoverStyle object, and child,
 * and causes those styles to be applied on hover. Returns the new element.
 */
const addHoverStyle = function(element, props, child = null) {
  const hoverId = 'hover-' + Math.random()
  const cleanedProps = _.omit(props, 'hoverStyle')
  cleanedProps['data-hover-style-id'] = hoverId
  const cssString =
    `[data-hover-style-id="${hoverId}"]:hover {
    ${toCss(props.hoverStyle, {
      value: function(value) {
        return value + ' !important'
      }
    })}}`

  return element(cleanedProps, [child, style({}, cssString)])
}

export { colors, elements, addHoverStyle }
