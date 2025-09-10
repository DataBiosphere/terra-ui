import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Teaspoons, TeaspoonsContract } from 'src/libs/ajax/teaspoons/Teaspoons';
import { PipelineRun } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { mockPipelineRun } from 'src/pages/scientificServices/pipelines/utils/mock-utils';
import { PREPARING_JOB_CUTOFF_HOURS } from 'src/pages/scientificServices/pipelines/views/JobHistory';
import { asMockedFn, partial, renderWithAppContexts as render } from 'src/testing/test-utils';

import { JobHistory } from './JobHistory';

jest.mock('src/libs/ajax/teaspoons/Teaspoons');

type FeaturePreviewExports = typeof import('src/libs/feature-previews');
jest.mock(
  'src/libs/feature-previews',
  (): FeaturePreviewExports => ({
    ...jest.requireActual('src/libs/feature-previews'),
    isFeaturePreviewEnabled: jest.fn().mockReturnValue(true),
  })
);

jest.mock('react-virtualized', () => {
  const actual = jest.requireActual('react-virtualized');

  const { AutoSizer } = actual;

  class MockAutoSizer extends AutoSizer {
    state = {
      height: 1000,
      width: 1000,
    };

    setState = () => {};
  }

  return {
    ...actual,
    AutoSizer: MockAutoSizer,
  };
});

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getPath: jest.fn(() => '/test/'),
  getLink: jest.fn(() => '/'),
}));

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    headers: {
      get: jest.fn().mockReturnValue('1234'),
    },
  } as any);
});

