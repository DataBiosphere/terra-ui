import { Theme, ThemeProvider } from '@terra-ui-packages/components';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { Workspaces } from 'src/libs/ajax/workspaces/Workspaces';
import { navPaths, SubmissionHistory } from 'src/pages/workspaces/workspace/SubmissionHistory';
import { asMockedFn, SelectHelper } from 'src/testing/test-utils';
import { useWorkspace } from 'src/workspaces/common/state/useWorkspace';

jest.mock('react-virtualized', () => {
  const actual = jest.requireActual('react-virtualized');
  return {
    ...actual,
    AutoSizer: ({ children }: any) => children({ width: 1000, height: 600 }),
  };
});
type NavExports = typeof import('src/libs/nav');
jest.mock(
  'src/libs/nav',
  (): NavExports => ({
    ...jest.requireActual<NavExports>('src/libs/nav'),
    getLink: jest.fn(() => '/'),
    goToPath: jest.fn(),
    useRoute: jest.fn().mockReturnValue({ params: { namespace: 'test-ns', name: 'test-ws' } }),
    updateSearch: jest.fn(),
  })
);
jest.mock('src/workspaces/common/state/useWorkspace');
jest.mock('src/libs/ajax/workspaces/Workspaces');
asMockedFn(useWorkspace).mockReturnValue({
  workspace: {
    workspace: {
      namespace: 'test-ns',
      name: 'test-ws',
      workspaceId: 'ws-123',
      authorizationDomain: [],
      createdDate: '2025-01-01T00:00:00.000Z',
      createdBy: 'test-user',
      lastModified: '2025-01-02T00:00:00.000Z',
      cloudPlatform: 'Gcp',
      googleProject: 'test-project',
      billingAccount: 'test-billing-account',
      bucketName: 'test-bucket',
    },
    accessLevel: 'OWNER',
    canShare: true,
    canCompute: true,
    policies: [],
    workspaceInitialized: true,
  },
  accessError: false,
  loadingWorkspace: false,
  storageDetails: {
    googleBucketLocation: 'US',
    googleBucketType: 'multi-region',
    fetchedGoogleBucketLocation: 'SUCCESS',
  },
  refreshWorkspace: jest.fn(),
});

describe('Route Accessibility', () => {
  test('should contain valid paths for SubmissionHistory', () => {
    const expectedPaths = [
      '/workspaces/:namespace/:name/submission_history',
      '/workspaces/:namespace/:name/job_history',
    ];

    const actualPaths = navPaths.map((route) => route.path);

    expect(actualPaths).toEqual(expect.arrayContaining(expectedPaths));
  });
});

const renderSubmissionHistory = () => {
  const terraTheme: Theme = {
    colorPalette: {
      primary: '#74ae43',
      secondary: '#6d6e70',
      accent: '#4d72aa',
      success: '#74ae43',
      warning: '#f7981c',
      danger: '#db3214',
      light: '#e9ecef',
      dark: '#333f52',
      grey: '#808080',
      disabled: '#b6b7b8',
    },
  };
  return render(
    <ThemeProvider theme={terraTheme}>
      <SubmissionHistory namespace='test-ns' name='test-ws' />
    </ThemeProvider>
  );
};

describe('SubmissionHistory date range filter', () => {
  const now = new Date();
  const recentSubmissionTime = now.toISOString();
  const oldSubmissionTime = new Date(new Date().setDate(now.getDate() - 45)).toISOString();
  const mockSubmissions = [
    {
      submissionDate: recentSubmissionTime, // 10 days ago
      methodConfigurationName: 'Recent Submission',
      methodConfigurationNamespace: 'Test',
      submissionId: 'recent-1',
      submissionRoot: 'gs://test-bucket/recent-1',
      workflowStatuses: { running: 1 },
      status: 'Done',
      submitter: 'user1',
      submissionEntity: { entityName: 'entity1', entityType: 'type1' },
      userComment: 'Recent',
    },
    {
      submissionDate: oldSubmissionTime, // 40 days ago
      methodConfigurationName: 'Old Submission',
      methodConfigurationNamespace: 'Test',
      submissionId: 'old-1',
      submissionRoot: 'gs://test-bucket/old-1',
      workflowStatuses: { succeeded: 1 },
      status: 'Done',
      submitter: 'user2',
      submissionEntity: { entityName: 'entity2', entityType: 'type2' },
      userComment: 'Old',
    },
  ];
  const listSubmissions = jest.fn();

  beforeEach(() => {
    listSubmissions.mockImplementation((params) => {
      if (params?.startDate) {
        return Promise.resolve(mockSubmissions.filter((s) => s.submissionDate >= params.startDate));
      }
      return Promise.resolve(mockSubmissions);
    });
    asMockedFn(Workspaces).mockReturnValue({
      workspace: () => ({
        listSubmissions,
      }),
    } as unknown as ReturnType<typeof Workspaces>);
  });

  test('shows only submissions from the past 30 days by default', async () => {
    await act(async () => {
      renderSubmissionHistory();
    });

    await waitFor(() => {
      const recentSubmission = screen.getByText('Recent Submission');
      expect(recentSubmission).toBeInTheDocument();
    });
    expect(screen.queryByText('Old Submission')).not.toBeInTheDocument();
  });

  test('shows all submissions when "All Submissions" is selected', async () => {
    await act(async () => {
      renderSubmissionHistory();
    });

    await waitFor(() => {
      const recentSubmission = screen.getByText('Recent Submission');
      expect(recentSubmission).toBeInTheDocument();
    });

    // Open the select dropdown and choose "All Submissions"
    const user = userEvent.setup();
    const selectElement = document.getElementById('submission-date-range-select');
    if (!selectElement) {
      fail('Select element not found');
    }
    const selectHelper = new SelectHelper(selectElement, user);
    await selectHelper.selectOption('All Submissions');

    await waitFor(() => {
      expect(screen.getByText('Old Submission')).toBeInTheDocument();
      expect(screen.getByText('Recent Submission')).toBeInTheDocument();
    });
  });
});
