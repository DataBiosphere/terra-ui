import { partial } from '@terra-ui-packages/test-utils';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileSaver from 'file-saver';
import React from 'react';
import { CromIAM, CromIamAjaxContract } from 'src/libs/ajax/workflows-app/CromIAM';
import colors from 'src/libs/colors';
import { navPaths, SubmissionWorkflowsTable } from 'src/pages/workspaces/workspace/submissionHistory/SubmissionDetails';
import { asMockedFn, renderWithAppContexts } from 'src/testing/test-utils';

jest.mock('src/libs/ajax/workflows-app/CromIAM');
jest.mock('file-saver', () => ({ saveAs: jest.fn() }));

type NavExports = typeof import('src/libs/nav');
jest.mock(
  'src/libs/nav',
  (): NavExports => ({
    ...jest.requireActual('src/libs/nav'),
    getLink: jest.fn(),
  })
);

jest.mock('src/libs/feature-previews', () => ({
  ...jest.requireActual('src/libs/feature-previews'),
  isFeaturePreviewEnabled: jest.fn(),
}));

describe('Route Accessibility', () => {
  test('should contain valid paths for SubmissionDetails', () => {
    const expectedPaths = [
      '/workspaces/:namespace/:name/submission_history/:submissionId',
      '/workspaces/:namespace/:name/job_history/:submissionId',
    ];

    const actualPaths = navPaths.map((route) => route.path);

    expect(actualPaths).toEqual(expect.arrayContaining(expectedPaths));
  });
});

describe('Cost Threshold', () => {
  const testGoogleWorkspace = {
    accessLevel: 'OWNER',
    owners: ['groot@gmail.com'],
    workspace: {
      attributes: {
        description: '',
      },
      authorizationDomain: [],
      billingAccount: 'billingAccounts/google-billing-account',
      bucketName: 'bucket-name',
      cloudPlatform: 'Gcp',
      completedCloneWorkspaceFileTransfer: '2024-11-27T22:29:04.319Z',
      createdBy: 'groot@gmail.com',
      createdDate: '2024-11-27T22:26:06.124Z',
      googleProject: 'google-project-id',
      isLocked: false,
      lastModified: '2024-11-27T22:26:06.202Z',
      name: 'groot-scientific-workflow',
      namespace: 'groot-namespace',
      workspaceId: 'google-workspace-id',
      workspaceType: 'rawls',
      workspaceVersion: 'v2',
    },
    canShare: true,
    canCompute: true,
    workspaceInitialized: true,
  };

  const testSubmission = {
    extraInputs: [],
    invalidInputs: {},
    invalidOutputs: {},
    methodConfiguration: {
      deleted: false,
      inputs: {
        'echo_strings.echo_to_file.input1': 'this.newString',
      },
      methodConfigVersion: 2,
      methodRepoMethod: {
        methodName: 'echo_to_file',
        methodVersion: 12,
        methodNamespace: 'gatk',
        methodUri: 'agora://gatk/echo_to_file/12',
        sourceRepo: 'agora',
      },
      name: 'echo_to_file-configured',
      namespace: 'gatk',
      outputs: {
        'echo_strings.echo_to_file.out': 'this.output',
      },
      prerequisites: {},
      rootEntityType: 'sra',
    },
    missingInputs: [],
    validInputs: ['echo_strings.echo_to_file.input1'],
    validOutputs: ['echo_strings.echo_to_file.out'],
  };

  test('should render the Cost Threshold', () => {
    // Arrange & Act
    renderWithAppContexts(<SubmissionWorkflowsTable workspace={testGoogleWorkspace} submission={testSubmission} />);

    // Assert
    expect(screen.getByText('Per Workflow Cost Threshold:')).toBeInTheDocument();
  });
});

describe('Download metadata', () => {
  const workflowId = 'b5ea4c3a-7d4f-4b55-9c4c-2c1c0b2f2f9e';
  const workspace = {
    workspace: { namespace: 'test-namespace', name: 'test-workspace' },
  };
  const makeSubmission = (statusLastChangedDate: string) => ({
    submissionId: 'test-submission-id',
    submissionRoot: 'gs://bucket/submissions/test-submission-id',
    workflows: [
      {
        workflowId,
        status: 'Succeeded',
        statusLastChangedDate,
        messages: [],
        inputResolutions: [{ inputName: 'echo_strings.echo_to_file.input1' }],
        asText: '',
      },
    ],
  });

  beforeAll(() => {
    // AutoSizer renders nothing at 0x0, so give it room to lay out the table
    jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(1000);
    jest.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1000);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('fetches metadata from CromIAM and saves it as JSON', async () => {
    // Arrange
    const user = userEvent.setup();
    const metadataDoc = {
      id: workflowId,
      status: 'Succeeded',
      workflowName: 'my_workflow',
      submission: '2026-11-17T20:43:03.978Z',
      calls: {},
    };
    const mockWorkflowMetadata = jest.fn().mockResolvedValue(metadataDoc);
    asMockedFn(CromIAM).mockReturnValue(partial<CromIamAjaxContract>({ workflowMetadata: mockWorkflowMetadata }));

    renderWithAppContexts(
      <SubmissionWorkflowsTable workspace={workspace} submission={makeSubmission(new Date().toISOString())} />
    );

    // Act
    await user.click(screen.getByLabelText(`Download metadata (for workflow ID ${workflowId})`));

    // Assert
    await waitFor(() => expect(FileSaver.saveAs).toHaveBeenCalledTimes(1));
    expect(mockWorkflowMetadata).toHaveBeenCalledWith(
      workflowId,
      expect.arrayContaining(['calls', 'inputs', 'outputs', 'executionEvents']),
      ['callCaching:hitFailures']
    );
    const [blob, filename] = asMockedFn(FileSaver.saveAs).mock.calls[0];
    expect(filename).toBe(`20261117T2043Z-${workflowId}-metadata.json`);
    expect(JSON.parse(await (blob as Blob).text())).toEqual(metadataDoc);
  });

  test('shows Jamie running and ignores repeat clicks until the download finishes', async () => {
    // Arrange
    const user = userEvent.setup();
    let resolveMetadata: (value: object) => void = () => {};
    const mockWorkflowMetadata = jest.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveMetadata = resolve;
      })
    );
    asMockedFn(CromIAM).mockReturnValue(partial<CromIamAjaxContract>({ workflowMetadata: mockWorkflowMetadata }));

    renderWithAppContexts(
      <SubmissionWorkflowsTable workspace={workspace} submission={makeSubmission(new Date().toISOString())} />
    );

    // Act
    await user.click(screen.getByLabelText(`Download metadata (for workflow ID ${workflowId})`));
    const busyButton = await screen.findByLabelText(`Downloading metadata (for workflow ID ${workflowId})`);
    await user.click(busyButton);

    // Assert
    expect(busyButton).toHaveAttribute('aria-busy', 'true');
    // Hover and focus keep the normal color, so Jamie doesn't stay lightened after the click focuses it
    expect(busyButton.style.getPropertyValue('--app-hover-color')).toBe(colors.accent());
    expect(busyButton.querySelector('[data-icon="running-jamie"]')).toBeInTheDocument();
    expect(mockWorkflowMetadata).toHaveBeenCalledTimes(1);

    // Act
    resolveMetadata({ id: workflowId, submission: '2026-11-17T20:43:03.978Z' });

    // Assert
    expect(await screen.findByLabelText(`Download metadata (for workflow ID ${workflowId})`)).toBeInTheDocument();
  });
});
