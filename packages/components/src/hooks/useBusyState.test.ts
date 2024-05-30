import { controlledPromise } from '@terra-ui-packages/core-utils';
import { act, renderHook } from '@testing-library/react';

import { useBusyState } from './useBusyState';

describe('useBusyState', () => {
  it('sets busy to true and false during data call', async () => {
    // Arrange
    const [promise, controller] = controlledPromise<string>();
    const getData: () => Promise<string> = jest.fn(() => promise);

    // Act
    const hookRender = renderHook(() => useBusyState());
    const [isBusy1, withBusy1] = hookRender.result.current;

    const loadData = withBusy1(getData);
    await act(async () => {
      void loadData();
    });
    const [isBusy2] = hookRender.result.current;

    await act(async () => {
      controller.resolve('happy data');
    });
    const [isBusyFinal] = hookRender.result.current;

    // Assert
    expect(isBusy1).toBe(false);
    expect(isBusy2).toBe(true);
    expect(getData).toBeCalledTimes(1);
    expect(isBusyFinal).toBe(false);
  });

  it('returns expected data from call', async () => {
    // Arrange
    const getData: () => Promise<string> = jest.fn().mockResolvedValue('happy data');

    // Act
    // testing for data result value seperate from async busy true/false test above since promise mechanics
    // make it hard to test both in a single test.
    const hookRender = renderHook(() => useBusyState());
    const [isBusy1, withBusy1] = hookRender.result.current;

    const loadData = withBusy1(getData);
    let dataResult: string | null = null;
    await act(async () => {
      dataResult = await loadData();
    });
    const [isBusyFinal] = hookRender.result.current;

    // Assert
    expect(isBusy1).toBe(false);
    expect(getData).toBeCalledTimes(1);
    expect(isBusyFinal).toBe(false);
    expect(dataResult).toBe('happy data');
  });
});
