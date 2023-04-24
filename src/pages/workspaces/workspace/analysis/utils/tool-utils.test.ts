import { getConfig } from 'src/libs/config'
import { cloudProviderTypes } from 'src/libs/workspace-utils'
import { appToolLabels, isSettingsSupported } from 'src/pages/workspaces/workspace/analysis/utils/tool-utils'
import { asMockedFn } from 'src/testing/test-utils'


jest.mock('src/libs/config', () => ({
  ...jest.requireActual('src/libs/config'),
  getConfig: jest.fn().mockReturnValue({})
}))

describe('isSettingsSupported - Non-Prod', () => {
  beforeEach(() => {
    asMockedFn(getConfig).mockReturnValue({ isProd: false })
  })

  const testCases = [
    // Azure workspace created after Workflows Public Preview with app type Cromwell
    { toolLabel: appToolLabels.CROMWELL, cloudProvider: cloudProviderTypes.AZURE, accessLevel: 'OWNER', createdDate: '2023-03-28T20:28:01.998494Z', expectedResult: true },
    { toolLabel: appToolLabels.CROMWELL, cloudProvider: cloudProviderTypes.AZURE, accessLevel: 'READER', createdDate: '2023-03-28T20:28:01.998494Z', expectedResult: false },
    { toolLabel: appToolLabels.CROMWELL, cloudProvider: cloudProviderTypes.AZURE, accessLevel: 'WRITER', createdDate: '2023-03-28T20:28:01.998494Z', expectedResult: false },
    // Azure workspace created before Workflows Public Preview with app type Cromwell
    { toolLabel: appToolLabels.CROMWELL, cloudProvider: cloudProviderTypes.AZURE, accessLevel: 'OWNER', createdDate: '2023-03-19T20:28:01.998494Z', expectedResult: true },
    { toolLabel: appToolLabels.CROMWELL, cloudProvider: cloudProviderTypes.AZURE, accessLevel: 'READER', createdDate: '2023-03-19T20:28:01.998494Z', expectedResult: false },
    { toolLabel: appToolLabels.CROMWELL, cloudProvider: cloudProviderTypes.AZURE, accessLevel: 'WRITER', createdDate: '2023-03-19T20:28:01.998494Z', expectedResult: false },
    // GCP workspaces and other app types
    { toolLabel: appToolLabels.CROMWELL, cloudProvider: cloudProviderTypes.GCP, accessLevel: 'OWNER', createdDate: '2023-03-19T20:28:01.998494Z', expectedResult: true },
    { toolLabel: appToolLabels.CROMWELL, cloudProvider: cloudProviderTypes.GCP, accessLevel: 'WRITER', createdDate: '2023-03-19T20:28:01.998494Z', expectedResult: true },
    { toolLabel: appToolLabels.GALAXY, cloudProvider: cloudProviderTypes.AZURE, accessLevel: 'OWNER', createdDate: '2023-03-19T20:28:01.998494Z', expectedResult: true },
  ]

  test.each(testCases)('should return $expectedResult for $toolLabel app in $cloudProvider workspace based on access level and workspace creation date', ({ toolLabel, cloudProvider, accessLevel, createdDate, expectedResult }) => {
    expect(isSettingsSupported(toolLabel, cloudProvider, accessLevel, createdDate)).toBe(expectedResult)
  })
})

describe('isSettingsSupported - Prod', () => {
  beforeEach(() => {
    asMockedFn(getConfig).mockReturnValue({ isProd: true })
  })

  const testCases = [
    // Azure workspace created after Workflows Public Preview with app type Cromwell
    { toolLabel: appToolLabels.CROMWELL, cloudProvider: cloudProviderTypes.AZURE, accessLevel: 'OWNER', createdDate: '2023-03-28T20:28:01.998494Z', expectedResult: true },
    { toolLabel: appToolLabels.CROMWELL, cloudProvider: cloudProviderTypes.AZURE, accessLevel: 'READER', createdDate: '2023-03-28T20:28:01.998494Z', expectedResult: false },
    { toolLabel: appToolLabels.CROMWELL, cloudProvider: cloudProviderTypes.AZURE, accessLevel: 'WRITER', createdDate: '2023-03-28T20:28:01.998494Z', expectedResult: false },
    // Azure workspace created before Workflows Public Preview with app type Cromwell
    { toolLabel: appToolLabels.CROMWELL, cloudProvider: cloudProviderTypes.AZURE, accessLevel: 'OWNER', createdDate: '2023-03-19T20:28:01.998494Z', expectedResult: false },
    { toolLabel: appToolLabels.CROMWELL, cloudProvider: cloudProviderTypes.AZURE, accessLevel: 'READER', createdDate: '2023-03-19T20:28:01.998494Z', expectedResult: false },
    { toolLabel: appToolLabels.CROMWELL, cloudProvider: cloudProviderTypes.AZURE, accessLevel: 'WRITER', createdDate: '2023-03-19T20:28:01.998494Z', expectedResult: false },
    // GCP workspaces and other app types
    { toolLabel: appToolLabels.CROMWELL, cloudProvider: cloudProviderTypes.GCP, accessLevel: 'OWNER', createdDate: '2023-03-19T20:28:01.998494Z', expectedResult: true },
    { toolLabel: appToolLabels.CROMWELL, cloudProvider: cloudProviderTypes.GCP, accessLevel: 'WRITER', createdDate: '2023-03-19T20:28:01.998494Z', expectedResult: true },
    { toolLabel: appToolLabels.GALAXY, cloudProvider: cloudProviderTypes.AZURE, accessLevel: 'OWNER', createdDate: '2023-03-19T20:28:01.998494Z', expectedResult: true },
  ]

  test.each(testCases)('should return $expectedResult for $toolLabel app in $cloudProvider workspace based on access level and workspace creation date', ({ toolLabel, cloudProvider, accessLevel, createdDate, expectedResult }) => {
    expect(isSettingsSupported(toolLabel, cloudProvider, accessLevel, createdDate)).toBe(expectedResult)
  })
})
