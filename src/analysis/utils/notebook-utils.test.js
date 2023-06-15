import { allAppTypes, appToolLabels, appTools, isAppToolLabel, runtimeToolLabels } from 'src/analysis/utils/tool-utils';

describe('getAllAppTypes and isToolAnApp', () => {
  it('getAllAppTypes includes tools with a defined appType', () => {
    expect(allAppTypes.sort).toBe([appTools.GALAXY.label, appTools.GALAXY.label].sort);
  });
  it('isToolAnApp returns if a tool label corresponds to an app', () => {
    expect(isAppToolLabel(appToolLabels.CROMWELL)).toBeTruthy();
    expect(isAppToolLabel(runtimeToolLabels.Jupyter)).toBeFalsy();
  });
});
