import { mount } from 'enzyme'
import { h } from 'react-hyperscript-helpers'
import { DataGrid } from 'src/components/table'
import { TopBar } from 'src/components/TopBar'
import { WorkspaceList } from 'src/pages/workspaces/List'


const gridType = DataGrid().type
const topBarType = TopBar().type


describe('WorkspaceList', () => {
  it('should render a TopBar and DataGrid', () => {
    const wrapper = mount(WorkspaceList)

    expect(wrapper.find(topBarType)).toHaveLength(1)
    expect(wrapper.find(gridType)).toHaveLength(1)
  })

  it('should switch between Grid and list view', () => {
    const wrapper = mount(h(WorkspaceList))
    const currentCardsPerRow = () => wrapper.find(gridType).props().cardsPerRow

    expect(currentCardsPerRow()).not.toEqual(1)

    wrapper.find('[shape="view-list"]').simulate('click')
    expect(currentCardsPerRow()).toEqual(1)

    wrapper.find('[shape="view-cards"]').simulate('click')
    expect(currentCardsPerRow()).not.toEqual(1)
  })
})
