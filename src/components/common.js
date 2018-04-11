import _ from 'lodash'
import mixinDeep from 'mixin-deep'
import { div, h, input } from 'react-hyperscript-helpers'
import { icon } from 'src/components/icons'
import * as Style from 'src/libs/style'
import { Interactive } from 'src/libs/wrapped-components'


export const link = function(props, children) {
  return Interactive(
    mixinDeep({
      as: 'a',
      style: {
        textDecoration: 'none',
        color: props.disabled ? Style.colors.disabled : Style.colors.secondary,
        cursor: props.disabled ? 'not-allowed' : 'pointer'
      },
      hover: props.disabled ? undefined : { color: Style.colors.primary }
    }, props),
    children)
}

export const buttonPrimary = function(props, children) {
  return Interactive(
    mixinDeep({
      as: 'button',
      style: _.defaults({
        border: 'none', padding: '0.5rem 2rem', borderRadius: 5, color: 'white',
        backgroundColor: props.disabled ? Style.colors.disabled : Style.colors.secondary,
        cursor: props.disabled ? 'not-allowed' : 'pointer'
      }, Style.elements.button),
      hover: props.disabled ? undefined : { backgroundColor: Style.colors.primary }
    }, props),
    children)
}

export const search = function({ wrapperProps, inputProps }) {
  return div(
    mixinDeep({ style: { borderBottom: '1px solid black', padding: '0.5rem 0', display: 'flex' } },
      wrapperProps),
    [
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

export const contextBar = function(props, children) {
  return div(mixinDeep({
      style: {
        display: 'flex', alignItems: 'center', backgroundColor: Style.colors.primary,
        color: Style.colors.textAlt, fontWeight: 500,
        height: '3.5rem', padding: '0 1rem', lineHeight: '3.5rem'
      }
    }, props),
    children)
}

export const contextMenu = function(items) {
  return div({
      style: {
        backgroundColor: 'white', minWidth: 100, border: '1px solid #ccc',
        boxShadow: Style.standardShadow
      }
    },
    _.map(items, ([props, contents]) => h(Interactive,
      mixinDeep({
        as: 'div',
        style: { fontSize: 12, padding: '0.5rem 1.5rem' },
        hover: { backgroundColor: Style.colors.highlight, fontWeight: 500 }
      }, props),
      contents)))
}

export const textInput = function(props) {
  return input(mixinDeep({
    style: _.merge({
      width: '100%',
      padding: '0.5rem 1rem',
      fontWeight: 300, fontSize: '1em'
    }, Style.elements.input)
  }, props))
}
