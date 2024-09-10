import { DeepPartial } from '@terra-ui-packages/core-utils';
import { act, renderHook } from '@testing-library/react';
import { Ajax } from 'src/libs/ajax';
import { fetchWDS } from 'src/libs/ajax/ajax-common';
import { ListAppItem } from 'src/libs/ajax/leonardo/models/app-models';
import { asMockedFn } from 'src/testing/test-utils';

import { useDataTableProvider } from './useDataTableProvider';

const CWDS_WORKSPACE_ID = 'cwdsWorkspaceId';
const WDS_APP_WORKSPACE_ID = 'wdsAppWorkspaceId';

type AjaxCommonExports = typeof import('src/libs/ajax/ajax-common');

type AjaxExports = typeof import('src/libs/ajax');
jest.mock(
  'src/libs/ajax',
  (): AjaxExports => ({
    ...jest.requireActual<AjaxExports>('src/libs/ajax'),
    Ajax: jest.fn(),
  })
);

jest.mock('src/libs/ajax/ajax-common', (): AjaxCommonExports => {
  return {
    ...jest.requireActual<AjaxCommonExports>('src/libs/ajax/ajax-common'),
    fetchWDS: jest.fn().mockImplementation(() => {
      return jest.fn((path: string) => {
        // collections/v1/{workspaceId}
        if (path.includes(CWDS_WORKSPACE_ID)) {
          return Promise.resolve({
            status: 200,
            json: jest.fn().mockResolvedValue([
              {
                id: CWDS_WORKSPACE_ID,
                name: 'default',
                description: 'default',
              },
            ]),
          });
        }
        return Promise.resolve({
          json: jest.fn().mockResolvedValue([]),
        });
      });
    }),
  };
});

const cwdsUrlRoot = 'https://cwds.test.url';

jest.mock('src/libs/config', () => ({
  ...jest.requireActual('src/libs/config'),
  getConfig: jest.fn().mockReturnValue({ cwdsUrlRoot }),
}));

type AjaxContract = ReturnType<typeof Ajax>;

describe('useDataTableProvider', () => {
  const listAppResponse: DeepPartial<ListAppItem> = {
    proxyUrls: {
      wds: cwdsUrlRoot,
    },
    appType: 'WDS',
    status: 'RUNNING',
  };

  const mockGetCapabilities = jest.fn().mockResolvedValue({});
  const mockGetSchema = jest.fn().mockResolvedValue([]);
  const mockListAppsV2 = jest.fn().mockResolvedValue([listAppResponse]);
  const mockAjax: DeepPartial<AjaxContract> = {
    WorkspaceData: {
      getCapabilities: mockGetCapabilities,
      getSchema: mockGetSchema,
    },
    Apps: {
      listAppsV2: mockListAppsV2,
    },
  };

  asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

  it('should only check CWDS once', async () => {
    // Arrange
    // Act
    await act(() => {
      renderHook(() => useDataTableProvider(WDS_APP_WORKSPACE_ID)); // It doesn't matter which workspaceId is used in this test
    });

    // Assert
    // Fetch wds might be called for other purpose, we only care about the call to check for collections
    const mockFetchWDS = fetchWDS as jest.Mock;
    const mockInnerFunction = mockFetchWDS.mock.results[0].value;

    // Now verify that we only called CWDS once
    expect(mockInnerFunction).toHaveBeenCalledTimes(1);
    expect(mockInnerFunction).toHaveBeenCalledWith(`collections/v1/${WDS_APP_WORKSPACE_ID}`, expect.anything());
  });

  // This test is disabled until a later PR for AJ-1965 uses the useCwds variable to determine whether or not to call listAppsV2
  //   it('should not call list apps if cwds is in use', async () => {
  //     // Arrange
  //     // Act
  //     await act(() => {
  //       renderHook(() => useDataTableProvider(CWDS_WORKSPACE_ID));
  //     });

  //     // Assert
  //     expect(mockListAppsV2).not.toHaveBeenCalled();
  //   });

  it('should call list apps if cwds is not in use', async () => {
    // Arrange
    // Act
    await act(() => {
      renderHook(() => useDataTableProvider(WDS_APP_WORKSPACE_ID));
    });

    // Assert
    expect(mockListAppsV2).toHaveBeenCalled();
  });
});
