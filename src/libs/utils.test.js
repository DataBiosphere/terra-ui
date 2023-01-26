import { differenceFromNowInSeconds, isValidWsExportTarget } from 'src/libs/utils'
import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/pages/workspaces/workspace/analysis/_testData/testData'


beforeAll(() => {
  jest.useFakeTimers()
})

afterAll(() => {
  jest.useRealTimers()
})

describe('differenceFromNowInSeconds', () => {
  it('returns the number of seconds between current time and server-formatted date', () => {
    const workspaceDate = '2022-04-01T20:17:04.324Z'

    // Month is 0-based, ms will create rounding.
    jest.setSystemTime(new Date(Date.UTC(2022, 3, 1, 20, 17, 5, 0)))
    expect(differenceFromNowInSeconds(workspaceDate)).toBe(0)

    jest.advanceTimersByTime(3000)
    expect(differenceFromNowInSeconds(workspaceDate)).toBe(3)

    jest.advanceTimersByTime(60000)
    expect(differenceFromNowInSeconds(workspaceDate)).toBe(63)
  })
})

describe('isValidWsExportTarget', () => {
  it('Returns true because source and dest workspaces are the same', () => {
    // Arrange
    const sourceWs = {
      ...defaultGoogleWorkspace,
      workspace: {
        ...defaultGoogleWorkspace,
        authorizationDomain: [{}]
      }
    }

    const destWs = {
      ...defaultGoogleWorkspace,
      workspace: {
        ...defaultGoogleWorkspace.workspace,
        workspaceId: 'test-different-workspace-id',
        authorizationDomain: [{}]
      }
    }

    // Act
    const result = isValidWsExportTarget(sourceWs, destWs)

    // Assert
    expect(result).toBe(true)
  })

  it('Returns false match because source and dest workspaces are the same', () => {
    // Arrange
    const sourceWs = defaultGoogleWorkspace
    const destWs = defaultGoogleWorkspace

    // Act
    const result = isValidWsExportTarget(sourceWs, destWs)

    // Assert
    expect(result).toBe(false)
  })

  it('Returns false because AccessLevel does not contain Writer', () => {
    // Arrange
    const sourceWs = defaultGoogleWorkspace
    const destWs = {
      ...defaultGoogleWorkspace,
      accessLevel: 'READER',
      workspace: {
        ...defaultGoogleWorkspace.workspace,
        workspaceId: 'test-different-workspace-id'
      }
    }

    // Act
    const result = isValidWsExportTarget(sourceWs, destWs)

    // Assert
    expect(result).toBe(false)
  })


  it('Returns false because source and destination cloud platforms are not the same.', () => {
    // Arrange
    const sourceWs = {
      ...defaultGoogleWorkspace,
      workspace: {
        ...defaultGoogleWorkspace.workspace,
        authorizationDomain: [{}]
      }
    }

    const destWs = {
      ...defaultAzureWorkspace,
      workspace: {
        ...defaultAzureWorkspace.workspace,
        authorizationDomain: [{}]
      }
    }

    // Act
    const result = isValidWsExportTarget(sourceWs, destWs)

    // Assert
    expect(result).toBe(false)
  })

  it('Returns false because source and destination cloud platforms are not the same.', () => {
    // Arrange
    const sourceWs = {
      ...defaultGoogleWorkspace,
      workspace: {
        ...defaultGoogleWorkspace.workspace,
        authorizationDomain: [{}]
      }
    }

    const destWs = {
      ...defaultGoogleWorkspace,
      workspace: {
        ...defaultGoogleWorkspace.workspace,
        authorizationDomain: [{ membersGroupName: 'wooo' }],
        workspaceId: 'test-different-workspace-id'
      }
    }

    // Act
    const result = isValidWsExportTarget(sourceWs, destWs)

    // Assert
    expect(result).toBe(false)
  })
})
