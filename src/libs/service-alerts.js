import _ from 'lodash/fp';
import { Ajax } from 'src/libs/ajax';
import { useStore } from 'src/libs/react-utils';
import * as Utils from 'src/libs/utils';

export const getServiceAlerts = async () => {
  const serviceAlerts = await Ajax().FirecloudBucket.getServiceAlerts();
  const hashes = await Promise.all(_.map(_.flow(JSON.stringify, Utils.sha256), serviceAlerts));
  return _.flow(
    _.map(_.defaults({ severity: 'warn' })),
    _.zip(hashes),
    _.map(([id, alert]) => ({ ...alert, id })),
    _.uniqBy('id')
  )(serviceAlerts);
};

export const serviceAlertsStore = Utils.atom([]);

export const useServiceAlerts = () => useStore(serviceAlertsStore);
