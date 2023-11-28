import { reportError } from 'src/libs/error';
import { renderHookInAct } from 'src/testing/test-utils';

import { useRemoteResource } from './useRemoteResource';

// Mock the entire auth module to work around the auth/ajax-common import cycle.
jest.mock('src/auth/auth');

type ErrorExports = typeof import('src/libs/error');
jest.mock('src/libs/error', (): ErrorExports => {
  return {
    ...jest.requireActual<ErrorExports>('src/libs/error'),
    reportError: jest.fn(),
  };
});

describe('useRemoteResource', () => {
  it('returns a remotely-loaded resource', async () => {
    // Arrange
    const remoteFn = jest.fn().mockResolvedValue('remote text');

    // Act
    const { result: hookReturnRef } = await renderHookInAct(() =>
      useRemoteResource('initial text', remoteFn, 'error message')
    );
    const result = hookReturnRef.current;

    // Assert
    expect(remoteFn).toHaveBeenCalledTimes(1);
    expect(result.resourceState.resource).toEqual('remote text');
  });
  it('reports errors', async () => {
    // Arrange
    const remoteFn = jest.fn().mockRejectedValue('whoops');

    // Act
    const { result: hookReturnRef } = await renderHookInAct(() =>
      useRemoteResource('initial text', remoteFn, 'error message')
    );
    const result = hookReturnRef.current;

    // Assert
    expect(remoteFn).toHaveBeenCalledTimes(1);
    expect(result.resourceState.resource).toEqual('initial text');
    expect(reportError).toHaveBeenCalledTimes(1);
  });
});
