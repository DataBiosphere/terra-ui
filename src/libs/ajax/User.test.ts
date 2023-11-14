import { PactV3, SpecificationVersion, V3MockServer } from '@pact-foundation/pact';
import path from 'path';
import { fetchFromProxy, fetchOk } from 'src/libs/ajax/ajax-common';
import { SamUserTosComplianceStatusResponse, User } from 'src/libs/ajax/User';
import { asMockedFn } from 'src/testing/test-utils';

import { kvArrayToObject, SamUserTosStatusResponse } from './User';

// Workaround for circular import issues.
jest.mock('src/auth/auth');

const samUserPact: PactV3 = new PactV3({
  consumer: 'terra-ui',
  provider: 'sam',
  // log: path.resolve(process.cwd(), 'logs', 'pact.log'),
  logLevel: 'error',
  dir: path.resolve(process.cwd(), 'pacts'),
  spec: SpecificationVersion.SPECIFICATION_VERSION_V3,
});
describe('User network request tests', () => {
  it('Getting the tos text will return the tos text string', async () => {
    const expectedResponse = '';

    samUserPact.addInteraction({
      states: [{ description: 'tos version 1 is the latest' }],
      uponReceiving: 'get tos text',
      withRequest: { method: 'GET', path: '/tos/text' },
      willRespondWith: { status: 200, body: expectedResponse },
    });

    await samUserPact.executeTest(async (mockService: V3MockServer) => {
      // ARRANGE
      asMockedFn(fetchOk).mockImplementation(async (path: string) => await fetch(`${mockService.url}/${path}`));
      asMockedFn(fetchFromProxy).mockImplementation(() => fetchOk);

      // ACT
      const response = await User().getTos();

      // ASSERT
      expect(response).toBeDefined();
      expect(fetchOk).toBeCalledTimes(1);
      expect(fetchFromProxy).toBeCalledTimes(1);
      expect(fetchOk).toBeCalledWith('tos/text', {
        method: 'GET',
      });
      expect(response).toEqual(expectedResponse);
    });
  });

  it("Accepting the tos will return the user's tos status", async () => {
    const expectedResponse: SamUserTosStatusResponse = {
      enabled: { allUsersGroup: true, google: true, ldap: true },
      userInfo: { userEmail: '', userSubjectId: '' }, // need to determine what these are
    };

    samUserPact.addInteraction({
      states: [{ description: 'user exists' }, { description: 'user is enabled' }],
      uponReceiving: 'accept tos',
      withRequest: { method: 'POST', path: 'register/user/v1/termsofservice' },
      willRespondWith: { status: 200, body: JSON.stringify(expectedResponse) },
    });

    await samUserPact.executeTest(async (mockService: V3MockServer) => {
      // ARRANGE
      asMockedFn(fetchOk).mockImplementation(async (path: string) => await fetch(`${mockService.url}/${path}`));
      asMockedFn(fetchFromProxy).mockImplementation(() => fetchOk);

      // ACT
      const response: SamUserTosStatusResponse = await User().acceptTos();

      // ASSERT
      expect(response).toBeDefined();
      expect(fetchOk).toBeCalledTimes(1);
      expect(fetchFromProxy).toBeCalledTimes(1);
      expect(fetchOk).toBeCalledWith('register/user/v1/termsofservice', {
        method: 'POST',
      });
      expect(response).toEqual(expectedResponse);
    });
  });

  it("Rejecting the tos will return the user's tos status", async () => {
    const expectedResponse: SamUserTosStatusResponse = {
      enabled: { allUsersGroup: false, google: true, ldap: true },
      userInfo: { userEmail: '', userSubjectId: '' }, // need to determine what these are
    };

    samUserPact.addInteraction({
      states: [{ description: 'user exists' }, { description: 'user is enabled' }],
      uponReceiving: 'reject tos',
      withRequest: { method: 'DELETE', path: 'register/user/v1/termsofservice' },
      willRespondWith: { status: 200, body: JSON.stringify(expectedResponse) },
    });

    await samUserPact.executeTest(async (mockService: V3MockServer) => {
      // ARRANGE
      asMockedFn(fetchOk).mockImplementation(async (path: string) => await fetch(`${mockService.url}/${path}`));
      asMockedFn(fetchFromProxy).mockImplementation(() => fetchOk);

      // ACT
      const response: SamUserTosStatusResponse = await User().rejectTos();

      // ASSERT
      expect(response).toBeDefined();
      expect(fetchOk).toBeCalledTimes(1);
      expect(fetchFromProxy).toBeCalledTimes(1);
      expect(fetchOk).toBeCalledWith('register/user/v1/termsofservice', {
        method: 'DELETE',
      });
      expect(response).toEqual(expectedResponse);
    });
  });

  it("Getting the tos compliance status will return the user's tos compliance status", async () => {
    const expectedResponse: SamUserTosComplianceStatusResponse = {
      permitsSystemUsage: false,
      userHasAcceptedLatestTos: false,
      userId: '', // need to determine what this should be
    };

    samUserPact.addInteraction({
      states: [{ description: 'user exists' }, { description: 'user is enabled' }],
      uponReceiving: 'get tos compliance status',
      withRequest: { method: 'GET', path: 'register/user/v2/self/termsOfServiceComplianceStatus' },
      willRespondWith: { status: 200, body: JSON.stringify(expectedResponse) },
    });

    await samUserPact.executeTest(async (mockService: V3MockServer) => {
      // ARRANGE
      asMockedFn(fetchOk).mockImplementation(async (path: string) => await fetch(`${mockService.url}/${path}`));
      asMockedFn(fetchFromProxy).mockImplementation(() => fetchOk);

      // ACT
      const response: SamUserTosComplianceStatusResponse = await User().getTermsOfServiceComplianceStatus();

      // ASSERT
      expect(response).toBeDefined();
      expect(fetchOk).toBeCalledTimes(1);
      expect(fetchFromProxy).toBeCalledTimes(1);
      expect(fetchOk).toBeCalledWith('register/user/v2/self/termsOfServiceComplianceStatus', {
        method: 'GET',
      });
      expect(response).toEqual(expectedResponse);
    });
  });

  it('Getting the privacy policy will return the privacy policy text', async () => {
    const expectedResponse = '';

    samUserPact.addInteraction({
      states: [{ description: 'privacy policy version 1 is the latest' }],
      uponReceiving: 'get privacy policy',
      withRequest: { method: 'GET', path: 'privacy/text' },
      willRespondWith: { status: 200, body: expectedResponse },
    });

    await samUserPact.executeTest(async (mockService: V3MockServer) => {
      // ARRANGE
      asMockedFn(fetchOk).mockImplementation(async (path: string) => await fetch(`${mockService.url}/${path}`));
      asMockedFn(fetchFromProxy).mockImplementation(() => fetchOk);

      // ACT
      const response: string = await User().getPrivacyPolicy();

      // ASSERT
      expect(response).toBeDefined();
      expect(fetchOk).toBeCalledTimes(1);
      expect(fetchFromProxy).toBeCalledTimes(1);
      expect(fetchOk).toBeCalledWith('privacy/text', {
        method: 'GET',
      });
      expect(response).toEqual(expectedResponse);
    });
  });
});

describe('kvArrayToObject', () => {
  it('converts an array of key/value objects to an object', () => {
    // Act
    const result = kvArrayToObject([
      { key: 'foo', value: 1 },
      { key: 'bar', value: 2 },
      { key: 'baz', value: 3 },
    ]);

    // Assert
    expect(result).toEqual({
      foo: 1,
      bar: 2,
      baz: 3,
    });
  });

  it('handles empty arrays', () => {
    // Act
    const result = kvArrayToObject([]);

    // Assert
    expect(result).toEqual({});
  });

  it('handles undefined input', () => {
    // Act
    const result = kvArrayToObject(undefined);

    // Assert
    expect(result).toEqual({});
  });
});
