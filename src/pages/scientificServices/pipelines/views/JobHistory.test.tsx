import { screen } from '@testing-library/react';
import React from 'react';
import { Teaspoons, TeaspoonsContract } from 'src/libs/ajax/teaspoons/Teaspoons';
import { PipelineRun } from 'src/libs/ajax/teaspoons/teaspoons-models';
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
    const pipelineRuns: PipelineRun[] = [
      {
        description: 'Test Job',
        status: 'RUNNING',
        pipelineVersion: 1,
        pipelineName: 'array_imputation',
        jobId: 'test-job-123',
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
    expect(screen.getByText('array_imputation v1')).toBeInTheDocument();
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
});
