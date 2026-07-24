import { screen } from '@testing-library/react';
import React from 'react';
import * as Nav from 'src/libs/nav';
import * as purchaseQuotaUtils from 'src/pages/scientificServices/pipelines/common/purchaseQuotaUtils';
import { usePipelinesList } from 'src/pages/scientificServices/pipelines/hooks/usePipelinesList';
import { mockPipeline } from 'src/pages/scientificServices/pipelines/utils/mock-utils';
import { asMockedFn, renderWithAppContexts } from 'src/testing/test-utils';

import { PipelinesLayout } from './PipelinesLayout';

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn(() => '/'),
  getPath: jest.fn(() => '/test/'),
  useRoute: jest.fn().mockImplementation(() => ({ params: {}, query: {} })),
  updateSearch: jest.fn(),
  goToPath: jest.fn(),
}));

jest.mock('src/pages/scientificServices/pipelines/common/purchaseQuotaUtils', () => ({
  ...jest.requireActual('src/pages/scientificServices/pipelines/common/purchaseQuotaUtils'),
  getInProgressPurchase: jest.fn(),
  storeInProgressPurchase: jest.fn(),
  clearInProgressPurchase: jest.fn(),
}));

jest.mock('src/pages/scientificServices/pipelines/hooks/usePipelinesList');
const mockUsePipelinesList = asMockedFn(usePipelinesList);
const mockUseRoute = asMockedFn(Nav.useRoute);
const mockUpdateSearch = asMockedFn(Nav.updateSearch);
const mockGoToPath = asMockedFn(Nav.goToPath);
const mockStoreInProgressPurchase = asMockedFn(purchaseQuotaUtils.storeInProgressPurchase);
const mockGetInProgressPurchase = asMockedFn(purchaseQuotaUtils.getInProgressPurchase);

