import { screen } from '@testing-library/react';
import React from 'react';
import { PipelineQuotaDisplay } from 'src/pages/scientificServices/pipelines/account/sections/PipelineQuotaDisplay';
import * as usePipelinesListModule from 'src/pages/scientificServices/pipelines/hooks/usePipelinesList';
import * as useUserQuotaModule from 'src/pages/scientificServices/pipelines/hooks/useUserQuota';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

const mockUsePipelinesList = jest.spyOn(usePipelinesListModule, 'usePipelinesList');
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

beforeEach(() => {
  mockUsePipelinesList.mockReturnValue({
    pipelines: [mockPipeline],
    uniquePipelines: [mockPipeline],
    isLoading: false,
    error: undefined,
  } as any);

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

describe('PipelineQuotaDisplay', () => {
  describe('loading state', () => {
    it('shows loading text while pipelines are loading', () => {
      mockUsePipelinesList.mockReturnValue({
        pipelines: [],
        uniquePipelines: [],
        isLoading: true,
        error: undefined,
      } as any);

      render(<PipelineQuotaDisplay />);

      expect(screen.getByText('Loading pipelines...')).toBeInTheDocument();
    });

    it('shows loading spinner and "Loading..." in quota metrics while quota is loading', () => {
      mockUseUserQuota.mockReturnValue({
        quota: undefined,
        pipelineDetails: undefined,
        meetsMinimumQuota: undefined,
        isLoading: true,
      } as any);

      render(<PipelineQuotaDisplay />);

      expect(screen.getAllByText('Loading...')).toHaveLength(3);
    });
  });

  describe('empty state', () => {
    it('shows a message when there are no pipelines', () => {
      mockUsePipelinesList.mockReturnValue({
        pipelines: [],
        uniquePipelines: [],
        isLoading: false,
        error: undefined,
      } as any);

      render(<PipelineQuotaDisplay />);

      expect(screen.getByText(/No pipelines are available for your account/)).toBeInTheDocument();
    });
  });

  describe('quota card', () => {
    it('renders the pipeline display name', () => {
      render(<PipelineQuotaDisplay />);

      expect(screen.getByText('Array Imputation')).toBeInTheDocument();
    });

    it('renders quota metrics', () => {
      render(<PipelineQuotaDisplay />);

      expect(screen.getByText('Quota Remaining')).toBeInTheDocument();
      expect(screen.getByText('Quota Consumed')).toBeInTheDocument();
      expect(screen.getByText('Minimum Required')).toBeInTheDocument();
    });

    it('renders correct quota values', () => {
      render(<PipelineQuotaDisplay />);

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

      render(<PipelineQuotaDisplay />);

      expect(screen.getByText('No minimum')).toBeInTheDocument();
    });

    it('renders a "Request Quota Increase" button', () => {
      render(<PipelineQuotaDisplay />);

      expect(screen.getByRole('button', { name: 'Request Quota Increase' })).toBeInTheDocument();
    });

    it('renders one card per unique pipeline', () => {
      const mockPipeline2 = { ...mockPipeline, pipelineName: 'sv_imputation', displayName: 'SV Imputation' };
      mockUsePipelinesList.mockReturnValue({
        pipelines: [mockPipeline, mockPipeline2],
        uniquePipelines: [mockPipeline, mockPipeline2],
        isLoading: false,
        error: undefined,
      } as any);

      render(<PipelineQuotaDisplay />);

      expect(screen.getByText('Array Imputation')).toBeInTheDocument();
      expect(screen.getByText('SV Imputation')).toBeInTheDocument();
    });
  });

  describe('no quota state', () => {
    it('shows an error card when quota is unavailable', () => {
      mockUseUserQuota.mockReturnValue({
        quota: undefined,
        pipelineDetails: undefined,
        meetsMinimumQuota: undefined,
        isLoading: false,
      } as any);

      render(<PipelineQuotaDisplay />);

      expect(screen.getByText(/No quota information available/)).toBeInTheDocument();
    });
  });
});
