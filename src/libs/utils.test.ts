import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/analysis/_testData/testData';
import {
  condTyped,
  DEFAULT,
  differenceFromNowInSeconds,
  formatBytes,
  isValidWsExportTarget,
  textMatch,
} from 'src/libs/utils';

beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

describe('differenceFromNowInSeconds', () => {
  it('returns the number of seconds between current time and server-formatted date', () => {
    const workspaceDate = '2022-04-01T20:17:04.324Z';

    // Month is 0-based, ms will create rounding.
    jest.setSystemTime(new Date(Date.UTC(2022, 3, 1, 20, 17, 5, 0)));
    expect(differenceFromNowInSeconds(workspaceDate)).toBe(0);

    jest.advanceTimersByTime(3000);
    expect(differenceFromNowInSeconds(workspaceDate)).toBe(3);

    jest.advanceTimersByTime(60000);
    expect(differenceFromNowInSeconds(workspaceDate)).toBe(63);
  });
});

describe('isValidWsExportTarget', () => {
  it('Returns true because source and dest workspaces are the same', () => {
    // Arrange
    const sourceWs = {
      ...defaultGoogleWorkspace,
      workspace: {
        ...defaultGoogleWorkspace,
        authorizationDomain: [{}],
      },
    };

    const destWs = {
      ...defaultGoogleWorkspace,
      workspace: {
        ...defaultGoogleWorkspace.workspace,
        workspaceId: 'test-different-workspace-id',
        authorizationDomain: [{}],
      },
    };

    // Act
    const result = isValidWsExportTarget(sourceWs, destWs);

    // Assert
    expect(result).toBe(true);
  });

  it('Returns false match because source and dest workspaces are the same', () => {
    // Arrange
    const sourceWs = defaultGoogleWorkspace;
    const destWs = defaultGoogleWorkspace;

    // Act
    const result = isValidWsExportTarget(sourceWs, destWs);

    // Assert
    expect(result).toBe(false);
  });

  it('Returns false because AccessLevel does not contain Writer', () => {
    // Arrange
    const sourceWs = defaultGoogleWorkspace;
    const destWs = {
      ...defaultGoogleWorkspace,
      accessLevel: 'READER',
      workspace: {
        ...defaultGoogleWorkspace.workspace,
        workspaceId: 'test-different-workspace-id',
      },
    };

    // Act
    const result = isValidWsExportTarget(sourceWs, destWs);

    // Assert
    expect(result).toBe(false);
  });

  it('Returns false because source and destination cloud platforms are not the same.', () => {
    // Arrange
    const sourceWs = {
      ...defaultGoogleWorkspace,
      workspace: {
        ...defaultGoogleWorkspace.workspace,
        authorizationDomain: [{}],
      },
    };

    const destWs = {
      ...defaultAzureWorkspace,
      workspace: {
        ...defaultAzureWorkspace.workspace,
        authorizationDomain: [{}],
      },
    };

    // Act
    const result = isValidWsExportTarget(sourceWs, destWs);

    // Assert
    expect(result).toBe(false);
  });

  it('Returns false because source and destination cloud platforms are not the same.', () => {
    // Arrange
    const sourceWs = {
      ...defaultGoogleWorkspace,
      workspace: {
        ...defaultGoogleWorkspace.workspace,
        authorizationDomain: [{}],
      },
    };

    const destWs = {
      ...defaultGoogleWorkspace,
      workspace: {
        ...defaultGoogleWorkspace.workspace,
        authorizationDomain: [{ membersGroupName: 'wooo' }],
        workspaceId: 'test-different-workspace-id',
      },
    };

    // Act
    const result = isValidWsExportTarget(sourceWs, destWs);

    // Assert
    expect(result).toBe(false);
  });
});

describe('formatBytes', () => {
  it('handles GB', () => {
    // Act
    const result = formatBytes(40000000000);

    // Assert
    expect(result).toBe('37.3 GiB');
  });
  it('handles MB', () => {
    // Act
    const result = formatBytes(40000000);

    // Assert
    expect(result).toBe('38.1 MiB');
  });
  it('handles fallback case', () => {
    // Act
    const result = formatBytes(40);

    // Assert
    expect(result).toBe('40 B');
  });
});

describe('textMatch', () => {
  it.each([
    { needle: 'success', haystack: 'success', result: true },
    { needle: 'Succes', haystack: 'successss', result: true },
    { needle: 'nomatch', haystack: '404', result: false },
  ])('properly determines if the needle is in the haystack', ({ needle, haystack, result }) => {
    // Act
    const doesMatch = textMatch(needle, haystack);
    expect(doesMatch).toBe(result);
  });

  // add test for condTyped
  describe('condTyped', () => {
    it('handles constant results', () => {
      expect(condTyped<string>([false, () => 'def'], [true, 'abc'])).toBe('abc');
    });
    it('handles function results', () => {
      expect(condTyped<string>([false, 'def'], [true, () => 'abc'])).toBe('abc');
    });
    it('handles DEFAULT', () => {
      expect(condTyped<string>([false, 'def'], [DEFAULT, 'abc'])).toBe('abc');
    });
  });
});
