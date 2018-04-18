import React from 'react'
import { mount } from 'enzyme'
import { WorkspaceContainer } from 'src/pages/workspaces/workspace/Container'


jest.unmock('src/libs/ajax').mock('src/libs/ajax', () => ({
  Rawls: {
    workspaceDetails: (namespace, name, success, _) => {
      const Ajax = require.requireActual('src/libs/__mocks__/ajax')
      success(Ajax.createWorkspace({ namespace, name, accessLevel: 'OWNER' }))
    }
  }
}))

describe('Dashboard', () => {
  // Pretty much useless, exists to explore mock infrastructure
  it('should render the correct access level', () => {
    const wrapper = mount(
      WorkspaceContainer({
        namespace: 'test-namespace',
        name: 'test-name'
      }))

    expect(wrapper.find('[data-test-id="access-level"]').first().text()).toEqual('OWNER')
  })
})
