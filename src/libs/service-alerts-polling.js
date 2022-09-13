import _ from 'lodash/fp'
import { getServiceAlerts, serviceAlertsStore } from 'src/libs/service-alerts'


export const startPollingServiceAlerts = () => {
  getServiceAlerts().then(serviceAlerts => serviceAlertsStore.set(serviceAlerts), _.noop)

  const interval = setInterval(() => {
    getServiceAlerts().then(serviceAlerts => serviceAlertsStore.set(serviceAlerts), _.noop)
  }, 60000)

  return () => clearInterval(interval)
}
