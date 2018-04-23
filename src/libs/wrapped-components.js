import _ from 'lodash'
import { Component as rComponent, Fragment as rFragment } from 'react'
import { h, hh } from 'react-hyperscript-helpers'
import rInteractive from 'react-interactive'
import rSelect from 'react-select'
import 'react-select/dist/react-select.css'
import * as Style from 'src/libs/style'


export class Component extends rComponent {
  constructor(props) {
    super(props)

    this.state = {}
  }
}

export const Fragment = hh(rFragment)

export const Interactive = hh(rInteractive)

export const Select = props => h(rSelect, _.merge({style: Style.elements.input}, props))
