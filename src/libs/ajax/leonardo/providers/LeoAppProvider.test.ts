import { Ajax } from 'src/libs/ajax';
import { AppAjaxContract, AppsAjaxContract } from 'src/libs/ajax/leonardo/Apps';
import { asMockedFn } from 'src/testing/test-utils';

import { AppBasics, leoAppProvider } from './LeoAppProvider';

jest.mock('src/libs/ajax');

type AjaxContract = ReturnType<typeof Ajax>;
type AppNeeds = Pick<AppAjaxContract, 'delete' | 'pause'>;
type AppsNeeds = Pick<AppsAjaxContract, 'app' | 'listWithoutProject'>;

interface AjaxMockNeeds {
  Apps: AppsNeeds;
  app: AppNeeds;
}
/**
 * local test utility - mocks the Ajax super-object and the subset of needed multi-contracts it
 * returns with as much type-saftely as possible.
 *
 * @return collection of key contract sub-objects for easy
 * mock overrides and/or method spying/assertions
 */
const mockAjaxNeeds = (): AjaxMockNeeds => {
  const partialApp: AppNeeds = {
    delete: jest.fn(),
    pause: jest.fn(),
  };
  const mockApp = partialApp as AppAjaxContract;

  const partialApps: AppsNeeds = {
    app: jest.fn(),
    listWithoutProject: jest.fn(),
  };
  const mockApps = partialApps as AppsAjaxContract;

  asMockedFn(mockApps.app).mockReturnValue(mockApp);
  asMockedFn(Ajax).mockReturnValue({ Apps: mockApps } as AjaxContract);

  return {
    Apps: partialApps,
    app: partialApp,
  };
};
describe('leoAppProvider', () => {
  it('handles list call', async () => {
    // Arrange
    const ajaxMock = mockAjaxNeeds();
    asMockedFn(ajaxMock.Apps.listWithoutProject).mockResolvedValue([]);
    const signal = new window.AbortController().signal;

    // Act
    const result = await leoAppProvider.listWithoutProject({ arg: '1' }, { signal });

    // Assert;
    expect(Ajax).toBeCalledTimes(1);
    expect(Ajax).toBeCalledWith(signal);
    expect(ajaxMock.Apps.listWithoutProject).toBeCalledTimes(1);
    expect(ajaxMock.Apps.listWithoutProject).toBeCalledWith({ arg: '1' });
    expect(result).toEqual([]);
  });

  it('handles pause app call', async () => {
    // Arrange
    const ajaxMock = mockAjaxNeeds();
    const abort = new window.AbortController();
    const app: AppBasics = {
      appName: 'myAppName',
      cloudContext: {
        cloudProvider: 'GCP',
        cloudResource: 'myGoogleProject',
      },
    };

    // Act
    // calls to this method generally don't care about passing in signal, but doing it here for completeness
    void (await leoAppProvider.pause(app, { signal: abort.signal }));

    // Assert;
    expect(Ajax).toBeCalledTimes(1);
    expect(Ajax).toBeCalledWith(abort.signal);
    expect(ajaxMock.Apps.app).toBeCalledTimes(1);
    expect(ajaxMock.Apps.app).toBeCalledWith('myGoogleProject', 'myAppName');
    expect(ajaxMock.app.pause).toBeCalledTimes(1);
  });

  it('handles delete app call - GCP', async () => {
    // Arrange
    const ajaxMock = mockAjaxNeeds();
    const abort = new window.AbortController();
    const app: AppBasics = {
      appName: 'myAppName',
      cloudContext: {
        cloudProvider: 'GCP',
        cloudResource: 'myGoogleProject',
      },
    };

    // Act
    // calls to this method generally don't care about passing in signal, but doing it here for completeness
    void (await leoAppProvider.delete(app, { signal: abort.signal }));

    // Assert;
    expect(Ajax).toBeCalledTimes(1);
    expect(Ajax).toBeCalledWith(abort.signal);
    expect(ajaxMock.Apps.app).toBeCalledTimes(1);
    expect(ajaxMock.Apps.app).toBeCalledWith('myGoogleProject', 'myAppName');
    expect(ajaxMock.app.delete).toBeCalledTimes(1);
    expect(ajaxMock.app.delete).toBeCalledWith(false);
  });
  it('handles delete app call - Azure', async () => {
    // Arrange
    const app: AppBasics = {
      appName: 'myAppName',
      cloudContext: {
        cloudProvider: 'AZURE',
        cloudResource: 'myAzureResource',
      },
    };

    // Act (called from assert because expecting throw
    const shouldThrow = async () => {
      await leoAppProvider.delete(app);
    };

    // Assert;
    await expect(shouldThrow()).rejects.toEqual(new Error('Deleting apps is currently only supported on GCP'));
    expect(Ajax).toBeCalledTimes(0);
  });
});
