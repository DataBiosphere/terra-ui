
import { allAppTypes, isToolLabelAnApp, tools } from 'src/pages/workspaces/workspace/analysis/tool-utils'


describe('getAllAppTypes and isToolAnApp', () => {
  it('getAllAppTypes includes tools with a defined appType', () => {
    expect(allAppTypes.sort).toBe([tools.Galaxy.appType, tools.Cromwell.appType].sort)
  })
  it('isToolAnApp returns if a tool label corresponds to an app', () => {
    expect(isToolLabelAnApp(tools.Cromwell.label)).toBeTruthy()
    expect(isToolLabelAnApp(tools.Jupyter.label)).toBeFalsy()
  })
})
