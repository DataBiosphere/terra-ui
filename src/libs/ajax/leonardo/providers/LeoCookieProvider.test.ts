import { Ajax } from 'src/libs/ajax';
import { RuntimesAjaxContract } from 'src/libs/ajax/leonardo/Runtimes';
import { asMockedFn } from 'src/testing/test-utils';

import { leoCookieProvider } from './LeoCookieProvider';

jest.mock('src/libs/ajax');

/**
 * local test utility - mocks the Ajax super-object and the subset of needed multi-contracts it
 * returns with as much type-safety as possible.
 *
 * @return collection of key contract sub-objects for easy
 * mock overrides and/or method spying/assertions
 */
type AjaxContract = ReturnType<typeof Ajax>;
type RuntimesNeeds = Pick<RuntimesAjaxContract, 'invalidateCookie'>;
interface AjaxMockNeeds {
  Runtimes: RuntimesNeeds;
}

const mockAjaxNeeds = (): AjaxMockNeeds => {
  const partialRuntimes: RuntimesNeeds = {
    invalidateCookie: jest.fn(),
  };
  const mockRuntimes = partialRuntimes as RuntimesAjaxContract;

  asMockedFn(Ajax).mockReturnValue({ Runtimes: mockRuntimes } as AjaxContract);

  return {
    Runtimes: partialRuntimes,
  };
};
describe('CookieProvider', () => {
  it('calls the leo endpoint on invalidateCookie', async () => {
    const ajaxMock = mockAjaxNeeds();

    // Act
    await leoCookieProvider.invalidateCookies();

    // Assert
    expect(Ajax).toBeCalledTimes(1);
    expect(ajaxMock.Runtimes.invalidateCookie).toBeCalledTimes(1);
  });

  it('does not error if api returns 401', async () => {
    const ajaxMock = mockAjaxNeeds();
    asMockedFn(ajaxMock.Runtimes.invalidateCookie).mockImplementation(() =>
      Promise.reject(new Response(JSON.stringify({ success: false }), { status: 401 }))
    );
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    await leoCookieProvider.invalidateCookies();

    expect(Ajax).toBeCalledTimes(1);
    expect(ajaxMock.Runtimes.invalidateCookie).toBeCalledTimes(1);
    expect(errorSpy).toBeCalledTimes(1);
  });

  it('throws non 401 errors', async () => {
    // Arrange
    const ajaxMock = mockAjaxNeeds();
    asMockedFn(ajaxMock.Runtimes.invalidateCookie).mockImplementation(() => Promise.reject(new Error('test error')));

    // Act
    const errorPromise = leoCookieProvider.invalidateCookies();

    // Assert
    await expect(errorPromise).rejects.toEqual(new Error('test error'));
  });
});
