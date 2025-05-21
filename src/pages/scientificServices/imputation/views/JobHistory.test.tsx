import { screen } from '@testing-library/react';
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
    expect(screen.getByText('Running')).toBeInTheDocument();
  });
});
