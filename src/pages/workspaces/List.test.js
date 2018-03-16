import React from 'react'
import ReactDOM from 'react-dom'
import { h } from 'react-hyperscript-helpers'
import { WorkspaceList } from './List'


jest.mock('src/libs/ajax')

xtest('renders the workspace list', () => { // disabled until there's  mock data for the ws list
  const div = document.createElement('div')
  ReactDOM.render(h(WorkspaceList), div)
  ReactDOM.unmountComponentAtNode(div)
})
