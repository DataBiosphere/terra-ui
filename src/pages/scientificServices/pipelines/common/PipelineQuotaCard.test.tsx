import { screen } from '@testing-library/react';
import React from 'react';
import { PipelineQuotaCard } from 'src/pages/scientificServices/pipelines/common/PipelineQuotaCard';
import * as useUserQuotaModule from 'src/pages/scientificServices/pipelines/hooks/useUserQuota';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

const mockUseUserQuota = jest.spyOn(useUserQuotaModule, 'useUserQuota');

const mockPipeline = {
  pipelineName: 'array_imputation',
  displayName: 'Array Imputation',
  pipelineVersion: 1,
  description: 'Test pipeline',
};

const mockQuota = {
  quotaConsumed: 100,
  quotaLimit: 1000,
  quotaUnits: 'samples',
};

const mockPipelineDetails = {
  pipelineQuota: {
    minQuotaConsumed: 500,
  },
};

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getPath: jest.fn(() => '/test/'),
  getLink: jest.fn(() => '/'),
  useRoute: jest.fn().mockImplementation(() => ({ params: {}, query: {} })),
  updateSearch: jest.fn(),
}));

beforeEach(() => {
  mockUseUserQuota.mockReturnValue({
    quota: mockQuota,
    pipelineDetails: mockPipelineDetails,
    meetsMinimumQuota: true,
    isLoading: false,
  } as any);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('PipelineQuotaCard', () => {
  it('renders the pipeline display name', () => {
    render(<PipelineQuotaCard pipeline={mockPipeline} />);

    expect(screen.getByText('Array Imputation')).toBeInTheDocument();
  });

  it('renders quota metrics', () => {
    render(<PipelineQuotaCard pipeline={mockPipeline} />);

    expect(screen.getByText('Quota Remaining')).toBeInTheDocument();
    expect(screen.getByText('Quota Consumed')).toBeInTheDocument();
    expect(screen.getByText('Minimum Required')).toBeInTheDocument();
  });

  it('renders correct quota values', () => {
    render(<PipelineQuotaCard pipeline={mockPipeline} />);

    expect(screen.getByText('900 samples')).toBeInTheDocument();
    expect(screen.getByText('100 samples')).toBeInTheDocument();
    expect(screen.getByText('500 samples')).toBeInTheDocument();
  });

  it('shows "No minimum" when no minimum quota is defined', () => {
    mockUseUserQuota.mockReturnValue({
      quota: mockQuota,
      pipelineDetails: { pipelineQuota: { minQuotaConsumed: undefined } },
      meetsMinimumQuota: true,
      isLoading: false,
    } as any);

    render(<PipelineQuotaCard pipeline={mockPipeline} />);

    expect(screen.getByText('No minimum')).toBeInTheDocument();
  });

  it('renders a "Purchase Quota" button by default', () => {
    render(<PipelineQuotaCard pipeline={mockPipeline} />);

    expect(screen.getByRole('button', { name: 'Purchase Quota' })).toBeInTheDocument();
  });

  it('does not render "Purchase Quota" button when showPurchaseButton is false', () => {
    render(<PipelineQuotaCard pipeline={mockPipeline} showPurchaseButton={false} />);

    expect(screen.queryByRole('button', { name: 'Purchase Quota' })).not.toBeInTheDocument();
  });
});
