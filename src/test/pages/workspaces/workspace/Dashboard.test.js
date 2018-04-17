import React from 'react'
import { configure, mount } from 'enzyme'
import { WorkspaceContainer } from 'src/main/pages/workspaces/workspace/Container'
import Adapter from 'enzyme-adapter-react-16/build/index'
import { mockWorkspaceDetailsResponse } from 'src/test/mock/mockRawls'
import * as Main from 'src/main/pages/Main'


configure({ adapter: new Adapter() })

Main.initNavPaths()

describe('Dashboard', () => {
  // Pretty much useless, exists to explore mock infrastructure
  it('should render the correct access level', () => {
    const wrapper = mount(
      React.createElement(WorkspaceContainer, {
        namespace: 'test-namespace',
        name: 'test-name',
        Rawls: mockWorkspaceDetailsResponse({ accessLevel: 'OWNER' })
      }))

    expect(wrapper.find('[data-test-id="access-level"]').first().text()).toEqual('OWNER')
  })
})
