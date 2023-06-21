import { render, screen, waitFor } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { Apps } from 'src/libs/ajax/leonardo/Apps';
import { getUser } from 'src/libs/state';
import { AzureWorkflows } from 'src/pages/workspaces/workspace/Workflows';

jest.mock('src/libs/ajax');
jest.mock('src/libs/ajax/leonardo/Apps');
jest.mock('src/libs/notifications');
jest.mock('src/libs/state', () => ({
  ...jest.requireActual('src/libs/state'),
  getUser: jest.fn(),
}));

describe('AzureWorkflows tab', () => {
  const workspace = { namespace: 'test', name: 'test', cloudPlatform: 'Azure', workspaceId: '79201ea6-519a-4077-a9a4-75b2a7c4cdeb' };

  const mockAppResponse = [
    {
      workspaceId: '79201ea6-519a-4077-a9a4-75b2a7c4cdeb',
      cloudContext: {
        cloudProvider: 'AZURE',
      },
      status: 'RUNNING',
      proxyUrls: {
        cbas: 'https://abc.servicebus.windows.net/terra-app-3b8d9c55-7eee-49e9-a998-e8c6db05e374-79201ea6-519a-4077-a9a4-75b2a7c4cdeb/cbas',
        'cbas-ui': 'https://abc.servicebus.windows.net/terra-app-3b8d9c55-7eee-49e9-a998-e8c6db05e374-79201ea6-519a-4077-a9a4-75b2a7c4cdeb/',
        cromwell: 'https://abc.servicebus.windows.net/terra-app-3b8d9c55-7eee-49e9-a998-e8c6db05e374-79201ea6-519a-4077-a9a4-75b2a7c4cdeb/cromwell',
      },
      appName: 'terra-app-3b8d9c55-7eee-49e9-a998-e8c6db05e374',
      appType: 'CROMWELL',
      auditInfo: {
        creator: 'abc@gmail.com',
      },
    },
    {
      workspaceId: '79201ea6-519a-4077-a9a4-75b2a7c4cdeb',
      cloudContext: {
        cloudProvider: 'AZURE',
      },
      status: 'RUNNING',
      proxyUrls: {
        wds: 'https://abc.servicebus.windows.net/wds-79201ea6-519a-4077-a9a4-75b2a7c4cdeb-79201ea6-519a-4077-a9a4-75b2a7c4cdeb/',
      },
      appName: 'wds-79201ea6-519a-4077-a9a4-75b2a7c4cdeb',
      appType: 'WDS',
      auditInfo: {
        creator: 'abc@gmail.com',
      },
    },
  ];

  it('shows CBAS and Cromwell status when loaded', async () => {
    const mockGetStatusResponse = {
      ok: true,
      systems: {
        cromwell: {
          messages: ['mock message'],
          ok: true,
        },
        leonardo: {
          messages: ['mock message'],
          ok: true,
        },
        wds: {
          messages: ['mock message'],
          ok: true,
        },
      },
    };
    const mockListAppsFn = jest.fn(() => Promise.resolve(mockAppResponse));
    const getStatusFunction = jest.fn(() => Promise.resolve(mockGetStatusResponse));

    await getUser.mockReturnValue({
      email: 'abc@gmail.com',
    });

    await Apps.mockImplementation(() => {
      return {
        listAppsV2: jest.fn(mockListAppsFn),
      };
    });

    await Ajax.mockImplementation(() => {
      return {
        Cbas: {
          status: jest.fn(getStatusFunction),
        },
      };
    });

    // Act
    render(h(AzureWorkflows, { workspace }));

    // Assert
    expect(mockListAppsFn).toHaveBeenCalledWith('79201ea6-519a-4077-a9a4-75b2a7c4cdeb');

    await waitFor(() => {
      expect(getStatusFunction).toHaveBeenCalledWith(
        'https://abc.servicebus.windows.net/terra-app-3b8d9c55-7eee-49e9-a998-e8c6db05e374-79201ea6-519a-4077-a9a4-75b2a7c4cdeb/cbas'
      );
      expect(screen.getByText('CBAS: true')).toBeInTheDocument();
      expect(screen.getByText('Cromwell: true')).toBeInTheDocument();
    });
  });
});
