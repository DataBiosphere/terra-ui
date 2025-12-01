import { atom } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import { FirecloudBucket } from 'src/libs/ajax/firecloud/FirecloudBucket';
import { isScientificServices } from 'src/libs/brand-utils';
import { useStore } from 'src/libs/react-utils';
import * as Utils from 'src/libs/utils';

import { Alert } from './Alert';

export const getServiceAlerts = async (): Promise<Alert[]> => {
  const serviceAlerts = isScientificServices()
    ? await FirecloudBucket().getTeaspoonsAlerts()
    : await FirecloudBucket().getServiceAlerts();
  const hashes = await Promise.all(_.map(_.flow(JSON.stringify, Utils.sha256), serviceAlerts));
  const severityMap = {
    blocker: 'error',
    critical: 'warn',
    default: 'info',
  };
  return _.flow(
    _.map(_.defaults({ severity: 'critical' })),
    _.map((alert: Alert) => ({
      ...alert,
      severity: severityMap[alert.severity ?? 'default'] ?? 'info',
    })),
    _.zip(hashes),
    _.map(([id, alert]) => ({ ...alert, id })),
    _.uniqBy('id')
  )(serviceAlerts);
};

export const serviceAlertsStore = atom<Alert[]>([]);

export const useServiceAlerts = () => useStore(serviceAlertsStore);
