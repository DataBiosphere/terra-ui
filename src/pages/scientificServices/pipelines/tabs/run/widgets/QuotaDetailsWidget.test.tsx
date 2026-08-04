import { expect } from '@storybook/test';
import { render, screen } from '@testing-library/react';
import React from 'react';
import {
  mockPipeline,
  mockPipelineWithDetails,
  mockUserPipelineQuotaDetails,
} from 'src/pages/scientificServices/pipelines/utils/mock-utils';
import { renderWithAppContexts } from 'src/testing/test-utils';

import { QuotaDetailsWidget } from './QuotaDetailsWidget';

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn(() => '/pipelines/quotas'),
}));

const mockQuota = mockUserPipelineQuotaDetails('test_pipeline');
const mockPipelineDetails = mockPipelineWithDetails('test_pipeline');

describe('QuotaDetailsWidget', () => {
  it('displays the correct remaining and used quota', () => {
    renderWithAppContexts(
      <QuotaDetailsWidget
        selectedPipeline={mockPipeline('test_pipeline')}
        quota={mockQuota}
        pipelineDetails={mockPipelineDetails}
        meetsMinimumQuota
        isLoading={false}
      />
    );

    expect(screen.getByText('1,250', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('750', { exact: false })).toBeInTheDocument();
  });

  it('displays the minimum quota consumed for the pipeline', () => {
    renderWithAppContexts(
      <QuotaDetailsWidget
        selectedPipeline={mockPipeline('test_pipeline')}
        quota={mockQuota}
        pipelineDetails={mockPipelineDetails}
        meetsMinimumQuota
        isLoading={false}
      />
    );

    expect(screen.getByText(/every submitted job will consume at least/i)).toBeInTheDocument();
    expect(
      screen.getByText('Every submitted job will consume at least 175 things from your quota.', { exact: false })
    ).toBeInTheDocument();
  });

  it('displays the maximum allowed quota for the pipeline', () => {
    renderWithAppContexts(
      <QuotaDetailsWidget
        selectedPipeline={mockPipeline('test_pipeline')}
        quota={mockQuota}
        pipelineDetails={mockPipelineDetails}
        meetsMinimumQuota
        isLoading={false}
      />
    );

    expect(screen.getByText('There is a maximum of 5,250 things allowed per job.')).toBeInTheDocument();
  });

  it('displays a message when no pipeline is selected', () => {
    render(
      <QuotaDetailsWidget
        selectedPipeline={undefined}
        quota={undefined}
        pipelineDetails={undefined}
        meetsMinimumQuota={undefined}
        isLoading={false}
      />
    );

    expect(screen.getByText('Select a pipeline to see quota')).toBeInTheDocument();
  });

  it('displays "Purchase quota" link with correct href', () => {
    renderWithAppContexts(
      <QuotaDetailsWidget
        selectedPipeline={mockPipeline('test_pipeline')}
        quota={mockQuota}
        pipelineDetails={mockPipelineDetails}
        meetsMinimumQuota
        isLoading={false}
      />
    );

    const purchaseLink = screen.getByText('Purchase');
    expect(purchaseLink).toBeInTheDocument();
    expect(purchaseLink).toHaveAttribute('href', '/pipelines/quotas');
  });
});
