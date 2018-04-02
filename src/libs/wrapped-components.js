import { Component as rComponent, Fragment as rFragment } from 'react'
import { hh } from 'react-hyperscript-helpers'
import rInteractive from 'react-interactive'

export class Component extends rComponent {
  constructor(props) {
    super(props)

    this.state = {}
  }
}

export const Fragment = hh(rFragment)

export const Interactive = hh(rInteractive)
