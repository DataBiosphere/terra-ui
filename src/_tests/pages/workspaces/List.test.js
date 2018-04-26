import { mount } from 'enzyme'
import { h } from 'react-hyperscript-helpers'
import renderer from 'react-test-renderer'
import { DataGrid } from 'src/components/table'
import { WorkspaceList } from 'src/pages/workspaces/List'

describe('WorkspaceList', () => {
  it('should render as expected', () => {
    expect(renderer.create(h(WorkspaceList)).toJSON()).toMatchSnapshot()
  })

  it('should switch between Grid and List view', () => {
    const wrapper = mount(h(WorkspaceList))
    const currentCardsPerRow = () => wrapper.findType(DataGrid).props().cardsPerRow
    
    expect(currentCardsPerRow()).not.toEqual(1)

    wrapper.findIcon('view-list').click()
    expect(currentCardsPerRow()).toEqual(1)

    wrapper.findIcon('view-cards').click()
    expect(currentCardsPerRow()).not.toEqual(1)
  })
})
