import { mount } from 'enzyme'
import { h } from 'react-hyperscript-helpers'
import { Provider } from 'react-redux'
import TestRenderer from 'react-test-renderer'
import { DataGrid } from 'src/components/table'
import { waitOneTick, waitOneTickAndUpdate } from 'src/libs/test-utils'
import { WorkspaceList } from 'src/pages/workspaces/List'
import store from 'src/store'


const WrappedWorkspaceList = () => h(Provider, { store }, [h(WorkspaceList)])

describe('WorkspaceList', () => {
  it('should render as expected', () => {
    const renderer = TestRenderer.create(h(WrappedWorkspaceList))
    return waitOneTick().then(() => {
      expect(renderer.toJSON()).toMatchSnapshot()
    })
  })

  it('should switch between Grid and List view', () => {
    const wrapper = mount(h(WrappedWorkspaceList))
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
