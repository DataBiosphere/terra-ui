import { Component as rComponent, Fragment as rFragment } from 'react'
import { hh } from 'react-hyperscript-helpers'
import rInteractive from 'react-interactive'
import rSelect from 'react-select';
import 'react-select/dist/react-select.css';


export class Component extends rComponent {
  constructor(props) {
    super(props)

    this.state = {}
  }
}

export const Fragment = hh(rFragment)

export const Interactive = hh(rInteractive)

export const Select = hh(rSelect)
