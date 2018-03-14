import React from 'react'
import ReactDOM from 'react-dom'
import { h } from 'react-hyperscript-helpers'
import Main from './Main'


it('renders without crashing', () => {
  const div = document.createElement('div')
  ReactDOM.render(h(Main), div)
  ReactDOM.unmountComponentAtNode(div)
})
