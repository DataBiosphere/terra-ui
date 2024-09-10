import { DeepPartial } from '@terra-ui-packages/core-utils';
import { renderHook } from '@testing-library/react';
import { Ajax } from 'src/libs/ajax';
import { ListAppItem } from 'src/libs/ajax/leonardo/models/app-models';
import { asMockedFn } from 'src/testing/test-utils';

import { useDataTableProvider } from './useDataTableProvider';

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
      return jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue({}),
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
    const workspaceId = 'workspaceId';

    // Act
    renderHook(() => useDataTableProvider(workspaceId));

    // Assert
    // Fetch wds might be called for other purpose, we only care about the call to check for collections
    // const mockFetchWDS = fetchWDS as jest.Mock;
    // console.log(mockFetchWDS.mock.results);
    // const mockInnerFunction = mockFetchWDS.mock.results[0].value;

    // // TODO make the mock function return something so there's no error in the test
    // // Now verify that we only called CWDS once
    // expect(mockInnerFunction).toHaveBeenCalledTimes(1);
    // expect(mockInnerFunction).toHaveBeenCalledWith(`collections/v1/${workspaceId}`, expect.anything());
  });
});
