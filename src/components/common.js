import _ from 'lodash'
import mixinDeep from 'mixin-deep'
import { Component } from 'react'
import { createPortal } from 'react-dom'
import { a, div, h, hh, input } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import { icon, logo } from 'src/components/icons'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


export const link = function(props, children) {
  return h(Interactive,
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

export const card = function(props, children) {
  return div(mixinDeep({
      style: {
        borderRadius: 5, padding: '1rem', wordWrap: 'break-word',
        boxShadow: Style.standardShadow
      }
    }, props),
    children)
}

export const buttonPrimary = function(props, children) {
  return h(Interactive,
    mixinDeep({
      as: 'div',
      style: _.assign({
        padding: '0.5rem 2rem', borderRadius: 5,
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

export const contextMenu = function() {}
