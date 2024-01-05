import { cookieProvider } from 'src/components/CookieProvider';
import { Ajax } from 'src/libs/ajax';
import { RuntimesAjaxContract } from 'src/libs/ajax/leonardo/Runtimes';
import { asMockedFn } from 'src/testing/test-utils';

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
    await cookieProvider.invalidateCookies();

    // Assert
    expect(Ajax).toBeCalledTimes(1);
    expect(ajaxMock.Runtimes.invalidateCookie).toBeCalledTimes(1);
  });
});
