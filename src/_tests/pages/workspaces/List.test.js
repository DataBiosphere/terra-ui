import { mount } from 'enzyme'
import { h } from 'react-hyperscript-helpers'
import * as Globals from 'src/libs/globals'
import { waitOneTickAndUpdate } from 'src/libs/test-utils'
import { WorkspaceList } from 'src/pages/workspaces/List'


describe('WorkspaceList', () => {
  it('should switch between Grid and List view', () => {
    const wrapper = mount(h(WorkspaceList))
    return waitOneTickAndUpdate(wrapper).then(() => {
      const isListView = () => Globals.get('workspaceListView')

      expect(isListView()).toEqual(undefined)

      wrapper.findIcon('view-list').click()
      expect(isListView()).toEqual(true)

      wrapper.findIcon('view-cards').click()
      expect(isListView()).toEqual(false)
    })
  })
})
