import * as Utils from 'src/libs/utils'


jest.mock('src/configStore', () => ({
  loadedConfigStore: { current: { jest: true } }
}))

// Mock dates due to time zone issues
jest.spyOn(Utils, 'makePrettyDate').mockImplementation(() => '***MOCKED DATE***')
