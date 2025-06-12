import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Teaspoons, TeaspoonsContract } from 'src/libs/ajax/teaspoons/Teaspoons';
import { mockPipelineRun } from 'src/pages/scientificServices/pipelines/utils/mock-utils';
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
    expect(screen.getByText('In Progress')).toBeInTheDocument();
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
    expect(screen.getByText('In Progress')).toBeInTheDocument();
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
});
