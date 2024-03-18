import { abandonedPromise } from '@terra-ui-packages/core-utils';
import { asMockedFn } from '@terra-ui-packages/test-utils';
import { renderHook } from '@testing-library/react';
import { User } from 'src/libs/ajax/User';
import { renderHookInAct } from 'src/testing/test-utils';

import { useProxyGroup } from './useProxyGroup';

// Workaround for import cycle.
jest.mock('src/auth/auth');

type LogoutExports = typeof import('src/auth/auth-events/logout');
jest.mock(
  'src/auth/auth-events/logout',
  (): LogoutExports => ({
    signOut: jest.fn(),
  })
);

type UserExports = typeof import('src/libs/ajax/User');
jest.mock('src/libs/ajax/User', (): UserExports => {
  return {
    ...jest.requireActual<UserExports>('src/libs/ajax/User'),
    User: jest.fn(),
  };
});

type UserContract = ReturnType<typeof User>;

describe('useProxyGroup', () => {
  it('requests proxy group', () => {
    // Arrange
    const getProxyGroup = jest.fn().mockImplementation(() => abandonedPromise());
    asMockedFn(User).mockImplementation(() => ({ getProxyGroup } as unknown as UserContract));

    // Act
    const { result: hookReturnRef } = renderHook(() => useProxyGroup('user@example.com'));

    // Assert
    expect(getProxyGroup).toHaveBeenCalledWith('user@example.com');

    const result = hookReturnRef.current;
    expect(result).toEqual({
      proxyGroup: {
        status: 'Loading',
        state: null,
      },
    });
  });

  it('returns URL', async () => {
    // Arrange
    const getProxyGroup = jest.fn().mockResolvedValue('PROXY_123abc@dev.test.firecloud.org');
    asMockedFn(User).mockImplementation(() => ({ getProxyGroup } as unknown as UserContract));

    // Act
    const { result: hookReturnRef } = await renderHookInAct(() => useProxyGroup('user@example.com'));

    // Assert
    const result = hookReturnRef.current;
    expect(result).toEqual({
      proxyGroup: {
        status: 'Ready',
        state: 'PROXY_123abc@dev.test.firecloud.org',
      },
    });
  });

  it('handles errors', async () => {
    // Arrange
    const getProxyGroup = jest.fn().mockRejectedValue(new Error('Something went wrong'));
    asMockedFn(User).mockImplementation(() => ({ getProxyGroup } as unknown as UserContract));

    // Act
    const { result: hookReturnRef } = await renderHookInAct(() => useProxyGroup('user@example.com'));

    // Assert
    const result = hookReturnRef.current;
    expect(result).toEqual({
      proxyGroup: {
        status: 'Error',
        state: null,
        error: new Error('Something went wrong'),
      },
    });
  });
});
