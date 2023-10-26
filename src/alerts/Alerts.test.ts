import { fireEvent, getByText } from '@testing-library/react';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import * as Utils from 'src/libs/utils';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

import { Alert as AlertT } from './Alert';
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

const testAlerts: AlertT[] = [
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
    const { getByRole } = render(h(Alerts));
    expect(getByRole('button')).toHaveTextContent(`${testAlerts.length}`);
  });

  it('renders popup with alerts', () => {
    const { getByRole, getAllByTestId } = render(h(Alerts));
    fireEvent.click(getByRole('button'));

    const alerts = getAllByTestId('alert');
    expect(alerts.length).toBe(testAlerts.length);

    _.forEach(([index, testAlert]) => {
      expect(getByText(alerts[index], testAlert.title)).toBeTruthy();
      expect(getByText(alerts[index], testAlert.message as string)).toBeTruthy();
    }, Utils.toIndexPairs(testAlerts));
  });

  it('renders alerts for screen readers', () => {
    const { getAllByRole } = render(h(Alerts));
    const screenReaderAlerts = getAllByRole('alert');

    expect(screenReaderAlerts.length).toBe(testAlerts.length);

    _.forEach(([index, testAlert]) => {
      expect(getByText(screenReaderAlerts[index], testAlert.title)).toBeTruthy();
      expect(getByText(screenReaderAlerts[index], testAlert.message as string)).toBeTruthy();

      expect(screenReaderAlerts[index]).toHaveClass('sr-only');
    }, Utils.toIndexPairs(testAlerts));
  });

  it('renders message when there are no alerts', () => {
    asMockedFn(useServiceAlerts).mockReturnValue([]);

    const { getByRole } = render(h(Alerts));
    fireEvent.click(getByRole('button'));

    expect(getByRole('dialog')).toHaveTextContent('No system alerts at this time.');
  });
});
