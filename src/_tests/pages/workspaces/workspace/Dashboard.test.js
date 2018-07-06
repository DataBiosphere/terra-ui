import { mount } from 'enzyme'
import { h } from 'react-hyperscript-helpers'
import { Rawls } from 'src/libs/ajax'
import { waitOneTickAndUpdate } from 'src/libs/test-utils'
import { WorkspaceDashboard } from 'src/pages/workspaces/workspace/Dashboard'

let workspaceMock;

describe('Dashboard', () => {
  // Pretty much useless, exists to explore mock infrastructure
  beforeAll(() => {
    workspaceMock = jest.spyOn(Rawls, 'workspace')
    workspaceMock.mockImplementation((namespace, name) => {
      const { createWorkspace } = require.requireActual('src/libs/__mocks__/ajax')
      return {
        details() {
          return Promise.resolve(createWorkspace({ namespace, name, accessLevel: 'OWNER' }))
        }
      }
    })
  })

  it('should render the correct access level', () => {
    const wrapper = mount(
      h(WorkspaceDashboard, {
        namespace: 'test-namespace',
        name: 'test-name'
      }))

    return waitOneTickAndUpdate(wrapper).then(() => {
      expect(wrapper.testId('access-level').text()).toEqual('OWNER')
    })
  })

  afterAll(() => {
    workspaceMock.mockRestore()
  })
})
