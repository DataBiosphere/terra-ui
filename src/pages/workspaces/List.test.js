import React from 'react'
import ReactDOM from 'react-dom'
import { h } from 'react-hyperscript-helpers'
import { WorkspaceList } from './List'


jest.mock('src/libs/ajax')

test('renders the workspace list', () => {
  const div = document.createElement('div')
  ReactDOM.render(h(WorkspaceList), div)
  ReactDOM.unmountComponentAtNode(div)
})
