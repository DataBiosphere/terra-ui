import '@testing-library/jest-dom';

import { render } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { PeriodicAzureCookieSetter, setAzureCookieOnUrl } from 'src/analysis/runtime-common-components';
import { withErrorIgnoring } from 'src/libs/error';
import { usePollingEffect } from 'src/libs/react-utils';

jest.mock('src/analysis/runtime-common-components', () => {
  return {
    ...jest.requireActual('src/analysis/runtime-common-components'),
    setAzureCookieOnUrl: jest.fn(),
  };
});

jest.mock('src/libs/react-utils', () => {
  return {
    ...jest.requireActual('src/libs/react-utils'),
    usePollingEffect: jest.fn(),
  };
});

jest.mock('src/libs/error', () => {
  return {
    ...jest.requireActual('src/libs/error'),
    withErrorIgnoring: jest.fn(),
  };
});

describe('PeriodicAzureCookieSetter', () => {
  it('should call usePollingEffect', async () => {
    // Arrange
    await render(h(PeriodicAzureCookieSetter));
    // Act

    // Assert
    expect(usePollingEffect).toHaveBeenCalled();
  });

  it('should call usePollingEffect', async () => {
    usePollingEffect.mockImplementationOnce(() => withErrorIgnoring);
    // Arrange
    await render(h(PeriodicAzureCookieSetter));
    // Act

    // Assert
    expect(usePollingEffect).toHaveBeenCalled();
    expect(withErrorIgnoring).toHaveBeenCalled();
  });
  it('should call withErrorIgnoring', async () => {
    usePollingEffect.mockImplementation((effectFn, { ms, leading }) => withErrorIgnoring(effectFn, { ms, leading }));
    // Arrange
    await render(h(PeriodicAzureCookieSetter));
    // Act

    // Assert
    expect(usePollingEffect).toHaveBeenCalled();
    expect(withErrorIgnoring).toHaveBeenCalled();
    expect(withErrorIgnoring).toHaveBeenCalledWith(expect.any(Function));
    expect(withErrorIgnoring).toHaveBeenCalledWith(undefined, { ms: 5 * 60 * 1000, leading: true });
  });

  it('should call setAzureCookieOnUrl', async () => {
    withErrorIgnoring.mockImplementation(() => {
      setAzureCookieOnUrl();
    });

    await usePollingEffect.mockImplementation(() => withErrorIgnoring());

    // Arrange
    await render(h(PeriodicAzureCookieSetter));
    // Act

    // Assert
    expect(usePollingEffect).toHaveBeenCalled();
    expect(withErrorIgnoring).toHaveBeenCalled();
    expect(setAzureCookieOnUrl).toHaveBeenCalled();
  });
});

describe('setAzureCookieOnUrl', () => {
  it('when forApp is true, sets cookie at "readyForApp"', async () => {
    // Arrange
    const forApp = true;
    const url = 'https://app.terra.bio/#workspaces';
    // Act
    await setAzureCookieOnUrl(forApp, url);
    // Assert
    expect(setAzureCookieOnUrl).toHaveBeenCalled();
  });

  it('when forApp is false, sets cookie at "readyForRuntime"', async () => {
    // Arrange
    const forApp = false;
    const url = 'https://app.terra.bio/#workspaces';
    // Act
    await setAzureCookieOnUrl(forApp, url);
    // Assert
    expect(setAzureCookieOnUrl).toHaveBeenCalled();
  });
});
