import _ from 'lodash/fp';

import { getServiceAlerts, serviceAlertsStore } from './service-alerts';

export const startPollingServiceAlerts = (): (() => void) => {
  const loadServiceAlerts = () =>
    getServiceAlerts().then((serviceAlerts) => serviceAlertsStore.set(serviceAlerts), _.noop);

  loadServiceAlerts();
  const interval = setInterval(loadServiceAlerts, 60000);
  return () => clearInterval(interval);
};
