import { screen } from '@testing-library/react';
import React from 'react';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import { navPaths, SubmissionWorkflowsTable } from 'src/pages/workspaces/workspace/submissionHistory/SubmissionDetails';
import { asMockedFn, renderWithAppContexts } from 'src/testing/test-utils';

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

  test('should render the Cost Threshold when enabled', () => {
    // Arrange
    asMockedFn(isFeaturePreviewEnabled).mockReturnValue(true);

    // Act
    renderWithAppContexts(<SubmissionWorkflowsTable workspace={testGoogleWorkspace} submission={testSubmission} />);

    // Assert
    expect(screen.getByText('Per Workflow Cost Threshold:')).toBeInTheDocument();
  });

  test('should not render the Cost Threshold when disabled', () => {
    // Arrange
    asMockedFn(isFeaturePreviewEnabled).mockReturnValue(false);

    // Act
    renderWithAppContexts(<SubmissionWorkflowsTable workspace={testGoogleWorkspace} submission={testSubmission} />);

    // Assert
    expect(screen.queryByText('Per Workflow Cost Threshold:')).not.toBeInTheDocument();
  });
});
