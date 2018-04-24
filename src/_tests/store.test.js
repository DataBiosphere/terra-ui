import { reducer } from 'src/store'

describe('store', () => {
  it('Workspaces.loadCompleted', () => {
    const workspaces = [
      { workspace: { name: 'c' }, public: false, accessLevel: 'READER' },
      { workspace: { name: 'b' }, public: true, accessLevel: 'NO_ACCESS' },
      { workspace: { name: 'a' }, public: true, accessLevel: 'OWNER' },
    ]
    const state = reducer(undefined, { type: 'Workspaces.loadCompleted', workspaces })
    expect(state.workspaces.workspaces.map(w => w.workspace.name)).toEqual(['a', 'c'])
  })
})
