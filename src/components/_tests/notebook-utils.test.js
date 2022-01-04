import { allAppTypes, isToolAnApp, tools } from 'src/components/notebook-utils'


describe('getAllAppTypes and isToolAnApp', () => {
  it('getAllAppTypes includes tools with a defined appType', () => {
    expect(allAppTypes.sort).toBe([tools.galaxy.appType, tools.cromwell.appType].sort)
  })
  it('isToolAnApp returns if a tool label corresponds to an app', () => {
    expect(isToolAnApp(tools.cromwell.label)).toBeTruthy()
    expect(isToolAnApp(tools.Jupyter.label)).toBeFalsy()
  })
})
