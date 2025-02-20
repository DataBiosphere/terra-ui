import { showOAuthRedirect } from 'src/auth/app-load/oauth-redirect-loader';
import { getCurrentLocation } from 'src/libs/nav/location-utils';
import { doAppLoad } from 'src/libs/startup/app-loader';
import { asMockedFn } from 'src/testing/test-utils';

import { doAppBoot } from './app-boot';

jest.mock('src/libs/nav/location-utils');
jest.mock('src/libs/startup/app-loader');
jest.mock('src/auth/app-load/oauth-redirect-loader');

const setLocation = (url: URL | Location) => {
  asMockedFn(getCurrentLocation).mockReturnValue(url as unknown as Location);
};

describe('doAppBoot', () => {
  const oldLocation = window.location;
  let fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock = jest
      .spyOn(global, 'fetch')
      .mockImplementation(jest.fn(async (_url) => new Response('{}'))) as jest.Mock;
  });
  afterEach(() => {
    setLocation(oldLocation);
  });

  it('starts app for normal entry case', async () => {
    // Arrange
    setLocation(new URL('https://app-root.test/normal-app-path'));

    // Act
    await doAppBoot();

    // Assert
    expect(fetchMock).toBeCalledTimes(2);
    expect(fetchMock).toBeCalledWith('/config.json');
    expect(fetchMock).toBeCalledWith('/build-info.json');

    expect(doAppLoad).toBeCalledTimes(1);
    expect(showOAuthRedirect).toBeCalledTimes(0);
  });

  it('reroutes for auth redirect case', async () => {
    // Arrange
    setLocation(new URL('https://app-root.test/redirect-from-oauth'));

    // Act
    await doAppBoot();

    // Assert
    expect(fetchMock).toBeCalledTimes(0);

    expect(doAppLoad).toBeCalledTimes(0);
    expect(showOAuthRedirect).toBeCalledTimes(1);
  });
});
