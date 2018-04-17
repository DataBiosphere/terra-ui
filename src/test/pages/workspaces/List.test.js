import React from 'react'
import { configure, mount } from 'enzyme'
import { WorkspaceList } from 'src/main/pages/workspaces/List'
import Adapter from 'enzyme-adapter-react-16'
import * as Main from 'src/main/pages/Main'
import { mockRawls } from 'src/test/mock/mockRawls'


configure({ adapter: new Adapter() })

Main.initNavPaths()

describe('WorkspaceList', () => {
  it('should render a TopBar and DataGrid', () => {
    const wrapper = mount(React.createElement(WorkspaceList, { Rawls: mockRawls }))
    expect(wrapper.find('TopBar').length).toEqual(1)
    expect(wrapper.find('DataGrid').length).toEqual(1)
  })

  it('should switch between Grid and list view', () => {
    const wrapper = mount(React.createElement(WorkspaceList, { Rawls: mockRawls }))
    expect(wrapper.find('DataGrid').length).toEqual(1)
    expect(wrapper.find('DataGrid[cardsPerRow=1]').length).toEqual(0)

    wrapper.find('clr-icon[shape="view-list"]').simulate('click')
    expect(wrapper.find('DataGrid').length).toEqual(1)
    expect(wrapper.find('DataGrid[cardsPerRow=1]').length).toEqual(1)

    wrapper.find('clr-icon[shape="view-cards"]').simulate('click')
    expect(wrapper.find('DataGrid').length).toEqual(1)
    expect(wrapper.find('DataGrid[cardsPerRow=1]').length).toEqual(0)
  })
})
