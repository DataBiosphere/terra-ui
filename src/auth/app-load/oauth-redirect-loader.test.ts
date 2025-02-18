import { delay } from '@terra-ui-packages/core-utils';
import { asMockedFn } from '@terra-ui-packages/test-utils';

import { showOAuthRedirect } from './oauth-redirect-loader';
import { RedirectFromOAuth } from './RedirectFromOAuth';

jest.mock('./RedirectFromOAuth');

describe('showOAuthRedirect', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    asMockedFn(RedirectFromOAuth).mockReturnValue('Redirect UI Here');
  });
  it('mounts redirect visual component to ui root', async () => {
    // Act
    showOAuthRedirect();
    await delay(100);

    // Assert
    // auth redirect page component called for rendering
    expect(RedirectFromOAuth).toBeCalledTimes(1);
  });
});