describe('PipelinesLayout', () => {
  beforeEach(() => {
    mockGetInProgressPurchase.mockReturnValue(undefined);
  });

  it('does not render content while loading', () => {
    mockUsePipelinesList.mockReturnValue({
      pipelines: [],
      uniquePipelines: [],
      isLoading: true,
      error: undefined,
    });

    renderWithAppContexts(
      <PipelinesLayout>
        <div>Page content</div>
      </PipelinesLayout>
    );

    expect(screen.queryByText('Page content')).not.toBeInTheDocument();
  });

  it('shows ServiceUnavailableView when there is an error', () => {
    mockUsePipelinesList.mockReturnValue({
      pipelines: [],
      uniquePipelines: [],
      isLoading: false,
      error: new Error('Connection failed'),
    });

    renderWithAppContexts(<PipelinesLayout />);

    expect(screen.getByText('Service Unavailable')).toBeInTheDocument();
  });

  it('does not show ServiceUnavailableView when there is no error', () => {
    mockUsePipelinesList.mockReturnValue({
      pipelines: [],
      uniquePipelines: [],
      isLoading: false,
      error: undefined,
    });

    renderWithAppContexts(<PipelinesLayout />);

    expect(screen.queryByText('Service Unavailable')).not.toBeInTheDocument();
  });

  it('renders children when loaded successfully', () => {
    mockUsePipelinesList.mockReturnValue({
      pipelines: [],
      uniquePipelines: [],
      isLoading: false,
      error: undefined,
    });

    renderWithAppContexts(
      <PipelinesLayout>
        <div>Page content</div>
      </PipelinesLayout>
    );

    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('passes pipelines data to the render prop', () => {
    const pipelines = [mockPipeline('array_imputation'), mockPipeline('wgs_imputation')];
    mockUsePipelinesList.mockReturnValue({
      pipelines,
      uniquePipelines: pipelines,
      isLoading: false,
      error: undefined,
    });

    renderWithAppContexts(
      <PipelinesLayout
        render={({ uniquePipelines }) => (
          <ul>
            {uniquePipelines.map((p) => (
              <li key={p.pipelineName}>{p.displayName}</li>
            ))}
          </ul>
        )}
      />
    );

    expect(screen.getByText('array_imputation display name')).toBeInTheDocument();
    expect(screen.getByText('wgs_imputation display name')).toBeInTheDocument();
  });

  it('does not call the render prop while loading', () => {
    mockUsePipelinesList.mockReturnValue({
      pipelines: [],
      uniquePipelines: [],
      isLoading: true,
      error: undefined,
    });

    const renderProp = jest.fn(() => <div>Rendered content</div>);
    renderWithAppContexts(<PipelinesLayout render={renderProp} />);

    expect(renderProp).not.toHaveBeenCalled();
  });

  it('does not call the render prop when there is an error', () => {
    mockUsePipelinesList.mockReturnValue({
      pipelines: [],
      uniquePipelines: [],
      isLoading: false,
      error: new Error('Connection failed'),
    });

    const renderProp = jest.fn(() => <div>Rendered content</div>);
    renderWithAppContexts(<PipelinesLayout render={renderProp} />);

    expect(renderProp).not.toHaveBeenCalled();
  });

  describe('Query params to localStorage', () => {
    beforeEach(() => {
      mockStoreInProgressPurchase.mockClear();
      mockUpdateSearch.mockClear();
      mockUsePipelinesList.mockReturnValue({
        pipelines: [],
        uniquePipelines: [],
        isLoading: false,
        error: undefined,
      });
    });

    it('stores query params in localStorage as inProgressPurchase object and clears them from URL', () => {
      mockUseRoute.mockReturnValue({
        params: {},
        query: {
          nonProfitActivities: 'true',
          nonProfitOrganization: 'true',
          numSamples: '100',
          pipeline: 'array_imputation',
        },
      });

      renderWithAppContexts(<PipelinesLayout />);

      expect(mockStoreInProgressPurchase).toHaveBeenCalledWith({
        nonProfitActivities: true,
        nonProfitOrganization: true,
        numSamples: 100,
        pipeline: 'array_imputation',
      });
      expect(mockUpdateSearch).toHaveBeenCalledWith({});
    });

    it('handles false boolean values correctly', () => {
      mockUseRoute.mockReturnValue({
        params: {},
        query: {
          nonProfitActivities: 'false',
          nonProfitOrganization: 'false',
          numSamples: '50',
          pipeline: 'low_pass_imputation',
        },
      });

      renderWithAppContexts(<PipelinesLayout />);

      expect(mockStoreInProgressPurchase).toHaveBeenCalledWith({
        nonProfitActivities: false,
        nonProfitOrganization: false,
        numSamples: 50,
        pipeline: 'low_pass_imputation',
      });
      expect(mockUpdateSearch).toHaveBeenCalledWith({});
    });

    it('does not store in localStorage when only some purchase query params are present', () => {
      mockUseRoute.mockReturnValue({
        params: {},
        query: {
          pipeline: 'array_imputation',
          numSamples: '25',
        },
      });

      renderWithAppContexts(<PipelinesLayout />);

      expect(mockStoreInProgressPurchase).not.toHaveBeenCalled();
      expect(mockUpdateSearch).not.toHaveBeenCalled();
    });

    it('does not store in localStorage when no relevant query params exist', () => {
      mockUseRoute.mockReturnValue({
        params: {},
        query: {},
      });

      renderWithAppContexts(<PipelinesLayout />);

      expect(mockStoreInProgressPurchase).not.toHaveBeenCalled();
      expect(mockUpdateSearch).not.toHaveBeenCalled();
    });

    it('does not store in localStorage when query params are unrelated', () => {
      mockUseRoute.mockReturnValue({
        params: {},
        query: {
          someOtherParam: 'value',
        },
      });

      renderWithAppContexts(<PipelinesLayout />);

      expect(mockStoreInProgressPurchase).not.toHaveBeenCalled();
      expect(mockUpdateSearch).not.toHaveBeenCalled();
    });

    it('preserves other query params when clearing purchase params', () => {
      mockUseRoute.mockReturnValue({
        params: {},
        query: {
          nonProfitActivities: 'true',
          nonProfitOrganization: 'true',
          numSamples: '25',
          pipeline: 'array_imputation',
          someOtherParam: 'value',
          anotherParam: 'data',
        },
      });

      renderWithAppContexts(<PipelinesLayout />);

      expect(mockStoreInProgressPurchase).toHaveBeenCalledWith({
        nonProfitActivities: true,
        nonProfitOrganization: true,
        numSamples: 25,
        pipeline: 'array_imputation',
      });
      expect(mockUpdateSearch).toHaveBeenCalledWith({
        someOtherParam: 'value',
        anotherParam: 'data',
      });
    });
  });

  describe('Navigating to an in-progress purchase', () => {
    beforeEach(() => {
      mockGoToPath.mockClear();
      mockUsePipelinesList.mockReturnValue({
        pipelines: [],
        uniquePipelines: [],
        isLoading: false,
        error: undefined,
      });
    });

    it('navigates to the quota purchase page when a purchase is in progress for a different pipeline', () => {
      mockGetInProgressPurchase.mockReturnValue({
        nonProfitActivities: true,
        nonProfitOrganization: false,
        numSamples: 10,
        pipeline: 'array_imputation',
      });
      mockUseRoute.mockReturnValue({ params: {}, query: {} });

      renderWithAppContexts(<PipelinesLayout />);

      expect(mockGoToPath).toHaveBeenCalledWith('pipelines-quotas', {}, { pipeline: 'array_imputation' });
    });

    it('does not navigate when already on the in-progress purchase pipeline', () => {
      mockGetInProgressPurchase.mockReturnValue({
        nonProfitActivities: true,
        nonProfitOrganization: false,
        numSamples: 10,
        pipeline: 'array_imputation',
      });
      mockUseRoute.mockReturnValue({ params: {}, query: { pipeline: 'array_imputation' } });

      renderWithAppContexts(<PipelinesLayout />);

      expect(mockGoToPath).not.toHaveBeenCalled();
    });

    it('does not navigate when there is no purchase in progress', () => {
      mockGetInProgressPurchase.mockReturnValue(undefined);
      mockUseRoute.mockReturnValue({ params: {}, query: {} });

      renderWithAppContexts(<PipelinesLayout />);

      expect(mockGoToPath).not.toHaveBeenCalled();
    });
  });
});
