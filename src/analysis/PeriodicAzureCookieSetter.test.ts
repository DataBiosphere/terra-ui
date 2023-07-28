import { render } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { PeriodicAzureCookieSetter } from 'src/analysis/runtime-common-components';
import { withErrorIgnoring } from 'src/libs/error';
import { usePollingEffect } from 'src/libs/react-utils';

jest.mock('src/analysis/runtime-common-components', () => {
  return {
    ...jest.requireActual('src/analysis/runtime-common-components'),
    setAzureCookieOnUrl: jest.fn(),
  };
});

const usePollingEffectMock = usePollingEffect as jest.MockedFunction<any>;

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
  it('should call usePollingEffect', () => {
    // Arrange
    render(h(PeriodicAzureCookieSetter));

    // Assert
    expect(usePollingEffect).toHaveBeenCalled();
  });

  it('should call usePollingEffect and withErrorIgnoring', () => {
    usePollingEffectMock.mockImplementationOnce(() => withErrorIgnoring);
    // Arrange
    render(h(PeriodicAzureCookieSetter));

    // Assert
    expect(usePollingEffect).toHaveBeenCalled();
    expect(withErrorIgnoring).toHaveBeenCalled();
  });

  it('should call withErrorIgnoring', () => {
    usePollingEffectMock.mockImplementation((effectFn, { ms, leading }) =>
      withErrorIgnoring(effectFn, { ms, leading })
    );
    // Arrange
    render(h(PeriodicAzureCookieSetter));

    // Assert
    expect(usePollingEffect).toHaveBeenCalled();
    expect(withErrorIgnoring).toHaveBeenCalled();
    expect(withErrorIgnoring).toHaveBeenCalledWith(expect.any(Function));
    expect(withErrorIgnoring).toHaveBeenCalledWith(undefined, { ms: 5 * 60 * 1000, leading: true });
  });
});
