import { mount } from 'enzyme'
import { h } from 'react-hyperscript-helpers'
import { Rawls } from 'src/libs/ajax'
import { waitOneTickAndUpdate } from 'src/libs/test-utils'
import { WorkspaceContainer } from 'src/pages/workspaces/workspace/Container'


describe('Dashboard', () => {
  // Pretty much useless, exists to explore mock infrastructure
  it('should render the correct access level', () => {
    jest.spyOn(Rawls, 'workspace').mockImplementationOnce((namespace, name) => {
      const { createWorkspace } = require.requireActual('src/libs/__mocks__/ajax')
      return {
        details() {
          return Promise.resolve(createWorkspace({
            namespace,
            name,
            accessLevel: 'OWNER'
          }))
        }
      }
    })

    const wrapper = mount(
      h(WorkspaceContainer, {
        namespace: 'test-namespace',
        name: 'test-name'
      }))

    return waitOneTickAndUpdate(wrapper).then(() => {
      expect(wrapper.testId('access-level').text()).toEqual('OWNER')
    })
  })
})
