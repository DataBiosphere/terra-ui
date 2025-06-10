import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Teaspoons, TeaspoonsContract } from 'src/libs/ajax/teaspoons/Teaspoons';
import { asMockedFn, partial, renderWithAppContexts as render } from 'src/testing/test-utils';

import { JobHistory } from './JobHistory';

jest.mock('src/libs/ajax/teaspoons/Teaspoons');

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

describe('job history table', () => {
  it('renders the job history table', async () => {
    const pipelineRuns = [
      {
        id: '123',
        description: 'Test Job',
        status: 'RUNNING',
        createdAt: '2023-10-01T00:00:00Z',
        updatedAt: '2023-10-01T00:00:00Z',
        pipelineVersion: 'v1.0.0',
        pipelineName: 'array_imputation',
        jobId: 'job-123',
        timeSubmitted: '2023-10-01T00:00:00Z',
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

    expect(await screen.findByText('Job History')).toBeInTheDocument();
    expect(screen.queryAllByText('Test Job')).toHaveLength(2);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('shows View Outputs button for SUCCEEDED jobs', async () => {
    const pipelineRuns = [
      {
        id: '123',
        jobId: 'job-123',
        description: 'Successful Job',
        status: 'SUCCEEDED',
        timeSubmitted: '2023-10-01T00:00:00Z',
        timeCompleted: '2023-10-01T01:00:00Z',
        pipelineVersion: 'v1.0.0',
        pipelineName: 'array_imputation',
        createdAt: '2023-10-01T00:00:00Z',
        updatedAt: '2023-10-01T01:00:00Z',
      },
    ];

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

    // Wait for the table to render with job data
    await waitFor(() => {
      expect(screen.getAllByText('job-123')).toHaveLength(2);
    });

    // Verify the "View Outputs" button is present
    const viewOutputsButton = screen.getByText('View Outputs');
    expect(viewOutputsButton).toBeInTheDocument();

    // Verify the "View Error" button is not present
    expect(screen.queryByText('View Error')).not.toBeInTheDocument();
  });

  it('shows View Error button for FAILED jobs', async () => {
    const pipelineRuns = [
      {
        id: '456',
        jobId: 'job-456',
        description: 'Failed Job',
        status: 'FAILED',
        timeSubmitted: '2023-10-01T00:00:00Z',
        timeCompleted: '2023-10-01T01:00:00Z',
        pipelineVersion: 'v1.0.0',
        pipelineName: 'array_imputation',
        createdAt: '2023-10-01T00:00:00Z',
        updatedAt: '2023-10-01T01:00:00Z',
      },
    ];

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

    // Wait for the table to render with job data
    await waitFor(() => {
      expect(screen.getAllByText('job-456')).toHaveLength(2);
    });

    // Verify the "View Error" button is present
    const viewErrorButton = screen.getByText('View Error');
    expect(viewErrorButton).toBeInTheDocument();

    // Verify the "View Outputs" button is not present
    expect(screen.queryByText('View Outputs')).not.toBeInTheDocument();
  });

  it('shows neither button for RUNNING jobs', async () => {
    const pipelineRuns = [
      {
        id: '789',
        jobId: 'job-789',
        description: 'Running Job',
        status: 'RUNNING',
        timeSubmitted: '2023-10-01T00:00:00Z',
        pipelineVersion: 'v1.0.0',
        pipelineName: 'array_imputation',
        createdAt: '2023-10-01T00:00:00Z',
        updatedAt: '2023-10-01T00:30:00Z',
      },
    ];

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

    // Wait for the table to render with job data
    await waitFor(() => {
      expect(screen.getAllByText('job-789')).toHaveLength(2);
    });

    // Verify neither button is present
    expect(screen.queryByText('View Outputs')).not.toBeInTheDocument();
    expect(screen.queryByText('View Error')).not.toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('opens the outputs modal when View Outputs button is clicked', async () => {
    const pipelineRuns = [
      {
        id: '123',
        jobId: 'job-123',
        description: 'Successful Job',
        status: 'SUCCEEDED',
        timeSubmitted: '2023-10-01T00:00:00Z',
        timeCompleted: '2023-10-01T01:00:00Z',
        pipelineVersion: 'v1.0.0',
        pipelineName: 'array_imputation',
        createdAt: '2023-10-01T00:00:00Z',
        updatedAt: '2023-10-01T01:00:00Z',
      },
    ];

    const mockPipelineRunResponse = {
      pageToken: null,
      results: pipelineRuns,
      totalResults: 1,
    };

    // Mock the pipeline run results that will be requested by the modal
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

    // Wait for the table to render
    await waitFor(() => {
      expect(screen.getAllByText('job-123')).toHaveLength(2);
    });

    // Click the "View Outputs" button
    const user = userEvent.setup();
    await user.click(screen.getByText('View Outputs'));

    // Verify the modal is opened
    expect(await screen.findByText('Pipeline Outputs - job-123')).toBeInTheDocument();
  });

  it('opens the error modal when View Error button is clicked', async () => {
    const pipelineRuns = [
      {
        id: '456',
        jobId: 'job-456',
        description: 'Failed Job',
        status: 'FAILED',
        timeSubmitted: '2023-10-01T00:00:00Z',
        timeCompleted: '2023-10-01T01:00:00Z',
        pipelineVersion: 'v1.0.0',
        pipelineName: 'array_imputation',
        createdAt: '2023-10-01T00:00:00Z',
        updatedAt: '2023-10-01T01:00:00Z',
      },
    ];

    const mockPipelineRunResponse = {
      pageToken: null,
      results: pipelineRuns,
      totalResults: 1,
    };

    // Mock the pipeline run results that will be requested by the modal
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

    // Wait for the table to render
    await waitFor(() => {
      expect(screen.getAllByText('job-456')).toHaveLength(2);
    });

    // Click the "View Error" button
    const user = userEvent.setup();
    await user.click(screen.getByText('View Error'));

    // Verify the modal is opened
    expect(await screen.findByText('Pipeline Error - job-456')).toBeInTheDocument();
  });
});
