import '@testing-library/jest-dom';

import { render } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { PeriodicAzureCookieSetter, setAzureCookieOnUrl } from 'src/analysis/runtime-common-components';
import { azureCookieReadyStore } from 'src/libs/state';

const mockSetAzureCookie = jest.fn();

jest.mock('src/libs/ajax/leonardo/Runtimes', () => {
  return {
    ...jest.requireActual('src/libs/ajax/leonardo/Runtimes'),
    Runtimes: () => ({
      azureProxy: () => ({
        setAzureCookie: mockSetAzureCookie,
      }),
    }),
  };
});

describe('setAzureCookieOnUrl', () => {
  it('when forApp is true, sets cookie at "readyForApp"', async () => {
    // Arrange
    azureCookieReadyStore.reset();
    const forApp = true;
    const url = 'https://app.terra.bio/#workspaces';

    // Act
    await setAzureCookieOnUrl(undefined, url, forApp);

    // Assert
    expect(mockSetAzureCookie).toHaveBeenCalled();
    expect(azureCookieReadyStore.get().readyForApp).toBe(true);
    expect(azureCookieReadyStore.get().readyForRuntime).toBe(false);
  });

  it('when forApp is false, sets cookie at "readyForRuntime"', async () => {
    // Arrange
    azureCookieReadyStore.reset();
    const forApp = false;
    const url = 'https://app.terra.bio/#workspaces';

    // Act
    await setAzureCookieOnUrl(null, url, forApp);

    // Assert
    expect(mockSetAzureCookie).toHaveBeenCalled();
    expect(azureCookieReadyStore.get().readyForRuntime).toBe(true);
    expect(azureCookieReadyStore.get().readyForApp).toBe(false);
  });

  it('should call setAzureCookieOnUrl on cookie setter render', async () => {
    // Arrange
    await render(h(PeriodicAzureCookieSetter));

    // Assert
    expect(mockSetAzureCookie).toHaveBeenCalled();
  });
});
