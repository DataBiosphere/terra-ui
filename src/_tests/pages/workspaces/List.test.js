import { mount } from 'enzyme'
import { h } from 'react-hyperscript-helpers'
import { waitOneTickAndUpdate } from 'src/libs/test-utils'
import { WorkspaceList } from 'src/pages/workspaces/List'


describe('WorkspaceList', () => {
  it('should switch between Grid and List view', () => {
    const wrapper = mount(h(WorkspaceList))
    return waitOneTickAndUpdate(wrapper).then(() => {
      const isListView = () => wrapper.find('WorkspaceList').props().listView

      expect(isListView()).toEqual(false)

      wrapper.findIcon('view-list').click()
      expect(isListView()).toEqual(true)

      wrapper.findIcon('view-cards').click()
      expect(isListView()).toEqual(false)
    })
  })
})
