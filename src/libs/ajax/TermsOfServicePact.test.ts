import 'setimmediate';

import { MatchersV3, PactV3, SpecificationVersion } from '@pact-foundation/pact';
import { fromProviderState } from '@pact-foundation/pact/src/v3/matchers';
import path from 'path';
import { fetchSam } from 'src/libs/ajax/ajax-common';
import { TermsOfService } from 'src/libs/ajax/TermsOfService';

jest.mock('src/libs/ajax/ajax-common', () => ({
  ...jest.requireActual('src/libs/ajax/ajax-common'),
  fetchFromProxy: jest.fn(),
  fetchOk: jest.fn(),
  authOpts: jest.fn(),
  fetchSam: jest.fn(),
}));

jest.mock('src/auth/auth', () => {
  return {
    reloadAuthToken: jest.fn(),
    signOutAfterSessionTimeout: jest.fn(),
    getAuthToken: jest.fn(),
  };
});

const { boolean } = MatchersV3;

const termsOfServicePact = new PactV3({
  consumer: 'terraui',
  provider: 'sam',
  logLevel: 'error',
  dir: path.resolve(process.cwd(), 'pacts'),
  spec: SpecificationVersion.SPECIFICATION_VERSION_V3,
});

describe('TermsOfService tests', () => {
  it('should GET details of the currently deployed terms of service version', async () => {
    const expectedResponse = {
      enforced: boolean(true),
      // eslint-disable-next-line no-template-curly-in-string
      currentVersion: fromProviderState('${terms_of_service_version}', '01-01-2024'),
      inGracePeriod: boolean(true),
      inRollingAcceptanceWindow: boolean(true),
    };

    await termsOfServicePact.addInteraction({
      states: [
        { description: 'terms of service is enforced' },
        { description: 'user is in acceptance window and grace period' },
      ],
      uponReceiving: 'return details of the currently deployed terms of service version',
      withRequest: {
        method: 'GET',
        path: '/termsOfService/v1',
      },
      willRespondWith: { status: 200, body: expectedResponse },
    });

    await termsOfServicePact.executeTest(async (mockService) => {
      // ARRANGE
      fetchSam.mockImplementation(async (path) => await fetch(`${mockService.url}/${path}`));

      const fakeSignal = new AbortController().signal;

      // ACT
      const response = await TermsOfService(fakeSignal).getTermsOfServiceConfig();

      // ASSERT
      expect(response).toBeDefined();
      expect(fetchSam).toBeCalledTimes(1);
      expect(fetchSam).toBeCalledWith('termsOfService/v1', {
        signal: fakeSignal,
      });
    });
  });

  it('should GET terms of service text', async () => {
    const expectedResponse = 'terms of service text';

    await termsOfServicePact.addInteraction({
      uponReceiving: 'return the terms of service text',
      withRequest: {
        method: 'GET',
        path: '/termsOfService/v1/docs',
        query: { doc: 'termsOfService' },
      },
      willRespondWith: { status: 200, body: expectedResponse },
    });

    await termsOfServicePact.executeTest(async (mockService) => {
      // ARRANGE
      fetchSam.mockImplementation(async (path) => await fetch(`${mockService.url}/${path}`));

      const fakeSignal = new AbortController().signal;

      // ACT
      const response = await TermsOfService(fakeSignal).getTermsOfServiceText();

      // ASSERT
      expect(response).toBeDefined();
      expect(fetchSam).toBeCalledTimes(1);
      expect(fetchSam).toBeCalledWith('termsOfService/v1/docs?doc=termsOfService', {
        signal: fakeSignal,
      });
    });
  });

  it('should GET details of the requesting users terms of service status', async () => {
    const expectedResponse = {
      // eslint-disable-next-line no-template-curly-in-string
      latestAcceptedVersion: fromProviderState('${terms_of_service_version}', '01-01-2023'),
      // eslint-disable-next-line no-template-curly-in-string
      acceptedOn: fromProviderState('${user_accepted_on}', '2024-01-08T21:01:37.660Z'),
      permitsSystemUsage: boolean(true),
      isCurrentVersion: boolean(true),
    };

    await termsOfServicePact.addInteraction({
      states: [
        { description: 'terms of service is enforced' },
        { description: 'user accepted latest terms of service version' },
      ],
      uponReceiving: 'return user terms of service details',
      withRequest: {
        method: 'GET',
        path: '/api/termsOfService/v1/user/self',
      },
      willRespondWith: { status: 200, body: expectedResponse },
    });

    await termsOfServicePact.executeTest(async (mockService) => {
      // ARRANGE
      fetchSam.mockImplementation(async (path) => await fetch(`${mockService.url}/${path}`));

      const fakeSignal = new AbortController().signal;

      // ACT
      const response = await TermsOfService(fakeSignal).getUserTermsOfServiceDetails();

      // ASSERT
      expect(response).toBeDefined();
      expect(fetchSam).toBeCalledTimes(1);
      expect(fetchSam).toBeCalledWith('api/termsOfService/v1/user/self', {
        signal: fakeSignal,
      });
    });
  });

  it('should PUT acceptance of the current terms of service for a user', async () => {
    await termsOfServicePact.addInteraction({
      states: [{ description: 'terms of service is enforced' }],
      uponReceiving: 'return 204',
      withRequest: {
        method: 'PUT',
        path: '/api/termsOfService/v1/user/self/accept',
      },
      willRespondWith: { status: 204 },
    });

    await termsOfServicePact.executeTest(async (mockService) => {
      // ARRANGE
      fetchSam.mockImplementation(
        async (path) =>
          await fetch(`${mockService.url}/${path}`, {
            method: 'PUT',
          })
      );

      const fakeSignal = new AbortController().signal;

      // ACT
      const response = await TermsOfService(fakeSignal).acceptTermsOfService();

      // ASSERT
      expect(response).toBeDefined();
      expect(fetchSam).toBeCalledTimes(1);
      expect(fetchSam).toBeCalledWith('api/termsOfService/v1/user/self/accept', {
        signal: fakeSignal,
        method: 'PUT',
      });
    });
  });

  it('should PUT rejection of the current terms of service for a user', async () => {
    await termsOfServicePact.addInteraction({
      states: [{ description: 'terms of service is enforced' }],
      uponReceiving: 'return 204',
      withRequest: {
        method: 'PUT',
        path: '/api/termsOfService/v1/user/self/reject',
      },
      willRespondWith: { status: 204 },
    });

    await termsOfServicePact.executeTest(async (mockService) => {
      // ARRANGE
      fetchSam.mockImplementation(
        async (path) =>
          await fetch(`${mockService.url}/${path}`, {
            method: 'PUT',
          })
      );

      const fakeSignal = new AbortController().signal;

      // ACT
      const response = await TermsOfService(fakeSignal).rejectTermsOfService();

      // ASSERT
      expect(response).toBeDefined();
      expect(fetchSam).toBeCalledTimes(1);
      expect(fetchSam).toBeCalledWith('api/termsOfService/v1/user/self/reject', {
        signal: fakeSignal,
        method: 'PUT',
      });
    });
  });
});
