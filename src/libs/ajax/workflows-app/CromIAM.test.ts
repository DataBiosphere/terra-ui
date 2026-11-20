import { authOpts } from 'src/auth/auth-session';
import { fetchOrchestration } from 'src/libs/ajax/ajax-common';
import { CromIAM } from 'src/libs/ajax/workflows-app/CromIAM';
import { asMockedFn } from 'src/testing/test-utils';

type AjaxCommonExports = typeof import('src/libs/ajax/ajax-common');
jest.mock(
  'src/libs/ajax/ajax-common',
  (): Partial<AjaxCommonExports> => ({
    fetchOrchestration: jest.fn(),
  })
);

type AuthSessionExports = typeof import('src/auth/auth-session');
jest.mock(
  'src/auth/auth-session',
  (): AuthSessionExports => ({
    ...jest.requireActual<AuthSessionExports>('src/auth/auth-session'),
    authOpts: jest.fn(),
  })
);

describe('CromIAM ajax', () => {
  describe('workflowMetadata', () => {
    it('requests the metadata keys and bypasses the HTTP cache', async () => {
      // Arrange
      const metadata = { id: 'wf-id', status: 'Running' };
      asMockedFn(authOpts).mockReturnValue({ headers: { Authorization: 'Bearer token' } });
      asMockedFn(fetchOrchestration).mockResolvedValue(new Response(JSON.stringify(metadata)));
      const signal = new window.AbortController().signal;

      // Act
      const result = await CromIAM(signal).workflowMetadata('wf-id', ['calls', 'status'], ['callCaching:hitFailures']);

      // Assert
      expect(result).toEqual(metadata);
      expect(fetchOrchestration).toHaveBeenCalledWith(
        'api/workflows/v1/wf-id/metadata?includeKey=calls&includeKey=status&excludeKey=callCaching%3AhitFailures',
        { headers: { Authorization: 'Bearer token' }, signal, cache: 'no-store' }
      );
    });
  });
});
