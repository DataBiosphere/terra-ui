import { screen } from '@testing-library/react';
import React from 'react';
import { getLocalStorage, setStatic } from 'src/libs/browser-storage';
import * as Nav from 'src/libs/nav';
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
}));

jest.mock('src/libs/browser-storage', () => ({
  ...jest.requireActual('src/libs/browser-storage'),
  setStatic: jest.fn(),
  getLocalStorage: jest.fn(() => ({})),
}));

jest.mock('src/pages/scientificServices/pipelines/hooks/usePipelinesList');
const mockUsePipelinesList = asMockedFn(usePipelinesList);
const mockSetStatic = asMockedFn(setStatic);
const mockGetLocalStorage = asMockedFn(getLocalStorage);
const mockUseRoute = asMockedFn(Nav.useRoute);
const mockUpdateSearch = asMockedFn(Nav.updateSearch);

describe('PipelinesLayout', () => {
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
      mockSetStatic.mockClear();
      mockGetLocalStorage.mockClear();
      mockUpdateSearch.mockClear();
      mockGetLocalStorage.mockReturnValue({} as Storage);
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

      expect(mockGetLocalStorage).toHaveBeenCalled();
      expect(mockSetStatic).toHaveBeenCalledWith({}, 'inProgressPurchase', {
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

      expect(mockSetStatic).toHaveBeenCalledWith({}, 'inProgressPurchase', {
        nonProfitActivities: false,
        nonProfitOrganization: false,
        numSamples: 50,
        pipeline: 'low_pass_imputation',
      });
      expect(mockUpdateSearch).toHaveBeenCalledWith({});
    });

    it('handles partial query params', () => {
      mockUseRoute.mockReturnValue({
        params: {},
        query: {
          pipeline: 'array_imputation',
          numSamples: '25',
        },
      });

      renderWithAppContexts(<PipelinesLayout />);

      expect(mockSetStatic).toHaveBeenCalledWith({}, 'inProgressPurchase', {
        nonProfitActivities: false,
        nonProfitOrganization: false,
        numSamples: 25,
        pipeline: 'array_imputation',
      });
      expect(mockUpdateSearch).toHaveBeenCalledWith({});
    });

    it('handles invalid numSamples by defaulting to 0', () => {
      mockUseRoute.mockReturnValue({
        params: {},
        query: {
          numSamples: 'invalid',
          pipeline: 'test_pipeline',
        },
      });

      renderWithAppContexts(<PipelinesLayout />);

      expect(mockSetStatic).toHaveBeenCalledWith({}, 'inProgressPurchase', {
        nonProfitActivities: false,
        nonProfitOrganization: false,
        numSamples: 0,
        pipeline: 'test_pipeline',
      });
      expect(mockUpdateSearch).toHaveBeenCalledWith({});
    });

    it('does not store in localStorage when no relevant query params exist', () => {
      mockUseRoute.mockReturnValue({
        params: {},
        query: {},
      });

      renderWithAppContexts(<PipelinesLayout />);

      expect(mockSetStatic).not.toHaveBeenCalled();
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

      expect(mockSetStatic).not.toHaveBeenCalled();
      expect(mockUpdateSearch).not.toHaveBeenCalled();
    });

    it('preserves other query params when clearing purchase params', () => {
      mockUseRoute.mockReturnValue({
        params: {},
        query: {
          nonProfitActivities: 'true',
          pipeline: 'array_imputation',
          someOtherParam: 'value',
          anotherParam: 'data',
        },
      });

      renderWithAppContexts(<PipelinesLayout />);

      expect(mockSetStatic).toHaveBeenCalledWith({}, 'inProgressPurchase', {
        nonProfitActivities: true,
        nonProfitOrganization: false,
        numSamples: 0,
        pipeline: 'array_imputation',
      });
      expect(mockUpdateSearch).toHaveBeenCalledWith({
        someOtherParam: 'value',
        anotherParam: 'data',
      });
    });
  });
});
