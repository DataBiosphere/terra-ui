import { fireEvent, screen, within } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import * as Utils from 'src/libs/utils';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

import { Alert as AlertType } from './Alert';
import Alerts from './Alerts';
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
    asMockedFn(useServiceAlerts).mockReturnValue(testAlerts);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders number of alerts', () => {
    render(h(Alerts));
    expect(screen.getByRole('button')).toHaveTextContent(`${testAlerts.length}`);
  });

  it('renders popup with alerts', () => {
    render(h(Alerts));
    fireEvent.click(screen.getByRole('button'));

    const alerts = screen.getAllByTestId('alert');
    expect(alerts.length).toBe(testAlerts.length);

    Utils.toIndexPairs(testAlerts).forEach(([index, testAlert]) => {
      expect(within(alerts[index]).getByText(testAlert.title)).toBeTruthy();
      expect(within(alerts[index]).getByText(testAlert.message as string)).toBeTruthy();
    });
  });

  it('renders alerts for screen readers', () => {
    render(h(Alerts));
    const screenReaderAlerts = screen.getAllByRole('alert');

    expect(screenReaderAlerts.length).toBe(testAlerts.length);

    Utils.toIndexPairs(testAlerts).forEach(([index, testAlert]) => {
      expect(within(screenReaderAlerts[index]).getByText(testAlert.title)).toBeTruthy();
      expect(within(screenReaderAlerts[index]).getByText(testAlert.message as string)).toBeTruthy();

      expect(screenReaderAlerts[index]).toHaveClass('sr-only');
    });
  });

  it('renders message when there are no alerts', () => {
    asMockedFn(useServiceAlerts).mockReturnValue([]);

    render(h(Alerts));
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('dialog')).toHaveTextContent('No system alerts at this time.');
  });
});
