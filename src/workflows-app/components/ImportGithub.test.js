import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import { ENABLE_WORKFLOWS_SUBMISSION_UX_REVAMP } from 'src/libs/feature-previews-config';
import { AppProxyUrlStatus, workflowsAppStore } from 'src/libs/state';
import ImportGithub from 'src/workflows-app/components/ImportGithub';

jest.mock('src/libs/ajax');
jest.mock('src/libs/ajax/leonardo/Apps');
jest.mock('src/libs/notifications');
jest.mock('src/libs/nav', () => ({
  getCurrentUrl: jest.fn().mockReturnValue(new URL('https://app.terra.bio')),
  goToPath: jest.fn(),
}));
jest.mock('src/libs/config', () => ({
  ...jest.requireActual('src/libs/config'),
  getConfig: jest.fn().mockReturnValue({}),
}));
jest.mock('src/libs/state', () => ({
  ...jest.requireActual('src/libs/state'),
  getTerraUser: jest.fn(),
}));

jest.mock('src/libs/feature-previews', () => ({
  ...jest.requireActual('src/libs/feature-previews'),
  isFeaturePreviewEnabled: jest.fn(),
}));

describe('Add a Workflow Link', () => {
  const workspace = {
    workspace: {
      namespace: 'test',
      name: 'test',
      cloudPlatform: 'Azure',
      workspaceId: '79201ea6-519a-4077-a9a4-75b2a7c4cdeb',
    },
  };

  it('should render text inputs/headers', async () => {
    // ** ACT **
    render(h(ImportGithub, { onDismiss: jest.fn() }));

    const urlLink = screen.getByText('Workflow Link *');
    const workflowName = screen.getByText('Workflow Name *');
    const addToWorkspaceButton = screen.getByText('Add to Workspace');

    expect(urlLink).toBeInTheDocument();
    expect(workflowName).toBeInTheDocument();
    expect(addToWorkspaceButton).toBeInTheDocument();
  });

  it('should submit github.com links for a running Workflows app', async () => {
    const githubLink = 'https://github.com/broadinstitute/cromwell/blob/develop/wdl/transforms/draft3/src/test/cases/simple_task.wdl';
    const postMethodFunction = jest.fn(() => Promise.resolve({ method_id: 'abc123' }));
    const user = userEvent.setup();

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
    render(h(ImportGithub, { setLoading: jest.fn(), signal: jest.fn(), onDismiss: jest.fn(), workspace }));

    const urlLink = screen.getByPlaceholderText('Paste Github link');
    const workflowName = screen.getByPlaceholderText('Workflow Name');
    const addToWorkspaceButtonDisabled = screen.getByLabelText('Add to Workspace button');

    expect(addToWorkspaceButtonDisabled.getAttribute('aria-disabled')).toBe('true');

    fireEvent.change(urlLink, { target: { value: githubLink } });
    expect(workflowName.value).toBe('simple_task');
    const addToWorkspaceButtonEnabled = screen.getByLabelText('Add to Workspace button');
    expect(addToWorkspaceButtonEnabled.getAttribute('aria-disabled')).toBe('false');
    await user.click(addToWorkspaceButtonEnabled);

    // ** ASSERT **
    // assert POST /methods endpoint was called with expected parameters & transformed github.com link
    expect(postMethodFunction).toHaveBeenCalledTimes(1);
    expect(postMethodFunction).toHaveBeenCalledWith('https://lz-abc/terra-app-abc/cbas', {
      method_name: 'simple_task',
      method_description: undefined,
      method_source: 'GitHub',
      method_version: 'develop',
      method_url: githubLink,
    });
  });

  it('should accept raw github.com links for a running Workflows app', async () => {
    const rawGithubLink = 'https://raw.githubusercontent.com/broadinstitute/cromwell/develop/wdl/transforms/draft3/src/test/cases/simple_task.wdl';
    const postMethodFunction = jest.fn(() => Promise.resolve({ method_id: 'abc123' }));
    const user = userEvent.setup();

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
    render(h(ImportGithub, { setLoading: jest.fn(), signal: jest.fn(), onDismiss: jest.fn(), workspace }));

    const urlLink = screen.getByPlaceholderText('Paste Github link');
    const workflowName = screen.getByPlaceholderText('Workflow Name');

    fireEvent.change(urlLink, { target: { value: rawGithubLink } });
    // Expect autofill
    expect(workflowName.value).toBe('simple_task');
    // User change name
    await user.clear(workflowName);
    fireEvent.change(workflowName, { target: { value: 'Test workflow again' } });
    const addToWorkspaceButtonEnabled = screen.getByLabelText('Add to Workspace button');
    await user.click(addToWorkspaceButtonEnabled);

    // Check that raw github links still work
    expect(postMethodFunction).toHaveBeenCalledTimes(1);
    expect(postMethodFunction).toHaveBeenCalledWith('https://lz-abc/terra-app-abc/cbas', {
      method_name: 'Test workflow again',
      method_description: undefined,
      method_source: 'GitHub',
      method_version: 'develop',
      method_url: rawGithubLink,
    });
  });

  it('should fail when given a non github link', async () => {
    const postMethodFunction = jest.fn(() => Promise.resolve({ method_id: 'abc123' }));

    await Ajax.mockImplementation(() => {
      return {
        Cbas: {
          methods: {
            post: postMethodFunction,
          },
        },
      };
    });

    const onDismiss = jest.fn();
    // ** ACT **
    render(h(ImportGithub, { setLoading: jest.fn(), signal: jest.fn(), onDismiss }));

    const urlLink = screen.getByPlaceholderText('Paste Github link');
    const workflowName = screen.getByPlaceholderText('Workflow Name');
    const addToWorkspaceButton = screen.getByLabelText('Add to Workspace button');

    fireEvent.change(urlLink, { target: { value: 'lol.com' } });
    fireEvent.change(workflowName, { target: { value: 'Test bad workflow' } });

    expect(addToWorkspaceButton.getAttribute('aria-disabled')).toBe('true');
  });

  it('should not be able to import workflow if CBAS proxy url is not ready', async () => {
    // ** ARRANGE **
    const postMethodFunction = jest.fn(() => Promise.resolve({ method_id: 'abc123' }));
    const user = userEvent.setup();

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
    render(h(ImportGithub, { setLoading: jest.fn(), signal: jest.fn(), onDismiss: jest.fn(), workspace }));

    const urlLink = screen.getByPlaceholderText('Paste Github link');

    fireEvent.change(urlLink, {
      target: { value: 'https://github.com/broadinstitute/cromwell/blob/develop/wdl/transforms/draft3/src/test/cases/simple_task.wdl' },
    });
    const addToWorkspaceButtonEnabled = screen.getByLabelText('Add to Workspace button');
    expect(addToWorkspaceButtonEnabled.getAttribute('aria-disabled')).toBe('false');
    await user.click(addToWorkspaceButtonEnabled);

    // ** ASSERT **
    expect(postMethodFunction).toHaveBeenCalledTimes(0);
  });

  it('shows modal on successful import', async () => {
    isFeaturePreviewEnabled.mockImplementation((id) => (id === ENABLE_WORKFLOWS_SUBMISSION_UX_REVAMP ? true : isFeaturePreviewEnabled(id)));

    const githubLink = 'https://github.com/broadinstitute/cromwell/blob/develop/wdl/transforms/draft3/src/test/cases/simple_task.wdl';
    const postMethodFunction = jest.fn(() => Promise.resolve({ method_id: 'abc123' }));
    const user = userEvent.setup();

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
    render(h(ImportGithub, { setLoading: jest.fn(), signal: jest.fn(), onDismiss: jest.fn(), workspace }));

    const urlLink = screen.getByPlaceholderText('Paste Github link');
    const workflowName = screen.getByPlaceholderText('Workflow Name');

    fireEvent.change(urlLink, { target: { value: githubLink } });
    // Expect autofill
    expect(workflowName.value).toBe('simple_task');

    const addToWorkspaceButtonEnabled = screen.getByLabelText('Add to Workspace button');
    await user.click(addToWorkspaceButtonEnabled);

    expect(postMethodFunction).toHaveBeenCalledTimes(1);

    // Expect modal to be on the screen when import is submitted
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
