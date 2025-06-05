import { expect } from '@storybook/test';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import {
  mockPipeline,
  mockPipelineWithDetails,
  mockUserPipelineQuotaDetails,
} from 'src/pages/scientificServices/pipelines/utils/mock-utils';

import { QuotaRemainingWidget } from './QuotaRemainingWidget';

jest.mock('src/libs/ajax/teaspoons/Teaspoons', () => ({
  Teaspoons: () => ({
    getQuotaForPipeline: jest.fn().mockResolvedValue(mockUserPipelineQuotaDetails('test_pipeline')),
    getPipelineDetails: jest.fn().mockResolvedValue(mockPipelineWithDetails('test_pipeline')),
  }),
}));

describe('QuotaRemainingWidget', () => {
  it('displays the correct remaining quota', async () => {
    render(<QuotaRemainingWidget selectedPipeline={mockPipeline('test_pipeline')} />);

    await waitFor(() => expect(screen.getByText(/test_pipeline:/i)).toBeInTheDocument());

    await expect(screen.getByText('1250 things', { exact: false })).toBeInTheDocument();
  });

  it('displays the minimum quota consumed for the pipeline', async () => {
    render(<QuotaRemainingWidget selectedPipeline={mockPipeline('test_pipeline')} />);

    await waitFor(() => expect(screen.getByText(/every submitted job will consume at least/i)).toBeInTheDocument());

    await expect(
      screen.getByText('Every submitted job will consume at least 175 things from your quota.', { exact: false })
    ).toBeInTheDocument();
  });

  it('displays a message when no pipeline is selected', () => {
    render(<QuotaRemainingWidget selectedPipeline={undefined} />);

    expect(screen.getByText('Select a pipeline to see quota')).toBeInTheDocument();
  });
});
