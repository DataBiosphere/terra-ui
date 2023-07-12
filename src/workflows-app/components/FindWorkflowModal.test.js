import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { Apps } from 'src/libs/ajax/leonardo/Apps';
import { getConfig } from 'src/libs/config';
import FindWorkflowModal from 'src/workflows-app/components/FindWorkflowModal';

jest.mock('src/libs/ajax');
jest.mock('src/libs/ajax/leonardo/Apps');
jest.mock('src/libs/notifications.js');
jest.mock('src/libs/nav.js', () => ({
  getCurrentUrl: jest.fn().mockReturnValue(new URL('https://app.terra.bio')),
  goToPath: jest.fn(),
}));
jest.mock('src/libs/config', () => ({
  ...jest.requireActual('src/libs/config'),
  getConfig: jest.fn().mockReturnValue({}),
}));

describe('FindWorkflowModal', () => {
  beforeEach(() => {
    getConfig.mockReturnValue({ isDockstoreEnabled: false });
    getConfig.mockReturnValue({ isURLEnabled: false });
    getConfig.mockReturnValue({ dockstoreRootUrl: 'https://staging.dockstore.org/' });
  });

  const workspace = {
    workspace: {
      namespace: 'test',
      name: 'test',
      cloudPlatform: 'Azure',
      workspaceId: '79201ea6-519a-4077-a9a4-75b2a7c4cdeb',
    },
  };

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

  it('should render FindWorkflowModal with 5 hardcoded Method cards', () => {
    // ** ACT **
    render(h(FindWorkflowModal, { onDismiss: jest.fn() }));

    // ** ASSERT **
    expect(screen.getByText('Find a Workflow')).toBeInTheDocument();

    // verify "Browse Suggested Workflows" sub-header is present and selected by default
    const selectedSubHeader = screen.getByText('Browse Suggested Workflows');
    expect(selectedSubHeader).toBeInTheDocument();
    expect(selectedSubHeader).toHaveAttribute('aria-current', 'true');

    // verify 5 methods are present on screen
    // we only check for name because we are testing the MethodCard layout in different test file
    expect(screen.getByText('Optimus')).toBeInTheDocument();
    expect(screen.getByText('MultiSampleSmartSeq2SingleNucleus')).toBeInTheDocument();
    expect(screen.getByText('scATAC')).toBeInTheDocument();
    expect(screen.getByText('WholeGenomeGermlineSingleSample')).toBeInTheDocument();
    expect(screen.getByText('ExomeGermlineSingleSample')).toBeInTheDocument();
  });

  it('should call POST /methods endpoint with expected parameters', async () => {
    const postMethodFunction = jest.fn(() => Promise.resolve({ method_id: 'abc123' }));
    const mockListAppsFn = jest.fn(() => Promise.resolve(mockAppResponse));

    await Apps.mockImplementation(() => {
      return {
        listAppsV2: jest.fn(mockListAppsFn),
      };
    });

    await Ajax.mockImplementation(() => {
      return {
        Cbas: {
          methods: {
            post: postMethodFunction,
          },
        },
      };
    });

    // ** ACT **
    render(h(FindWorkflowModal, { onDismiss: jest.fn(), workspace }));

    // ** ASSERT **
    expect(screen.getByText('Find a Workflow')).toBeInTheDocument();

    // select and click on method in modal
    const firstWorkflow = screen.getByText('Optimus');
    await act(async () => {
      await userEvent.click(firstWorkflow);
    });

    // ** ASSERT **
    // assert POST /methods endpoint was called with expected parameters
    expect(postMethodFunction).toHaveBeenCalled();
    expect(postMethodFunction).toBeCalledWith({
      method_name: 'Optimus',
      method_description:
        'The optimus 3 pipeline processes 10x genomics sequencing data based on the v2 chemistry. It corrects cell barcodes and UMIs, aligns reads, marks duplicates, and returns data as alignments in BAM format and as counts in sparse matrix exchange format.',
      method_source: 'GitHub',
      method_version: 'Optimus_v5.7.2',
      method_url: 'https://raw.githubusercontent.com/broadinstitute/warp/Optimus_v5.7.2/pipelines/skylab/optimus/Optimus.wdl',
    });
  });

  it('should link to Dockstore staging when clicked', () => {
    getConfig().isDockstoreEnabled = true;

    // ** ACT **
    render(h(FindWorkflowModal, { onDismiss: jest.fn() }));

    const dockstoreSubHeader = screen.getByText('Dockstore');
    fireEvent.click(dockstoreSubHeader);

    const dockstoreButton = screen.getByText('Go to Dockstore');
    expect(dockstoreButton).toHaveAttribute('href', 'https://staging.dockstore.org/search?_type=workflow&descriptorType=WDL&searchMode=files');
  });
});
