import { getServiceAlerts, serviceAlertsStore } from 'src/libs/service-alerts'


export const startPollingServiceAlerts = () => {
  getServiceAlerts().then(serviceAlerts => serviceAlertsStore.set(serviceAlerts))

  const interval = setInterval(() => {
    try {
      getServiceAlerts().then(serviceAlerts => serviceAlertsStore.set(serviceAlerts))
    } catch (error) {
    }
  }, 60000)

  return () => clearInterval(interval)
}
