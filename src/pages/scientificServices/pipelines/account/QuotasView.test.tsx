import { screen } from '@testing-library/react';
import React from 'react';
import * as Nav from 'src/libs/nav';
import { QuotasView } from 'src/pages/scientificServices/pipelines/account/QuotasView';
import { renderWithAppContexts } from 'src/testing/test-utils';

jest.mock('src/pages/scientificServices/pipelines/hooks/usePipelinesList', () => ({
  usePipelinesList: jest.fn(() => ({
    pipelines: [],
    uniquePipelines: [],
    isLoading: false,
    error: undefined,
  })),
}));

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  useRoute: jest.fn(() => ({
    name: 'quotas',
    params: {},
    query: {},
  })),
  getLink: jest.fn(() => '/'),
}));

const mockPipeline = {
  pipelineName: 'test-pipeline',
  displayName: 'Test Pipeline',
  pipelineVersion: '1.0',
  currentQuotaAmount: 100,
  currentQuotaUsed: 50,
};

describe('QuotasView', () => {
  it('renders the page with appropriate sections', () => {
    renderWithAppContexts(<QuotasView />);

    expect(screen.getByText('Pipeline Quotas')).toBeInTheDocument();
  });

  it('renders PurchaseQuotaDisplay when pipeline is in query', () => {
    const { usePipelinesList } = jest.requireMock('src/pages/scientificServices/pipelines/hooks/usePipelinesList');

    usePipelinesList.mockReturnValue({
      pipelines: [mockPipeline],
      uniquePipelines: [mockPipeline],
      isLoading: false,
      error: undefined,
    });

    (Nav.useRoute as jest.Mock).mockReturnValue({
      name: 'quotas',
      params: {},
      query: { pipeline: 'test-pipeline' },
    });

    renderWithAppContexts(<QuotasView />);

    expect(screen.queryByText('Pipeline Quotas')).not.toBeInTheDocument();
    expect(screen.getByText('How would you like to purchase quota?')).toBeInTheDocument();
  });
});
