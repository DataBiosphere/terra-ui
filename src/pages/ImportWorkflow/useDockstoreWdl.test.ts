import { act, renderHook } from '@testing-library/react-hooks';
import { Dockstore, DockstoreContract } from 'src/libs/ajax/Dockstore';
import { reportError } from 'src/libs/error';
import { asMockedFn } from 'src/testing/test-utils';

import { useDockstoreWdl } from './useDockstoreWdl';

jest.mock('src/libs/ajax/Dockstore', () => ({ Dockstore: jest.fn() }));

type ErrorExports = typeof import('src/libs/error');
jest.mock(
  'src/libs/error',
  (): ErrorExports => ({
    ...jest.requireActual('src/libs/error'),
    reportError: jest.fn(),
  })
);

describe('useDockstoreWdl', () => {
  it('returns WDL for workflow', async () => {
    // Arrange
    const getWdl = jest.fn(() => Promise.resolve('workflow TestWorkflow {}'));
    asMockedFn(Dockstore).mockImplementation(() => ({ getWdl } as Partial<DockstoreContract> as DockstoreContract));

    const testWorkflow = {
      path: 'github.com/DataBiosphere/test-workflows/test-workflow',
      version: 'v1.0.0',
      isTool: false,
    };

    // Act
    const { result: hookReturnRef } = await act(async () => {
      return renderHook(() => useDockstoreWdl(testWorkflow));
    });
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
    const { result: hookReturnRef } = await act(async () => {
      return renderHook(() => useDockstoreWdl(testWorkflow));
    });
    const result = hookReturnRef.current;

    // Assert
    expect(reportError).toHaveBeenCalled();
    expect(result).toEqual({ status: 'Error', wdl: null, error: new Error('Something went wrong') });
  });
});
