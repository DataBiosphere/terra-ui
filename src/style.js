import _ from 'underscore'
import { style } from 'react-hyperscript-helpers'
import toCss from 'to-css'


const colors = {
  darkBluish: '#607d8b',
  lightBluish: '#cfd8dc'
}

const elements = {
  h2AndH3: { color: '#444', fontWeight: 'lighter' },
  button: {
    color: '#888', backgroundColor: '#eee',
    border: 'none', borderRadius: 4,
    padding: '5px 10px',
    cursor: 'pointer'
  }
}

/**
 * Takes an element, props with a hoverStyle object, and children,
 * and causes those styles to be applied on hover. Returns the new element.
 */
const addHoverStyle = function(element, props, children) {
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

  return element(cleanedProps, [children, style({}, cssString)])
}

export { colors, elements, addHoverStyle }
