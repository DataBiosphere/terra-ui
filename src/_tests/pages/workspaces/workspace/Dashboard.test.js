import { mount } from 'enzyme'
import { Rawls } from 'src/libs/ajax'
import { WorkspaceContainer } from 'src/pages/workspaces/workspace/Container'


describe('Dashboard', () => {
  // Pretty much useless, exists to explore mock infrastructure
  it('should render the correct access level', () => {
    jest.spyOn(Rawls, 'workspaceDetails').mockImplementationOnce((namespace, name, success) => {
        const { createWorkspace } = require.requireActual('src/libs/__mocks__/ajax')
        success(createWorkspace({ namespace, name, accessLevel: 'OWNER' }))
      }
    )

    const wrapper = mount(
      WorkspaceContainer({
        namespace: 'test-namespace',
        name: 'test-name'
      }))

    expect(wrapper.testId('access-level').text()).toEqual('OWNER')
  })
})
