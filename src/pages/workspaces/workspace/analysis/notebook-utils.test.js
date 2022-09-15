import { allAppTypes, isToolAnApp, tools } from 'src/pages/workspaces/workspace/analysis/notebook-utils'


describe('getAllAppTypes and isToolAnApp', () => {
  it('getAllAppTypes includes tools with a defined appType', () => {
    expect(allAppTypes.sort).toBe([tools.Galaxy.appType, tools.Cromwell.appType].sort)
  })
  it('isToolAnApp returns if a tool label corresponds to an app', () => {
    expect(isToolAnApp(tools.Cromwell.label)).toBeTruthy()
    expect(isToolAnApp(tools.Jupyter.label)).toBeFalsy()
  })
})
