import { allAppTypes, appTools, isAppToolLabel, toolLabels } from 'src/pages/workspaces/workspace/analysis/tool-utils'


describe('getAllAppTypes and isToolAnApp', () => {
  it('getAllAppTypes includes tools with a defined appType', () => {
    expect(allAppTypes.sort).toBe([appTools.Galaxy.appType, appTools.Cromwell.appType].sort)
  })
  it('isToolAnApp returns if a tool label corresponds to an app', () => {
    expect(isAppToolLabel(toolLabels.Cromwell)).toBeTruthy()
    expect(isAppToolLabel(toolLabels.Jupyter)).toBeFalsy()
  })
})
