import update from 'immutability-helper'
import { a, div, input } from 'react-hyperscript-helpers'
import mixinDeep from 'mixin-deep'
import * as Style from 'src/style'
import { icon } from 'src/icons'


const link = function(props, children) {
  return Style.addHoverStyle(a, mixinDeep({
      style: {
        textDecoration: 'none',
        color: props.disabled ? Style.colors.disabled : Style.colors.secondary,
        cursor: props.disabled ? 'not-allowed' : 'pointer'
      },
      hoverStyle: props.disabled ? null : { color: Style.colors.primary }
    }, props),
    children)
}

const card = function(props, children) {
  return div(mixinDeep({
      style: {
        width: 300, borderRadius: 5, padding: 5,
        backgroundColor: 'white',
        boxShadow: '0 0 2px 0 rgba(0,0,0,0.12), 0 3px 2px 0 rgba(0,0,0,0.12)'
      }
    }, props),
    children)
}

const buttonPrimary = function(props, children) {
  return div(mixinDeep({
      style: update(Style.elements.button,
        {
          $merge: {
            padding: '2rem 0.5rem', borderRadius: 5,
            color: 'white',
            backgroundColor: props.disabled ? Style.colors.disabled : Style.colors.secondary,
            cursor: props.disabled ? 'not-allowed' : 'pointer'
          }
        }),
      hoverStyle: Style.colors.disabled ? null : { backgroundColor: Style.colors.primary }
    }, props),
    children)
}

const search = function(inputProps) {
  return div({ style: { borderBottom: '1px solid black', padding: '0.5rem 0', display: 'flex' } }, [
    icon('search'),
    input(mixinDeep({
      style: {
        border: 'none', outline: 'none',
        flexGrow: 1,
        verticalAlign: 'bottom', marginLeft: '1rem'
      }
    }, inputProps))
  ])
}

export { card, link, search, buttonPrimary }
