import '@testing-library/jest-dom';

import { render, waitFor } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { getConfig } from 'src/libs/config';
import { workflowsAppStore } from 'src/libs/state';
import { SubmitWorkflow } from 'src/workflows-app/SubmitWorkflow';
import { mockAzureApps, mockAzureWorkspace } from 'src/workflows-app/utils/mock-responses';

jest.mock('src/libs/ajax');

jest.mock('src/libs/notifications.js');

jest.mock('src/libs/config', () => ({
  ...jest.requireActual('src/libs/config'),
  getConfig: jest.fn().mockReturnValue({}),
}));

jest.mock('src/libs/nav', () => ({
  getCurrentUrl: jest.fn().mockReturnValue(new URL('https://app.terra.bio')),
  getLink: jest.fn(),
  goToPath: jest.fn(),
}));

jest.mock('src/libs/state', () => ({
  ...jest.requireActual('src/libs/state'),
  getUser: jest.fn(),
}));

describe('SubmitWorkflow - local CBAS and WDS', () => {
  beforeEach(() => {
    getConfig.mockReturnValue({
      wdsUrlRoot: 'http://localhost:3000/wds',
      cbasUrlRoot: 'http://localhost:8080/cbas',
      cromwellUrlRoot: 'http://localhost:8080/cromwell',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not call Leo as urls are defined in config', async () => {
    // ** ARRANGE **
    const mockMethodsResponse = jest.fn(() => Promise.resolve({ runs: { methods: [] } }));
    const mockLeoResponse = jest.fn(() => Promise.resolve(mockAzureApps));

    Ajax.mockImplementation(() => {
      return {
        Cbas: {
          methods: {
            getWithoutVersions: mockMethodsResponse,
          },
        },
        Apps: {
          listAppsV2: mockLeoResponse,
        },
      };
    });

    // ** ASSERT **
    // assert that the proxy urls state are not ready
    expect(workflowsAppStore.get().wdsProxyUrlState).toStrictEqual({ status: 'None', state: '' });
    expect(workflowsAppStore.get().cbasProxyUrlState).toStrictEqual({ status: 'None', state: '' });
    expect(workflowsAppStore.get().cromwellProxyUrlState).toStrictEqual({ status: 'None', state: '' });

    // ** ACT **
    render(
      h(SubmitWorkflow, {
        name: 'test-azure-ws-name',
        namespace: 'test-azure-ws-namespace',
        workspace: mockAzureWorkspace,
      })
    );

    // ** ASSERT **
    await waitFor(() => {
      expect(mockMethodsResponse).toHaveBeenCalledTimes(1);
      expect(mockLeoResponse).toHaveBeenCalledTimes(0);
    });

    // assert that the proxy urls state are set in workflowsAppStore
    expect(workflowsAppStore.get().wdsProxyUrlState).toStrictEqual({ status: 'Ready', state: 'http://localhost:3000/wds' });
    expect(workflowsAppStore.get().cbasProxyUrlState).toStrictEqual({ status: 'Ready', state: 'http://localhost:8080/cbas' });
    expect(workflowsAppStore.get().cromwellProxyUrlState).toStrictEqual({ status: 'Ready', state: 'http://localhost:8080/cromwell' });
  });
});
