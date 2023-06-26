import '@testing-library/jest-dom';

import { render } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { PeriodicAzureCookieSetter, setAzureCookieOnUrl } from 'src/analysis/runtime-common-components';

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
    const forApp = true;
    const url = 'https://app.terra.bio/#workspaces';
    // Act
    await setAzureCookieOnUrl(forApp, url);
    // Assert
    expect(mockSetAzureCookie).toHaveBeenCalled();
  });

  it('should call setAzureCookieOnUrl', async () => {
    // Arrange
    await render(h(PeriodicAzureCookieSetter));
    // Assert
    expect(mockSetAzureCookie).toHaveBeenCalled();
  });

  it('when forApp is true, sets cookie at "readyForApp"', async () => {
    // Arrange
    const forApp = true;
    const url = 'https://app.terra.bio/#workspaces';
    // Act
    await setAzureCookieOnUrl(null, forApp, url);
    // Assert
    expect(mockSetAzureCookie).toHaveBeenCalled();
  });

  it('when forApp is false, sets cookie at "readyForRuntime"', async () => {
    // Arrange
    const forApp = false;
    const url = 'https://app.terra.bio/#workspaces';
    // Act
    await setAzureCookieOnUrl(null, forApp, url);
    // Assert
    expect(mockSetAzureCookie).toHaveBeenCalled();
  });
});
