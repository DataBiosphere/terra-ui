import { mount } from 'enzyme'
import { DataGrid } from 'src/components/table'
import { TopBar } from 'src/components/TopBar'
import { WorkspaceList } from 'src/pages/workspaces/List'


describe('WorkspaceList', () => {
  it('should render a TopBar and DataGrid', () => {
    const wrapper = mount(WorkspaceList())

    expect(wrapper.findType(TopBar)).toHaveLength(1)
    expect(wrapper.findType(DataGrid)).toHaveLength(1)
  })

  it('should switch between Grid and list view', () => {
    const wrapper = mount(WorkspaceList())
    const currentCardsPerRow = () => wrapper.findType(DataGrid).props().cardsPerRow

    expect(currentCardsPerRow()).not.toEqual(1)

    wrapper.findIcon('view-list').click()
    expect(currentCardsPerRow()).toEqual(1)

    wrapper.findIcon('view-cards').click()
    expect(currentCardsPerRow()).not.toEqual(1)
  })
})
