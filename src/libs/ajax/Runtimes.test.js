import { authOpts, fetchLeo } from 'src/libs/ajax/ajax-common'
import { Runtimes } from 'src/libs/ajax/Runtimes'


jest.mock('src/libs/ajax/ajax-common', () => ({
  fetchLeo: jest.fn(),
  authOpts: jest.fn()
}))

describe('Runtimes ajax', () => {
  const mockFetchLeo = jest.fn()
  beforeEach(() => {
    fetchLeo.mockImplementation(mockFetchLeo)
    authOpts.mockImplementation(jest.fn())
  })

  it.each([
    { googleProject: 'test', runtimeName: 'runtime1', workspaceId: undefined },
    { googleProject: undefined, runtimeName: 'runtime2', workspaceId: 'test' }
  ])('should call the appropriate leo version API for stop function based on the runtime workspaceId: ($workspaceId)', async runtime => {
    // Arrange
    // Act
    await Runtimes().runtimeWrapper(runtime).stop()

    // Assert
    if (runtime.workspaceId) {
      expect(mockFetchLeo).toHaveBeenCalledWith(`api/v2/runtimes/${runtime.workspaceId}/${runtime.runtimeName}/stop`, expect.anything())
    } else {
      expect(mockFetchLeo).toHaveBeenCalledWith(`api/google/v1/runtimes/${runtime.googleProject}/${runtime.runtimeName}/stop`, expect.anything())
    }
  })

  it.each([
    { googleProject: 'test', runtimeName: 'runtime1', workspaceId: undefined },
    { googleProject: undefined, runtimeName: 'runtime2', workspaceId: 'test' }
  ])('should call the appropriate leo version API for start function based on the runtime workspaceId: ($workspaceId)', async runtime => {
    // Arrange
    // Act
    await Runtimes().runtimeWrapper(runtime).start()

    // Assert
    if (runtime.workspaceId) {
      expect(mockFetchLeo).toHaveBeenCalledWith(`api/v2/runtimes/${runtime.workspaceId}/${runtime.runtimeName}/start`, expect.anything())
    } else {
      expect(mockFetchLeo).toHaveBeenCalledWith(`api/google/v1/runtimes/${runtime.googleProject}/${runtime.runtimeName}/start`, expect.anything())
    }
  })
})
