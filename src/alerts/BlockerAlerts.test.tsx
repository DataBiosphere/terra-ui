import { useThemeFromContext } from '@terra-ui-packages/components';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { BlockerAlerts } from './BlockerAlerts';
import * as AlertsModule from './service-alerts';

jest.mock('src/alerts/service-alerts');
jest.mock('@terra-ui-packages/components', () => ({
  ...jest.requireActual('@terra-ui-packages/components'),
  useThemeFromContext: jest.fn(),
  icon: () => <span data-testid='icon'>[Icon]</span>,
}));

describe('BlockerAlerts', () => {
  const mockTheme = {
    colors: {
      danger: (opacity?: number) => (opacity ? `rgba(255, 0, 0, ${opacity})` : 'red'),
      dark: () => 'black',
    },
  };

  beforeEach(() => {
    (useThemeFromContext as jest.Mock).mockReturnValue(mockTheme);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when there are no alerts', () => {
    (AlertsModule.useServiceAlerts as jest.Mock).mockReturnValue([]);

    const { container } = render(<BlockerAlerts />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders only alerts with severity "error"', () => {
    const alerts = [
      { id: '1', severity: 'info', title: 'Info Alert', message: 'This is informational' },
      { id: '2', severity: 'error', title: 'Error Alert', message: 'Something went wrong' },
    ];
    (AlertsModule.useServiceAlerts as jest.Mock).mockReturnValue(alerts);

    render(<BlockerAlerts />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Error Alert: Something went wrong/)).toBeInTheDocument();
    expect(screen.queryByText(/Info Alert/)).not.toBeInTheDocument();
  });

  it('renders multiple error alerts if available', () => {
    const alerts = [
      { id: 'a', severity: 'error', title: 'Network', message: 'No connection' },
      { id: 'b', severity: 'error', title: 'Database', message: 'Timeout' },
    ];
    (AlertsModule.useServiceAlerts as jest.Mock).mockReturnValue(alerts);

    render(<BlockerAlerts />);

    expect(screen.getByText(/Network: No connection/)).toBeInTheDocument();
    expect(screen.getByText(/Database: Timeout/)).toBeInTheDocument();
  });

  it('applies appropriate styles and icon', () => {
    const alerts = [{ id: 'x', severity: 'error', title: 'Crash', message: 'Critical failure' }];
    (AlertsModule.useServiceAlerts as jest.Mock).mockReturnValue(alerts);

    const { getByRole, getByTestId } = render(<BlockerAlerts />);
    const alertDiv = getByRole('alert');

    expect(alertDiv).toHaveStyle('border: 2px solid red');
    expect(alertDiv).toHaveStyle('background-color: rgba(255, 0, 0, 0.15)');
    expect(alertDiv).toHaveTextContent('Crash: Critical failure');
    expect(getByTestId('icon')).toBeInTheDocument();
  });
});
