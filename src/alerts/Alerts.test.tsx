import { fireEvent, screen, within } from '@testing-library/react';
import React from 'react';
import * as Utils from 'src/libs/utils';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

import { Alert as AlertType } from './Alert';
import { AlertsIndicator } from './Alerts';
import { useServiceAlerts } from './service-alerts';

type ServiceAlertsExports = typeof import('./service-alerts');
jest.mock('./service-alerts', (): ServiceAlertsExports => {
  const originalModule = jest.requireActual<ServiceAlertsExports>('./service-alerts');
  return {
    ...originalModule,
    useServiceAlerts: jest.fn(),
  };
});

const testAlerts: AlertType[] = [
  {
    id: 'abc',
    title: 'The systems are down!',
    message: 'Something is terribly wrong',
  },
  {
    id: 'def',
    title: 'Scheduled maintenance',
    message: 'Offline tomorrow',
  },
];

describe('Alerts', () => {
  beforeEach(() => {
    // Arrange
    asMockedFn(useServiceAlerts).mockReturnValue(testAlerts);
  });

  it('renders number of alerts', () => {
    // Act
    render(<AlertsIndicator />);

    // Assert
    expect(screen.getByRole('button')).toHaveTextContent(`${testAlerts.length}`);
  });

  it('renders popup with alerts', () => {
    // Act
    render(<AlertsIndicator />);
    fireEvent.click(screen.getByRole('button'));

    // Assert
    const alerts = screen.getAllByTestId('alert');
    expect(alerts.length).toBe(testAlerts.length);

    Utils.toIndexPairs(testAlerts).forEach(([index, testAlert]) => {
      expect(within(alerts[index]).getByText(testAlert.title)).toBeTruthy();
      expect(within(alerts[index]).getByText(testAlert.message as string)).toBeTruthy();
    });
  });

  it('renders alerts for screen readers', () => {
    // Act
    render(<AlertsIndicator />);

    // Assert
    const screenReaderAlerts = screen.getAllByRole('alert');
    expect(screenReaderAlerts.length).toBe(testAlerts.length);

    Utils.toIndexPairs(testAlerts).forEach(([index, testAlert]) => {
      expect(within(screenReaderAlerts[index]).getByText(testAlert.title)).toBeTruthy();
      expect(within(screenReaderAlerts[index]).getByText(testAlert.message as string)).toBeTruthy();

      expect(screenReaderAlerts[index]).toHaveClass('sr-only');
    });
  });

  it('renders message when there are no alerts', () => {
    // Arrange
    asMockedFn(useServiceAlerts).mockReturnValue([]);

    // Act
    render(<AlertsIndicator />);
    fireEvent.click(screen.getByRole('button'));

    // Assert
    expect(screen.getByRole('dialog')).toHaveTextContent('No system alerts at this time.');
    screen.logTestingPlaygroundURL();
  });
});
