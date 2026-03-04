import { screen } from '@testing-library/react';
import React from 'react';
import * as stateModule from 'src/libs/state';
import { ProxyGroupDisplay } from 'src/pages/scientificServices/pipelines/account/sections/ProxyGroupDisplay';
import * as useProxyGroupModule from 'src/profile/personal-info/useProxyGroup';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

const mockGetTerraUser = jest.spyOn(stateModule, 'getTerraUser');
const mockUseProxyGroup = jest.spyOn(useProxyGroupModule, 'useProxyGroup');

beforeEach(() => {
  mockGetTerraUser.mockReturnValue({ email: 'user@example.com' } as any);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('ProxyGroupDisplay', () => {
  it('shows a spinner while the proxy group is loading', () => {
    mockUseProxyGroup.mockReturnValue({ proxyGroup: { status: 'Loading', state: null } });

    render(<ProxyGroupDisplay />);

    expect(screen.getByText('Loading proxy group...')).toBeInTheDocument();
  });

  it('shows the proxy group email when ready', () => {
    mockUseProxyGroup.mockReturnValue({
      proxyGroup: { status: 'Ready', state: 'PROXY_1234567890@example.com' },
    });

    render(<ProxyGroupDisplay />);

    expect(screen.getByText('PROXY_1234567890@example.com')).toBeInTheDocument();
  });

  it('shows an error message when the proxy group fails to load', () => {
    mockUseProxyGroup.mockReturnValue({ proxyGroup: { status: 'Error', state: null, error: new Error('Failed') } });

    render(<ProxyGroupDisplay />);

    expect(screen.getByText(/Error loading proxy group information/)).toBeInTheDocument();
  });

  it('calls useProxyGroup with the current user email', () => {
    mockUseProxyGroup.mockReturnValue({ proxyGroup: { status: 'Loading', state: null } });

    render(<ProxyGroupDisplay />);

    expect(mockUseProxyGroup).toHaveBeenCalledWith('user@example.com');
  });

  it('renders the user guide link', () => {
    mockUseProxyGroup.mockReturnValue({ proxyGroup: { status: 'Loading', state: null } });

    render(<ProxyGroupDisplay />);

    expect(screen.getByText('cloud data user guide')).toBeInTheDocument();
  });
});
