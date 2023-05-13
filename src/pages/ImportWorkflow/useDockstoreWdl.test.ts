import { renderHook } from '@testing-library/react-hooks';
import { Dockstore, DockstoreContract } from 'src/libs/ajax/Dockstore';
import { reportError } from 'src/libs/error';
import { asMockedFn } from 'src/testing/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { useDockstoreWdl } from './useDockstoreWdl';

vi.mock('src/libs/ajax/Dockstore', () => ({ Dockstore: vi.fn() }));

type ErrorExports = typeof import('src/libs/error');
vi.mock(
  'src/libs/error',
  async (): Promise<ErrorExports> => ({
    ...(await vi.importActual('src/libs/error')),
    reportError: vi.fn(),
  })
);

describe('useDockstoreWdl', () => {
  it('returns WDL for workflow', async () => {
    // Arrange
    const getWdl = vi.fn(() => Promise.resolve('workflow TestWorkflow {}'));
    asMockedFn(Dockstore).mockImplementation(() => ({ getWdl } as Partial<DockstoreContract> as DockstoreContract));

    const testWorkflow = {
      path: 'github.com/DataBiosphere/test-workflows/test-workflow',
      version: 'v1.0.0',
      isTool: false,
    };

    // Act
    const { result: hookReturnRef, waitForNextUpdate } = renderHook(() => useDockstoreWdl(testWorkflow));
    await waitForNextUpdate();
    const result = hookReturnRef.current;

    // Assert
    expect(getWdl).toHaveBeenCalledWith(testWorkflow);
    expect(result).toEqual({ status: 'Ready', wdl: 'workflow TestWorkflow {}' });
  });

  it('handles errors', async () => {
    // Arrange
    asMockedFn(Dockstore).mockReturnValue({
      getWdl: (_workflow) => Promise.reject(new Error('Something went wrong')),
    } as DockstoreContract);

    const testWorkflow = {
      path: 'github.com/DataBiosphere/test-workflows/test-workflow',
      version: 'v1.0.0',
      isTool: false,
    };

    // Act
    const { result: hookReturnRef, waitForNextUpdate } = renderHook(() => useDockstoreWdl(testWorkflow));
    await waitForNextUpdate();
    const result = hookReturnRef.current;

    // Assert
    expect(reportError).toHaveBeenCalled();
    expect(result).toEqual({ status: 'Error', wdl: null, error: new Error('Something went wrong') });
  });
});
