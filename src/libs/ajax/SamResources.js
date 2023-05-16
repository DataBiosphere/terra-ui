import _ from 'lodash/fp';
import { appIdentifier, authOpts, fetchSam } from 'src/libs/ajax/ajax-common';

export const SamResources = () => ({
  leave: (samResourceType, samResourceId) =>
    fetchSam(`api/resources/v2/${samResourceType}/${samResourceId}/leave`, _.mergeAll([authOpts(), appIdentifier, { method: 'DELETE' }])),
});
