import _ from 'lodash'
import { div, h, input } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import { icon } from 'src/components/icons'
import * as Style from 'src/libs/style'


export const link = function(props, children) {
  return h(Interactive,
    _.merge({
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
  return h(Interactive,
    _.merge({
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
    _.merge({ style: { borderBottom: '1px solid black', padding: '0.5rem 0', display: 'flex' } },
      wrapperProps),
    [
      icon('search'),
      input(_.merge({
        style: {
          border: 'none', outline: 'none',
          flexGrow: 1,
          verticalAlign: 'bottom', marginLeft: '1rem'
        }
      }, inputProps))
    ])
}

export const contextBar = function(props, children) {
  return div(_.merge({
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
        backgroundColor: 'white', minWidth: 125, border: '1px solid #ccc',
        boxShadow: Style.standardShadow
      }
    },
    _.map(items, ([props, contents]) => h(Interactive,
      _.merge({
        as: 'div',
        style: { fontSize: 12, padding: '0.5rem 1.5rem' },
        hover: { backgroundColor: Style.colors.highlight, fontWeight: 500 }
      }, props),
      contents))
  )
}

export const textInput = function(props) {
  return input(_.merge({
    style: _.merge({
      width: '100%',
      padding: '0.5rem 1rem',
      fontWeight: 300, fontSize: '1em'
    }, Style.elements.input)
  }, props))
}
