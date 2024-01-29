import { asMockedFn } from '@terra-ui-packages/test-utils';
import { signOut } from 'src/auth/auth';
import { revokeTokens } from 'src/auth/oidc-broker';
import { Ajax } from 'src/libs/ajax';
import { withRetryAfterReloadingExpiredAuthToken } from 'src/libs/ajax/ajax-common';
import { MetricsContract } from 'src/libs/ajax/Metrics';
import { fetchOk } from 'src/libs/ajax/network-core/fetch-core';

type AjaxCommonExports = typeof import('src/libs/ajax/ajax-common');
jest.mock(
  'src/libs/ajax/ajax-common',
  (): AjaxCommonExports => ({
    ...jest.requireActual<AjaxCommonExports>('src/libs/ajax/ajax-common'),
    withRetryAfterReloadingExpiredAuthToken: jest.fn(),
  })
);

type FetchCoreExports = typeof import('src/libs/ajax/network-core/fetch-core');
jest.mock(
  'src/libs/ajax/network-core/fetch-core',
  (): FetchCoreExports => ({
    ...jest.requireActual<FetchCoreExports>('src/libs/ajax/network-core/fetch-core'),
    fetchOk: jest.fn(),
  })
);

type AjaxExports = typeof import('src/libs/ajax');
jest.mock('src/libs/ajax');
type AjaxContract = ReturnType<AjaxExports['Ajax']>;

type MetricsNeeds = Pick<MetricsContract, 'captureEvent'>;
interface AjaxMockNeeds {
  Metrics: MetricsNeeds;
}

type OidcExports = typeof import('src/auth/oidc-broker');
jest.mock(
  'src/auth/oidc-broker',
  (): OidcExports => ({
    ...jest.requireActual('src/auth/oidc-broker'),
    revokeTokens: jest.fn(),
  })
);

const mockAjaxNeeds = (): AjaxMockNeeds => {
  const partialMetrics: MetricsNeeds = {
    captureEvent: jest.fn(),
  };

  const actualAjax: AjaxExports = jest.requireActual('src/libs/ajax');
  const actualRuntimes = actualAjax.Ajax().Runtimes;
  const mockMetrics = partialMetrics as MetricsContract;

  asMockedFn(Ajax).mockReturnValue({
    Runtimes: actualRuntimes,
    Metrics: mockMetrics,
  } as AjaxContract);

  return {
    Metrics: partialMetrics,
  };
};

describe('auth', () => {
  describe('signOut', () => {
    // This test mocks all api calls in sign out to throw an error, and ensures sign out functions properly
    // This is a very important test to update whenever you add API calls to sign out
    // There have been multiple production incidents when the code does not properly ignore errors in API calls in sign out
    it('properly signs out when underlying an API call errors due to token expiration', async () => {
      // Arrange
      const mockAjax = mockAjaxNeeds();
      asMockedFn(mockAjax.Metrics.captureEvent).mockImplementation(() => Promise.reject('capture event error'));
      asMockedFn(fetchOk).mockImplementation(() =>
        Promise.reject(new Response(JSON.stringify({ success: false }), { status: 401 }))
      );
      asMockedFn(revokeTokens).mockImplementation(() => Promise.reject('revoke token error'));
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      await signOut();

      // Assert
      expect(Ajax).toBeCalledTimes(2);
      expect(mockAjax.Metrics.captureEvent).toBeCalledTimes(1);
      expect(revokeTokens).toBeCalledTimes(1);
      expect(withRetryAfterReloadingExpiredAuthToken).toBeCalledTimes(0);
      expect(fetchOk).toBeCalledTimes(1);
    });
  });
});
