import { getAllByRole, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as clipboard from 'clipboard-polyfill/text';
import { h } from 'react-hyperscript-helpers';
import { useWdsStatus, WdsStatus } from 'src/libs/wds-status';
import { asMockedFn } from 'src/testing/test-utils';

import { WdsTroubleshooter } from './WdsTroubleshooter';

type WdsStatusExports = typeof import('src/libs/wds-status');
jest.mock('src/libs/wds-status', (): WdsStatusExports => {
  return {
    useWdsStatus: jest.fn(),
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
      image: 'us.gcr.io/broad-dsp-gcr-public/terra-workspace-data-service',
      wdsStatus: 'UP',
      wdsDbStatus: 'UP',
      wdsPingStatus: 'UP',
      wdsIamStatus: 'UP',
      appName: 'wds-6601fdbb-4b53-41da-87b2-81385f4a760e',
      appStatus: 'RUNNING',
      proxyUrl:
        'https://lz34dd00bf3fdaa72f755eeea8f928bab7cd135043043d59d5.servicebus.windows.net/wds-6601fdbb-4b53-41da-87b2-81385f4a760e-6601fdbb-4b53-41da-87b2-81385f4a760e/',
      defaultInstanceExists: 'true',
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
      ['Data app image', 'us.gcr.io/broad-dsp-gcr-public/terra-workspace-data-service'],
      ['Data app status', 'UP'],
      ['Data app DB status', 'UP'],
      ['Data app ping status', 'UP'],
      ['Data app IAM status', 'UP'],
      ['Default Instance exists', 'true'],
    ]);
  });

  it('copies status to clipboard', async () => {
    // Arrange
    const user = userEvent.setup();

    const mockStatus: WdsStatus = {
      numApps: '1',
      wdsResponsive: 'true',
      version: 'c87286c',
      wdsStatus: 'UP',
      wdsDbStatus: 'UP',
      wdsPingStatus: 'UP',
      wdsIamStatus: 'UP',
      appName: 'wds-6601fdbb-4b53-41da-87b2-81385f4a760e',
      appStatus: 'RUNNING',
      proxyUrl:
        'https://lz34dd00bf3fdaa72f755eeea8f928bab7cd135043043d59d5.servicebus.windows.net/wds-6601fdbb-4b53-41da-87b2-81385f4a760e-6601fdbb-4b53-41da-87b2-81385f4a760e/',
      defaultInstanceExists: 'true',
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
        'Data app status,UP',
        'Data app DB status,UP',
        'Data app ping status,UP',
        'Data app IAM status,UP',
        'Default Instance exists,true',
      ].join('\n')
    );
  });
});
