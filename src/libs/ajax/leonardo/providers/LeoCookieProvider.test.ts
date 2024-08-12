import { LeoCookies as CookiesClient } from 'src/libs/ajax/leonardo/LeoCookies';
import { LeoCookiesDataClientContract } from 'src/libs/ajax/leonardo/LeoCookies';
import { asMockedFn } from 'src/testing/test-utils';

import { leoCookieProvider } from './LeoCookieProvider';

jest.mock('src/libs/ajax/leonardo/LeoCookies');

describe('CookieProvider', () => {
  it('calls the leo endpoint on invalidateCookie', async () => {
    // Arrange
    const unsetCookie = jest.fn().mockImplementation(async () => await Promise.resolve());
    asMockedFn(CookiesClient).mockReturnValue({ unsetCookie } as LeoCookiesDataClientContract);

    // Act
    await leoCookieProvider.unsetCookies();

    // Assert
    expect(CookiesClient).toBeCalledTimes(1);
    expect(unsetCookie).toBeCalledTimes(1);
  });

  it('does not error if api returns 401', async () => {
    // Arrange
    const unsetCookie = jest
      .fn()
      .mockImplementation(() => Promise.reject(new Response(JSON.stringify({ success: false }), { status: 401 })));
    asMockedFn(CookiesClient).mockReturnValue({ unsetCookie } as LeoCookiesDataClientContract);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    await leoCookieProvider.unsetCookies();

    // Assert
    expect(CookiesClient).toBeCalledTimes(1);
    expect(unsetCookie).toBeCalledTimes(1);
    expect(errorSpy).toBeCalledTimes(1);
  });

  it('throws non 401 errors', async () => {
    // Arrange
    const unsetCookie = jest.fn().mockImplementation(() => Promise.reject(new Error('test error')));
    asMockedFn(CookiesClient).mockReturnValue({ unsetCookie } as LeoCookiesDataClientContract);

    // Act
    const errorPromise = leoCookieProvider.unsetCookies();

    // Assert
    await expect(errorPromise).rejects.toEqual(new Error('test error'));
  });
});
