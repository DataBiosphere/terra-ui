import { expect } from '@storybook/test';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import {
  mockPipeline,
  mockPipelineWithDetails,
  mockUserPipelineQuotaDetails,
} from 'src/pages/scientificServices/pipelines/utils/mock-utils';
import { renderWithAppContexts } from 'src/testing/test-utils';

import { QuotaDetailsWidget } from './QuotaDetailsWidget';

jest.mock('src/libs/ajax/teaspoons/Teaspoons', () => ({
  Teaspoons: () => ({
    getQuotaForPipeline: jest.fn().mockResolvedValue(mockUserPipelineQuotaDetails('test_pipeline')),
    getPipelineDetails: jest.fn().mockResolvedValue(mockPipelineWithDetails('test_pipeline')),
  }),
}));

describe('QuotaDetailsWidget', () => {
  it('displays the correct remaining and used quota', async () => {
    renderWithAppContexts(<QuotaDetailsWidget selectedPipeline={mockPipeline('test_pipeline')} />);

    await waitFor(() => expect(screen.getByText('1250', { exact: false })).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('750', { exact: false })).toBeInTheDocument());
  });

  it('displays the minimum quota consumed for the pipeline', async () => {
    renderWithAppContexts(<QuotaDetailsWidget selectedPipeline={mockPipeline('test_pipeline')} />);

    await waitFor(() => expect(screen.getByText(/every submitted job will consume at least/i)).toBeInTheDocument());

    await expect(
      screen.getByText('Every submitted job will consume at least 175 things from your quota.', { exact: false })
    ).toBeInTheDocument();
  });

  it('displays the maximum allowed quota for the pipeline', async () => {
    renderWithAppContexts(<QuotaDetailsWidget selectedPipeline={mockPipeline('test_pipeline')} />);

    await waitFor(() =>
      expect(screen.getByText('There is a maximum of 5250 things allowed per job.')).toBeInTheDocument()
    );
  });

  it('displays a message when no pipeline is selected', () => {
    render(<QuotaDetailsWidget selectedPipeline={undefined} />);

    expect(screen.getByText('Select a pipeline to see quota')).toBeInTheDocument();
  });
});
