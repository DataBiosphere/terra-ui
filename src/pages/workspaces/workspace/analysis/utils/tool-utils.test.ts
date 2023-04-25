import { getConfig } from 'src/libs/config'
import { cloudProviderTypes } from 'src/libs/workspace-utils'
import { appToolLabels, isSettingsSupported } from 'src/pages/workspaces/workspace/analysis/utils/tool-utils'
import { asMockedFn } from 'src/testing/test-utils'


jest.mock('src/libs/config', () => ({
  ...jest.requireActual('src/libs/config'),
  getConfig: jest.fn().mockReturnValue({})
}))

type StateExports = typeof import('src/libs/state')
jest.mock('src/libs/state', (): StateExports => {
  return {
    ...jest.requireActual('src/libs/state'),
    getUser: jest.fn(() => ({ email: 'workspace-creator@example.com' })),
  }
})

describe('isSettingsSupported - Non-Prod', () => {
  beforeEach(() => {
    asMockedFn(getConfig).mockReturnValue({ isProd: false })
  })

  const testCases = [
    // Azure workspace created after Workflows Public Preview with app type Cromwell
    { toolLabel: appToolLabels.CROMWELL, cloudProvider: cloudProviderTypes.AZURE, createdBy: 'workspace-creator@example.com', createdDate: '2023-03-28T20:28:01.998494Z', expectedResult: true },
    { toolLabel: appToolLabels.CROMWELL, cloudProvider: cloudProviderTypes.AZURE, createdBy: 'not-workspace-creator@example.com', createdDate: '2023-03-28T20:28:01.998494Z', expectedResult: false },
    // Azure workspace created before Workflows Public Preview with app type Cromwell
    { toolLabel: appToolLabels.CROMWELL, cloudProvider: cloudProviderTypes.AZURE, createdBy: 'workspace-creator@example.com', createdDate: '2023-03-19T20:28:01.998494Z', expectedResult: true },
    { toolLabel: appToolLabels.CROMWELL, cloudProvider: cloudProviderTypes.AZURE, createdBy: 'not-workspace-creator@example.com', createdDate: '2023-03-19T20:28:01.998494Z', expectedResult: false },
    // GCP workspaces and other app types
    { toolLabel: appToolLabels.CROMWELL, cloudProvider: cloudProviderTypes.GCP, createdBy: 'workspace-creator@example.com', createdDate: '2023-03-19T20:28:01.998494Z', expectedResult: true },
    { toolLabel: appToolLabels.CROMWELL, cloudProvider: cloudProviderTypes.GCP, createdBy: 'not-workspace-creator@example.com', createdDate: '2023-03-19T20:28:01.998494Z', expectedResult: true },
    { toolLabel: appToolLabels.GALAXY, cloudProvider: cloudProviderTypes.AZURE, createdBy: 'not-workspace-creator@example.com', createdDate: '2023-03-19T20:28:01.998494Z', expectedResult: true },
  ]

  test.each(testCases)('should return $expectedResult for $toolLabel app in $cloudProvider workspace based on workspace creator and creation date (non-Prod)', ({ toolLabel, cloudProvider, createdBy, createdDate, expectedResult }) => {
    expect(isSettingsSupported(toolLabel, cloudProvider, createdBy, createdDate)).toBe(expectedResult)
  })
})

describe('isSettingsSupported - Prod', () => {
  beforeEach(() => {
    asMockedFn(getConfig).mockReturnValue({ isProd: true })
  })

  const testCases = [
    // Azure workspace created after Workflows Public Preview with app type Cromwell
    { toolLabel: appToolLabels.CROMWELL, cloudProvider: cloudProviderTypes.AZURE, createdBy: 'workspace-creator@example.com', createdDate: '2023-03-28T20:28:01.998494Z', expectedResult: true },
    { toolLabel: appToolLabels.CROMWELL, cloudProvider: cloudProviderTypes.AZURE, createdBy: 'not-workspace-creator@example.com', createdDate: '2023-03-28T20:28:01.998494Z', expectedResult: false },
    // Azure workspace created before Workflows Public Preview with app type Cromwell
    { toolLabel: appToolLabels.CROMWELL, cloudProvider: cloudProviderTypes.AZURE, createdBy: 'workspace-creator@example.com', createdDate: '2023-03-19T20:28:01.998494Z', expectedResult: false },
    { toolLabel: appToolLabels.CROMWELL, cloudProvider: cloudProviderTypes.AZURE, createdBy: 'not-workspace-creator@example.com', createdDate: '2023-03-19T20:28:01.998494Z', expectedResult: false },
    // GCP workspaces and other app types
    { toolLabel: appToolLabels.CROMWELL, cloudProvider: cloudProviderTypes.GCP, createdBy: 'workspace-creator@example.com', createdDate: '2023-03-19T20:28:01.998494Z', expectedResult: true },
    { toolLabel: appToolLabels.CROMWELL, cloudProvider: cloudProviderTypes.GCP, createdBy: 'not-workspace-creator@example.com', createdDate: '2023-03-19T20:28:01.998494Z', expectedResult: true },
    { toolLabel: appToolLabels.GALAXY, cloudProvider: cloudProviderTypes.AZURE, createdBy: 'not-workspace-creator@example.com', createdDate: '2023-03-19T20:28:01.998494Z', expectedResult: true },
  ]

  test.each(testCases)('should return $expectedResult for $toolLabel app in $cloudProvider workspace based on workspace creator and creation date (Prod)', ({ toolLabel, cloudProvider, createdBy, createdDate, expectedResult }) => {
    expect(isSettingsSupported(toolLabel, cloudProvider, createdBy, createdDate)).toBe(expectedResult)
  })
})
