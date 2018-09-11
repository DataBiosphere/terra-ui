import { mount } from 'enzyme'
import { h } from 'react-hyperscript-helpers'
import TestRenderer from 'react-test-renderer'
import { waitOneTickAndUpdate } from 'src/libs/test-utils'
import * as Utils from 'src/libs/utils'
import { WorkspaceList } from 'src/pages/workspaces/List'


describe('WorkspaceList', () => {
  it('should switch between Grid and List view', () => {
    const wrapper = mount(h(WorkspaceList))
    return waitOneTickAndUpdate(wrapper).then(() => {
      const actual = wrapper.instance().child
      const isListView = () => actual.state.listView

      expect(isListView()).toEqual(false)

      wrapper.findIcon('view-list').click()
      expect(isListView()).toEqual(true)

      wrapper.findIcon('view-cards').click()
      expect(isListView()).toEqual(false)
    })
  })
})
