import _ from 'lodash/fp'
import * as qs from 'qs'
import { appIdentifier, authOpts, fetchLeo, jsonBody } from 'src/libs/ajax/ajax-common'
import { pdTypes } from 'src/pages/workspaces/workspace/analysis/utils/disk-utils'


export const Disks = signal => ({
  list: async (labels = {}) => {
    const res = await fetchLeo(`api/google/v1/disks${qs.stringify(labels, { addQueryPrefix: true })}`,
      _.mergeAll([authOpts(), appIdentifier, { signal }]))
    return res.json()
  },

  disk: (project, name) => {
    return {
      create: props => fetchLeo(`api/google/v1/disks/${project}/${name}`,
        _.mergeAll([authOpts(), appIdentifier, { signal, method: 'POST' }, jsonBody(props)])
      ),
      delete: () => {
        return fetchLeo(`api/google/v1/disks/${project}/${name}`, _.mergeAll([authOpts(), appIdentifier, { signal, method: 'DELETE' }]))
      },
      update: size => {
        return fetchLeo(`api/google/v1/disks/${project}/${name}`,
          _.mergeAll([authOpts(), jsonBody({ size }), appIdentifier, { signal, method: 'PATCH' }]))
      },
      details: async () => {
        const res = await fetchLeo(`api/google/v1/disks/${project}/${name}`,
          _.mergeAll([authOpts(), appIdentifier, { signal, method: 'GET' }]))
        return res.json().then(val => _.set('diskType', pdTypes.fromString(val.diskType), val))
      }
    }
  }
})
