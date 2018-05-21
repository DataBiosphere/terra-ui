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
      style: {
        ...Style.elements.button,
        border: 'none', borderRadius: 5, color: 'white',
        height: '2.25rem', paddingLeft: '1.5rem', paddingRight: '1.5rem',
        backgroundColor: props.disabled ? Style.colors.disabled : Style.colors.secondary,
        cursor: props.disabled ? 'not-allowed' : 'pointer'
      },
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
      height: '3.75rem', padding: '0 1rem'
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

export const Checkbox = ({ checked, onChange, disabled, ...props }) => {
  return h(Interactive, {
    as: 'span',
    role: 'checkbox',
    'aria-checked': checked,
    onClick: () => onChange && !disabled && onChange(!checked),
    style: {
      display: 'inline-flex',
      verticalAlign: 'middle',
      color: disabled ? Style.colors.disabled : Style.colors.secondary
    },
    hover: disabled ? undefined : { color: Style.colors.primary },
    active: disabled ? undefined : { backgroundColor: Style.colors.highlightFaded },
    disabled,
    ...props
  }, [
    icon(checked ? 'checkSquare' : 'square', { size: 16 })
  ])
}
