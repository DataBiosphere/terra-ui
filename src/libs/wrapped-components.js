import _ from 'lodash/fp'
import { Component as rComponent } from 'react'
import { h } from 'react-hyperscript-helpers'
import rSelect from 'react-select'
import 'react-select/dist/react-select.css'
import * as Style from 'src/libs/style'


export class Component extends rComponent {
  constructor(props) {
    super(props)

    this.state = {}
  }
}

export const Select = props => h(rSelect, _.merge({ style: Style.elements.input }, props))
