import { screen } from '@testing-library/react';
import React from 'react';
import { QuotasView } from 'src/pages/scientificServices/pipelines/account/QuotasView';
import { renderWithAppContexts } from 'src/testing/test-utils';

// Mock page navigation functions
jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getPath: jest.fn(() => '/test/'),
  getLink: jest.fn(() => '/'),
}));

jest.mock('src/pages/scientificServices/pipelines/hooks/usePipelinesList', () => ({
  usePipelinesList: jest.fn(() => ({
    pipelines: [],
    uniquePipelines: [],
    isLoading: false,
    error: undefined,
  })),
}));

describe('QuotasView', () => {
  it('renders the page with appropriate sections', () => {
    renderWithAppContexts(<QuotasView />);

    expect(screen.getByText('Pipeline Quotas')).toBeInTheDocument();
  });
});