describe('job history table', () => {
  it('renders the job history table', async () => {
    const pipelineRun = mockPipelineRun('RUNNING');
    const pipelineRuns = [pipelineRun];

    const mockPipelineRunResponse = {
      pageToken: 'nextPageToken',
      results: pipelineRuns,
      totalResults: 1,
    };

    asMockedFn(Teaspoons).mockReturnValue(
      partial<TeaspoonsContract>({
        getAllPipelineRuns: jest.fn().mockReturnValue(mockPipelineRunResponse),
      })
    );

    render(<JobHistory />);

    expect(await screen.findByText('Job History')).toBeInTheDocument();
    expect(screen.queryAllByText(pipelineRun.description!)).toHaveLength(2);
    expect(screen.queryAllByText('In Progress', { exact: false })).toHaveLength(2);
    expect(screen.getByText('array_imputation v1')).toBeInTheDocument();
  });

  it('allows sorting by columns', async () => {
    const pipelineRun1 = mockPipelineRun('RUNNING');
    const pipelineRun2 = {
      ...mockPipelineRun('SUCCEEDED'),
      jobId: 'run-id-124',
      timeSubmitted: '2024-10-01T00:00:00Z',
      description: 'Another Test Job',
    };
    const pipelineRuns = [pipelineRun1, pipelineRun2];

    const mockPipelineRunResponse = {
      pageToken: 'nextPageToken',
      results: pipelineRuns,
      totalResults: 2,
    };

    asMockedFn(Teaspoons).mockReturnValue(
      partial<TeaspoonsContract>({
        getAllPipelineRuns: jest.fn().mockReturnValue(mockPipelineRunResponse),
      })
    );

    render(<JobHistory />);

    expect(await screen.findByText('Job History')).toBeInTheDocument();
    expect(screen.queryAllByText(/Test Job/)).toHaveLength(2);

    // Verify initial call to API without sort parameters defaults to (created, desc)
    expect(Teaspoons().getAllPipelineRuns).toHaveBeenNthCalledWith(1, 10, 1, 'created', 'desc');

    // Click Job ID header to sort ascending
    const jobIdHeader = screen.getByText('Job ID');
    expect(jobIdHeader).toBeInTheDocument();
    await userEvent.click(jobIdHeader);

    // Verify that API was called with correct sort parameters (jobId, asc)
    expect(Teaspoons().getAllPipelineRuns).toHaveBeenNthCalledWith(2, 10, 1, 'jobId', 'asc');
  });

  it('displays pipeline name without version when version is not available', async () => {
    const pipelineRuns: PipelineRun[] = [
      {
        description: 'Test Job without Version',
        status: 'FAILED',
        pipelineName: 'array_imputation',
        jobId: 'job-789',
        timeSubmitted: '2023-10-03T00:00:00Z',
        timeCompleted: '2023-10-03T01:00:00Z',
      },
    ];

    const mockPipelineRunResponse = {
      pageToken: 'nextPageToken',
      results: pipelineRuns,
      totalResults: 1,
    };

    asMockedFn(Teaspoons).mockReturnValue(
      partial<TeaspoonsContract>({
        getAllPipelineRuns: jest.fn().mockReturnValue(mockPipelineRunResponse),
      })
    );

    render(<JobHistory />);

    expect(await screen.findByText('array_imputation')).toBeInTheDocument();
    expect(screen.queryByText(/array_imputation v/)).not.toBeInTheDocument();
  });

  it('shows View Outputs button for SUCCEEDED jobs', async () => {
    const pipelineRun = mockPipelineRun('SUCCEEDED');
    const pipelineRuns = [pipelineRun];

    const mockPipelineRunResponse = {
      pageToken: null,
      results: pipelineRuns,
      totalResults: 1,
    };

    asMockedFn(Teaspoons).mockReturnValue(
      partial<TeaspoonsContract>({
        getAllPipelineRuns: jest.fn().mockReturnValue(mockPipelineRunResponse),
      })
    );

    render(<JobHistory />);

    await waitFor(() => {
      expect(screen.getAllByText(pipelineRun.jobId)).toHaveLength(2);
    });

    const viewOutputsButton = screen.getByText('View Outputs');
    expect(viewOutputsButton).toBeInTheDocument();

    expect(screen.queryByText('View Error')).not.toBeInTheDocument();
  });

  it('shows View Error button for FAILED jobs', async () => {
    const pipelineRun = mockPipelineRun('FAILED');
    const pipelineRuns = [pipelineRun];

    const mockPipelineRunResponse = {
      pageToken: null,
      results: pipelineRuns,
      totalResults: 1,
    };

    asMockedFn(Teaspoons).mockReturnValue(
      partial<TeaspoonsContract>({
        getAllPipelineRuns: jest.fn().mockReturnValue(mockPipelineRunResponse),
      })
    );

    render(<JobHistory />);

    await waitFor(() => {
      expect(screen.getAllByText(pipelineRun.jobId)).toHaveLength(2);
    });

    const viewErrorButton = screen.getByText('View Error');
    expect(viewErrorButton).toBeInTheDocument();

    expect(screen.queryByText('View Outputs')).not.toBeInTheDocument();
  });

  it('shows neither button for RUNNING jobs', async () => {
    const pipelineRun = mockPipelineRun('RUNNING');
    const pipelineRuns = [pipelineRun];

    const mockPipelineRunResponse = {
      pageToken: null,
      results: pipelineRuns,
      totalResults: 1,
    };

    asMockedFn(Teaspoons).mockReturnValue(
      partial<TeaspoonsContract>({
        getAllPipelineRuns: jest.fn().mockReturnValue(mockPipelineRunResponse),
      })
    );

    render(<JobHistory />);

    await waitFor(() => {
      expect(screen.getAllByText(pipelineRun.jobId)).toHaveLength(2);
    });

    expect(screen.queryByText('View Outputs')).not.toBeInTheDocument();
    expect(screen.queryByText('View Error')).not.toBeInTheDocument();
    expect(screen.queryAllByText('In Progress', { exact: false })).toHaveLength(2);
  });

  it('opens the outputs modal when View Outputs button is clicked', async () => {
    const pipelineRun = mockPipelineRun('SUCCEEDED');
    const pipelineRuns = [pipelineRun];

    const mockPipelineRunResponse = {
      pageToken: null,
      results: pipelineRuns,
      totalResults: 1,
    };

    const mockPipelineRunResult = {
      pipelineRunReport: {
        outputs: {
          'output1.txt': 'https://example.com/output1.txt',
        },
      },
    };

    asMockedFn(Teaspoons).mockReturnValue(
      partial<TeaspoonsContract>({
        getAllPipelineRuns: jest.fn().mockReturnValue(mockPipelineRunResponse),
        getPipelineRunResult: jest.fn().mockResolvedValue(mockPipelineRunResult),
      })
    );

    render(<JobHistory />);

    await waitFor(() => {
      expect(screen.getAllByText(pipelineRun.jobId)).toHaveLength(2);
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('View Outputs'));

    expect(await screen.findByText('Pipeline Outputs', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('output1.txt')).toBeInTheDocument();
    expect(await screen.findByText('1.21 KiB', { exact: false })).toBeInTheDocument();
  });

  it('opens the error modal when View Error button is clicked', async () => {
    const pipelineRun = mockPipelineRun('FAILED');
    const pipelineRuns = [pipelineRun];

    const mockPipelineRunResponse = {
      pageToken: null,
      results: pipelineRuns,
      totalResults: 1,
    };

    const mockPipelineRunResult = {
      errorReport: {
        message: 'Test error message',
        causes: ['Test error cause'],
      },
    };

    asMockedFn(Teaspoons).mockReturnValue(
      partial<TeaspoonsContract>({
        getAllPipelineRuns: jest.fn().mockReturnValue(mockPipelineRunResponse),
        getPipelineRunResult: jest.fn().mockResolvedValue(mockPipelineRunResult),
      })
    );

    render(<JobHistory />);

    await waitFor(() => {
      expect(screen.getAllByText(pipelineRun.jobId)).toHaveLength(2);
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('View Error'));

    expect(await screen.findByText('Pipeline Error', { exact: false })).toBeInTheDocument();
  });

  describe('Job Status column', () => {
    it(`displays PREPARING if the job was submitted less than ${PREPARING_JOB_CUTOFF_HOURS} hours ago and is in PREPARING status`, async () => {
      const elevenHoursAgo = new Date(Date.now() - 60 * 60 * 1000 * (PREPARING_JOB_CUTOFF_HOURS - 1)).toISOString();
      const pipelineRun = {
        ...mockPipelineRun('PREPARING'),
        timeSubmitted: elevenHoursAgo,
      };
      const pipelineRuns = [pipelineRun];

      const mockPipelineRunResponse = {
        pageToken: null,
        results: pipelineRuns,
        totalResults: 1,
      };

      asMockedFn(Teaspoons).mockReturnValue(
        partial<TeaspoonsContract>({
          getAllPipelineRuns: jest.fn().mockReturnValue(mockPipelineRunResponse),
        })
      );

      render(<JobHistory />);

      await waitFor(() => {
        expect(screen.getAllByText(pipelineRun.jobId)).toHaveLength(2);
      });

      expect(screen.getByText('Preparing')).toBeInTheDocument();
      expect(screen.queryByText('View Error')).not.toBeInTheDocument();

      expect(
        screen.queryByText(
          'This job is either still uploading data or has failed before submission. Jobs stuck in Preparing for more than 12 hours will be marked as failed.'
        )
      ).toBeInTheDocument();
    });

    it(`displays FAILED if the job was submitted more than ${PREPARING_JOB_CUTOFF_HOURS} hours ago and is in PREPARING status`, async () => {
      const thirteenHoursAgo = new Date(Date.now() - 60 * 60 * 1000 * (PREPARING_JOB_CUTOFF_HOURS + 1)).toISOString();
      const pipelineRun = {
        ...mockPipelineRun('PREPARING'),
        timeSubmitted: thirteenHoursAgo,
      };
      const pipelineRuns = [pipelineRun];

      const mockPipelineRunResponse = {
        pageToken: null,
        results: pipelineRuns,
        totalResults: 1,
      };

      asMockedFn(Teaspoons).mockReturnValue(
        partial<TeaspoonsContract>({
          getAllPipelineRuns: jest.fn().mockReturnValue(mockPipelineRunResponse),
        })
      );

      render(<JobHistory />);

      await waitFor(() => {
        expect(screen.getAllByText(pipelineRun.jobId)).toHaveLength(2);
      });

      expect(screen.getByText('Failed')).toBeInTheDocument();
      expect(screen.getByText('View Error')).toBeInTheDocument();
    });
  });

  describe('Quota Used column', () => {
    it("displays '0 samples' when quotaUsed is undefined", async () => {
      const pipelineRun = mockPipelineRun('FAILED');
      const pipelineRuns = [pipelineRun];

      const mockPipelineRunResponse = {
        pageToken: null,
        results: pipelineRuns,
        totalResults: 1,
      };

      asMockedFn(Teaspoons).mockReturnValue(
        partial<TeaspoonsContract>({
          getAllPipelineRuns: jest.fn().mockReturnValue(mockPipelineRunResponse),
        })
      );

      render(<JobHistory />);

      await waitFor(() => {
        expect(screen.getAllByText(pipelineRun.jobId)).toHaveLength(2);
      });

      expect(screen.getByText('0 samples')).toBeInTheDocument();
    });

    it('displays an informational tooltip for in progress jobs', async () => {
      const pipelineRun = {
        ...mockPipelineRun('RUNNING'),
        quotaConsumed: 500,
      };
      const pipelineRuns = [pipelineRun];
      const mockPipelineRunResponse = {
        pageToken: null,
        results: pipelineRuns,
        totalResults: 1,
      };

      asMockedFn(Teaspoons).mockReturnValue(
        partial<TeaspoonsContract>({
          getAllPipelineRuns: jest.fn().mockReturnValue(mockPipelineRunResponse),
        })
      );

      render(<JobHistory />);

      await waitFor(() => {
        expect(screen.getAllByText(pipelineRun.jobId)).toHaveLength(2);
      });

      expect(screen.getByText('500 samples')).toBeInTheDocument();
      expect(
        screen.getByText(
          'This job is still in progress. The amount of quota consumed may change as the job progresses. If the job fails, no quota will be consumed.'
        )
      ).toBeInTheDocument();
    });
  });

  describe('Deletion Date column', () => {
    it('displays the deletion date for SUCCEEDED jobs', async () => {
      const pipelineRun = mockPipelineRun('SUCCEEDED');
      const pipelineRuns = [pipelineRun];

      const mockPipelineRunResponse = {
        pageToken: null,
        results: pipelineRuns,
        totalResults: 1,
      };

      asMockedFn(Teaspoons).mockReturnValue(
        partial<TeaspoonsContract>({
          getAllPipelineRuns: jest.fn().mockReturnValue(mockPipelineRunResponse),
        })
      );

      render(<JobHistory />);

      await waitFor(() => {
        expect(screen.getAllByText(pipelineRun.jobId)).toHaveLength(2);
      });

      expect(screen.getByText('Oct 15, 2023')).toBeInTheDocument();
    });
  });
});
