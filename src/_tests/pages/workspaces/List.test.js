import { mount } from 'enzyme'
import { h } from 'react-hyperscript-helpers'
import TestRenderer from 'react-test-renderer'
import { DataGrid } from 'src/components/table'
import { waitOneTick, waitOneTickAndUpdate } from 'src/libs/test-utils'
import { WorkspaceList } from 'src/pages/workspaces/List'


describe('WorkspaceList', () => {
  it('should render as expected', () => {
    const renderer = TestRenderer.create(h(WorkspaceList))
    return waitOneTick().then(() => {
      expect(renderer.toJSON()).toMatchSnapshot()
    })
  })

  it('should switch between Grid and List view', () => {
    const wrapper = mount(h(WorkspaceList))
    return waitOneTickAndUpdate(wrapper).then(() => {
      const currentCardsPerRow = () => wrapper.find(DataGrid).props().cardsPerRow

      expect(currentCardsPerRow()).not.toEqual(1)

      wrapper.findIcon('view-list').click()
      expect(currentCardsPerRow()).toEqual(1)

      wrapper.findIcon('view-cards').click()
      expect(currentCardsPerRow()).not.toEqual(1)
    })
  })
})
