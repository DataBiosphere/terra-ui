import { getAllByRole, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as clipboard from 'clipboard-polyfill/text';
import { h } from 'react-hyperscript-helpers';
import { useWdsStatus, WdsStatus } from 'src/libs/wds-status';
import { useWorkspaceById } from 'src/libs/workspace-hooks';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';
import { asMockedFn } from 'src/testing/test-utils';

import { WdsTroubleshooter } from './WdsTroubleshooter';

type WdsStatusExports = typeof import('src/libs/wds-status');
jest.mock('src/libs/wds-status', (): WdsStatusExports => {
  return {
    useWdsStatus: jest.fn(),
  };
});

type WorkspaceHooksExports = typeof import('src/libs/workspace-hooks');
jest.mock('src/libs/workspace-hooks', (): WorkspaceHooksExports => {
  const actual = jest.requireActual<WorkspaceHooksExports>('src/libs/workspace-hooks');
  return {
    ...actual,
    useWorkspaceById: jest.fn(),
  };
});

type NavExports = typeof import('src/libs/nav');
jest.mock('src/libs/nav', (): NavExports => {
  const actual = jest.requireActual<NavExports>('src/libs/nav');
  return {
    ...actual,
    getLink: jest.fn(),
  };
});

type ClipboardPolyfillExports = typeof import('clipboard-polyfill/text');
jest.mock('clipboard-polyfill/text', (): ClipboardPolyfillExports => {
  const actual = jest.requireActual<ClipboardPolyfillExports>('clipboard-polyfill/text');
  return {
    ...actual,
    writeText: jest.fn().mockResolvedValue(undefined),
  };
});

describe('WdsTroubleshooter', () => {
  it('renders status', () => {
    // Arrange
    const mockStatus: WdsStatus = {
      numApps: '1',
      wdsResponsive: 'true',
      version: 'c87286c',
      chartVersion: 'wds-0.24.0',
      image: 'us.gcr.io/broad-dsp-gcr-public/terra-workspace-data-service:eaf3f31',
      wdsStatus: 'UP',
      wdsDbStatus: 'UP',
      wdsPingStatus: 'UP',
      wdsIamStatus: 'UP',
      appName: 'wds-6601fdbb-4b53-41da-87b2-81385f4a760e',
      appStatus: 'RUNNING',
      proxyUrl:
        'https://lz34dd00bf3fdaa72f755eeea8f928bab7cd135043043d59d5.servicebus.windows.net/wds-6601fdbb-4b53-41da-87b2-81385f4a760e-6601fdbb-4b53-41da-87b2-81385f4a760e/',
      defaultInstanceExists: 'true',
      cloneSourceWorkspaceId: null,
      cloneStatus: null,
      cloneErrorMessage: null,
    };

    asMockedFn(useWdsStatus).mockReturnValue({
      status: mockStatus,
      refreshStatus: jest.fn(),
    });

    // Act
    render(
      h(WdsTroubleshooter, {
        workspaceId: 'test-workspace',
        mrgId: 'test-mrg',
        onDismiss: jest.fn(),
      })
    );

    // Assert
    const tableRows = screen.getAllByRole('row');
    const statusLabelAndValueCells = tableRows.map((row) => {
      const cells = getAllByRole(row, 'cell');
      return cells.slice(1).map((el) => el.textContent);
    });

    expect(statusLabelAndValueCells).toEqual([
      ['Workspace Id', 'test-workspace'],
      ['Resource Group Id', 'test-mrg'],
      ['App listing', '1 app(s) total'],
      ['Data app name', 'wds-6601fdbb-4b53-41da-87b2-81385f4a760e'],
      ['Data app running?', 'RUNNING'],
      [
        'Data app proxy url',
        'https://lz34dd00bf3fdaa72f755eeea8f928bab7cd135043043d59d5.servicebus.windows.net/wds-6601fdbb-4b53-41da-87b2-81385f4a760e-6601fdbb-4b53-41da-87b2-81385f4a760e/',
      ],
      ['Data app responding', 'true'],
      ['Data app version', 'c87286c'],
      ['Data app chart version', 'wds-0.24.0'],
      ['Data app image', 'terra-workspace-data-service:eaf3f31'],
      ['Data app status', 'UP'],
      ['Data app DB status', 'UP'],
      ['Data app ping status', 'UP'],
      ['Data app IAM status', 'UP'],
      ['Default Instance exists', 'true'],
    ]);
  });

  it('shows clone status if present', () => {
    // Arrange
    const mockStatus: WdsStatus = {
      numApps: '1',
      wdsResponsive: 'true',
      version: 'c87286c',
      chartVersion: 'wds-0.24.0',
      image: 'us.gcr.io/broad-dsp-gcr-public/terra-workspace-data-service:eaf3f31',
      wdsStatus: 'UP',
      wdsDbStatus: 'UP',
      wdsPingStatus: 'UP',
      wdsIamStatus: 'UP',
      appName: 'wds-6601fdbb-4b53-41da-87b2-81385f4a760e',
      appStatus: 'RUNNING',
      proxyUrl:
        'https://lz34dd00bf3fdaa72f755eeea8f928bab7cd135043043d59d5.servicebus.windows.net/wds-6601fdbb-4b53-41da-87b2-81385f4a760e-6601fdbb-4b53-41da-87b2-81385f4a760e/',
      defaultInstanceExists: 'true',
      cloneSourceWorkspaceId: 'b3cc4ed2-678c-483f-9953-5d4789d5fa1b',
      cloneStatus: 'RESTORESUCCEEDED',
      cloneErrorMessage: null,
    };

    asMockedFn(useWdsStatus).mockReturnValue({
      status: mockStatus,
      refreshStatus: jest.fn(),
    });

    const mockSourceWorkspace: WorkspaceWrapper = {
      workspace: {
        workspaceId: mockStatus.cloneSourceWorkspaceId!,
        namespace: 'test-workspaces',
        name: 'test-workspace',
        cloudPlatform: 'Azure',
        authorizationDomain: [],
        createdBy: 'user@example.com',
        createdDate: '2023-02-15T19:17:15.711Z',
      },
      azureContext: {
        managedResourceGroupId: 'test-mrg',
        subscriptionId: 'test-sub-id',
        tenantId: 'test-tenant-id',
      },
      accessLevel: 'OWNER',
      canShare: true,
      canCompute: true,
    };

    asMockedFn(useWorkspaceById).mockReturnValue({
      workspace: mockSourceWorkspace,
      status: 'Ready',
    });

    // Act
    render(
      h(WdsTroubleshooter, {
        workspaceId: 'test-workspace',
        mrgId: 'test-mrg',
        onDismiss: jest.fn(),
      })
    );

    // Assert
    const tableRows = screen.getAllByRole('row');
    const statusLabelAndValueCells = tableRows.map((row) => {
      const cells = getAllByRole(row, 'cell');
      return cells.slice(1).map((el) => el.textContent);
    });

    expect(statusLabelAndValueCells).toEqual([
      ['Workspace Id', 'test-workspace'],
      ['Resource Group Id', 'test-mrg'],
      ['App listing', '1 app(s) total'],
      ['Data app name', 'wds-6601fdbb-4b53-41da-87b2-81385f4a760e'],
      ['Data app running?', 'RUNNING'],
      [
        'Data app proxy url',
        'https://lz34dd00bf3fdaa72f755eeea8f928bab7cd135043043d59d5.servicebus.windows.net/wds-6601fdbb-4b53-41da-87b2-81385f4a760e-6601fdbb-4b53-41da-87b2-81385f4a760e/',
      ],
      ['Data app responding', 'true'],
      ['Data app version', 'c87286c'],
      ['Data app chart version', 'wds-0.24.0'],
      ['Data app image', 'terra-workspace-data-service:eaf3f31'],
      ['Data app status', 'UP'],
      ['Data app DB status', 'UP'],
      ['Data app ping status', 'UP'],
      ['Data app IAM status', 'UP'],
      ['Default Instance exists', 'true'],
      ['Data table clone source', 'test-workspaces/test-workspace'],
      ['Data table clone status', 'RESTORESUCCEEDED'],
    ]);
  });

  it('shows clone error message if present', () => {
    // Arrange
    const mockStatus: WdsStatus = {
      numApps: '1',
      wdsResponsive: 'true',
      version: 'c87286c',
      chartVersion: 'wds-0.24.0',
      image: 'us.gcr.io/broad-dsp-gcr-public/terra-workspace-data-service:eaf3f31',
      wdsStatus: 'UP',
      wdsDbStatus: 'UP',
      wdsPingStatus: 'UP',
      wdsIamStatus: 'UP',
      appName: 'wds-6601fdbb-4b53-41da-87b2-81385f4a760e',
      appStatus: 'RUNNING',
      proxyUrl:
        'https://lz34dd00bf3fdaa72f755eeea8f928bab7cd135043043d59d5.servicebus.windows.net/wds-6601fdbb-4b53-41da-87b2-81385f4a760e-6601fdbb-4b53-41da-87b2-81385f4a760e/',
      defaultInstanceExists: 'true',
      cloneSourceWorkspaceId: 'b3cc4ed2-678c-483f-9953-5d4789d5fa1b',
      cloneStatus: 'BACKUPERROR',
      cloneErrorMessage: 'Something went wrong',
    };

    asMockedFn(useWdsStatus).mockReturnValue({
      status: mockStatus,
      refreshStatus: jest.fn(),
    });

    const mockSourceWorkspace: WorkspaceWrapper = {
      workspace: {
        workspaceId: mockStatus.cloneSourceWorkspaceId!,
        namespace: 'test-workspaces',
        name: 'test-workspace',
        cloudPlatform: 'Azure',
        authorizationDomain: [],
        createdBy: 'user@example.com',
        createdDate: '2023-02-15T19:17:15.711Z',
      },
      azureContext: {
        managedResourceGroupId: 'test-mrg',
        subscriptionId: 'test-sub-id',
        tenantId: 'test-tenant-id',
      },
      accessLevel: 'OWNER',
      canShare: true,
      canCompute: true,
    };

    asMockedFn(useWorkspaceById).mockReturnValue({
      workspace: mockSourceWorkspace,
      status: 'Ready',
    });

    // Act
    render(
      h(WdsTroubleshooter, {
        workspaceId: 'test-workspace',
        mrgId: 'test-mrg',
        onDismiss: jest.fn(),
      })
    );

    // Assert
    const tableRows = screen.getAllByRole('row');
    const statusLabelAndValueCells = tableRows.map((row) => {
      const cells = getAllByRole(row, 'cell');
      return cells.slice(1).map((el) => el.textContent);
    });

    expect(statusLabelAndValueCells).toEqual([
      ['Workspace Id', 'test-workspace'],
      ['Resource Group Id', 'test-mrg'],
      ['App listing', '1 app(s) total'],
      ['Data app name', 'wds-6601fdbb-4b53-41da-87b2-81385f4a760e'],
      ['Data app running?', 'RUNNING'],
      [
        'Data app proxy url',
        'https://lz34dd00bf3fdaa72f755eeea8f928bab7cd135043043d59d5.servicebus.windows.net/wds-6601fdbb-4b53-41da-87b2-81385f4a760e-6601fdbb-4b53-41da-87b2-81385f4a760e/',
      ],
      ['Data app responding', 'true'],
      ['Data app version', 'c87286c'],
      ['Data app chart version', 'wds-0.24.0'],
      ['Data app image', 'terra-workspace-data-service:eaf3f31'],
      ['Data app status', 'UP'],
      ['Data app DB status', 'UP'],
      ['Data app ping status', 'UP'],
      ['Data app IAM status', 'UP'],
      ['Default Instance exists', 'true'],
      ['Data table clone source', 'test-workspaces/test-workspace'],
      ['Data table clone status', 'BACKUPERROR (Something went wrong)'],
    ]);
  });

  it('copies status to clipboard', async () => {
    // Arrange
    const user = userEvent.setup();

    const mockStatus: WdsStatus = {
      numApps: '1',
      wdsResponsive: 'true',
      version: 'c87286c',
      chartVersion: 'wds-0.24.0',
      image: 'us.gcr.io/broad-dsp-gcr-public/terra-workspace-data-service:eaf3f31',
      wdsStatus: 'UP',
      wdsDbStatus: 'UP',
      wdsPingStatus: 'UP',
      wdsIamStatus: 'UP',
      appName: 'wds-6601fdbb-4b53-41da-87b2-81385f4a760e',
      appStatus: 'RUNNING',
      proxyUrl:
        'https://lz34dd00bf3fdaa72f755eeea8f928bab7cd135043043d59d5.servicebus.windows.net/wds-6601fdbb-4b53-41da-87b2-81385f4a760e-6601fdbb-4b53-41da-87b2-81385f4a760e/',
      defaultInstanceExists: 'true',
      cloneSourceWorkspaceId: null,
      cloneStatus: null,
      cloneErrorMessage: null,
    };

    asMockedFn(useWdsStatus).mockReturnValue({
      status: mockStatus,
      refreshStatus: jest.fn(),
    });

    render(
      h(WdsTroubleshooter, {
        workspaceId: 'test-workspace',
        mrgId: 'test-mrg',
        onDismiss: jest.fn(),
      })
    );

    // Act
    const copyToClipboardButton = screen.getByLabelText('Copy troubleshooting info to clipboard');
    await user.click(copyToClipboardButton);

    // Assert
    expect(clipboard.writeText).toHaveBeenCalledWith(
      [
        'Workspace Id,test-workspace',
        'Resource Group Id,test-mrg',
        'App listing,1 app(s) total',
        'Data app name,wds-6601fdbb-4b53-41da-87b2-81385f4a760e',
        'Data app running?,RUNNING',
        'Data app proxy url,https://lz34dd00bf3fdaa72f755eeea8f928bab7cd135043043d59d5.servicebus.windows.net/wds-6601fdbb-4b53-41da-87b2-81385f4a760e-6601fdbb-4b53-41da-87b2-81385f4a760e/',
        'Data app responding,true',
        'Data app version,c87286c',
        'Data app chart version,wds-0.24.0',
        'Data app image,terra-workspace-data-service:eaf3f31',
        'Data app status,UP',
        'Data app DB status,UP',
        'Data app ping status,UP',
        'Data app IAM status,UP',
        'Default Instance exists,true',
      ].join('\n')
    );
  });
});
