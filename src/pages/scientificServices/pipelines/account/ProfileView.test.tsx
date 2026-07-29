import { screen } from '@testing-library/react';
import React from 'react';
import { ProfileView } from 'src/pages/scientificServices/pipelines/account/ProfileView';
import { renderWithAppContexts } from 'src/testing/test-utils';

// Mock page navigation functions
jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn(() => '/'),
  getPath: jest.fn(() => '/test/'),
  useRoute: jest.fn().mockImplementation(() => ({ params: {}, query: {} })),
  goToPath: jest.fn(),
}));

jest.mock('src/libs/state', () => ({
  ...jest.requireActual('src/libs/state'),
  getTerraUser: () => ({
    email: 'test@example.com',
  }),
}));

jest.mock('src/pages/scientificServices/pipelines/hooks/usePipelinesList', () => ({
  usePipelinesList: jest.fn(() => ({
    pipelines: [],
    uniquePipelines: [],
    isLoading: false,
    error: undefined,
  })),
}));

jest.mock('src/profile/personal-info/useProxyGroup', () => ({
  useProxyGroup: () => ({
    proxyGroup: {
      status: 'Ready' as const,
      state: 'PROXY_1234567890@example.com',
    },
  }),
}));

describe('ProfileView', () => {
  it('renders the page with appropriate sections', async () => {
    renderWithAppContexts(<ProfileView />);

    expect(screen.getByText('Account Information')).toBeInTheDocument();
    expect(screen.getByText('Proxy Group')).toBeInTheDocument();
  });
});
