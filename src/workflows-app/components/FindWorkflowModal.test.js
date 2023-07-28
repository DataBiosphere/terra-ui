import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { getConfig } from 'src/libs/config';
import { AppProxyUrlStatus, workflowsAppStore } from 'src/libs/state';
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

  it('should call POST /methods endpoint with expected parameters when selecting a method card', async () => {
    const postMethodFunction = jest.fn(() => Promise.resolve({ method_id: 'abc123' }));

    await Ajax.mockImplementation(() => {
      return {
        Cbas: {
          methods: {
            post: jest.fn(postMethodFunction),
          },
        },
      };
    });

    workflowsAppStore.set({
      workspaceId: '79201ea6-519a-4077-a9a4-75b2a7c4cdeb',
      cbasProxyUrlState: { status: AppProxyUrlStatus.Ready, state: 'https://lz-abc/terra-app-abc/cbas' },
    });

    // ** ACT **
    render(h(FindWorkflowModal, { onDismiss: jest.fn(), workspace }));

    // ** ASSERT **
    expect(screen.getByText('Find a Workflow')).toBeInTheDocument();

    // select and click on method in modal
    const firstWorkflow = screen.getByText('Optimus');
    await userEvent.click(firstWorkflow);
    await waitFor(() => {
      expect(postMethodFunction).toHaveBeenCalled();
    });

    // ** ASSERT **
    // assert POST /methods endpoint was called with expected parameters
    expect(postMethodFunction).toBeCalledWith('https://lz-abc/terra-app-abc/cbas', {
      method_name: 'Optimus',
      method_description:
        'The optimus 3 pipeline processes 10x genomics sequencing data based on the v2 chemistry. It corrects cell barcodes and UMIs, aligns reads, marks duplicates, and returns data as alignments in BAM format and as counts in sparse matrix exchange format.',
      method_source: 'GitHub',
      method_version: 'Optimus_v5.8.0',
      method_url: 'https://raw.githubusercontent.com/broadinstitute/warp/Optimus_v5.8.0/pipelines/skylab/optimus/Optimus.wdl',
    });
  });

  it("should not be able to import method if CBAS proxy url isn't available", async () => {
    // ** ARRANGE **
    const postMethodFunction = jest.fn(() => Promise.resolve({ method_id: 'abc123' }));

    await Ajax.mockImplementation(() => {
      return {
        Cbas: {
          methods: {
            post: jest.fn(postMethodFunction),
          },
        },
      };
    });

    workflowsAppStore.set({
      workspaceId: '79201ea6-519a-4077-a9a4-75b2a7c4cdeb',
      cbasProxyUrlState: { status: AppProxyUrlStatus.None, state: '' },
    });

    // ** ACT **
    render(h(FindWorkflowModal, { onDismiss: jest.fn(), workspace }));

    // ** ASSERT **
    expect(screen.getByText('Find a Workflow')).toBeInTheDocument();

    // select and click on method in modal
    const firstWorkflow = screen.getByText('Optimus');
    await userEvent.click(firstWorkflow);

    expect(postMethodFunction).toBeCalledTimes(0);
  });
});
