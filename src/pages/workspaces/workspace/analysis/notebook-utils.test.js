
import { allAppTypes, appTools, isAppToolLabel, toolLabelTypes } from 'src/pages/workspaces/workspace/analysis/tool-utils'


describe('getAllAppTypes and isToolAnApp', () => {
  it('getAllAppTypes includes tools with a defined appType', () => {
    expect(allAppTypes.sort).toBe([appTools.Galaxy.appType, appTools.Cromwell.appType].sort)
  })
  it('isToolAnApp returns if a tool label corresponds to an app', () => {
    expect(isAppToolLabel(toolLabelTypes.Cromwell)).toBeTruthy()
    expect(isAppToolLabel(toolLabelTypes.Jupyter)).toBeFalsy()
  })
})
