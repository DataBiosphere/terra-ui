import _ from 'lodash/fp'
import * as qs from 'qs'
import { appIdentifier, authOpts, fetchLeo, jsonBody } from 'src/libs/ajax/ajax-common'
import { DecoratedPersistentDisk, GetDiskItem, ListDiskItem } from 'src/libs/ajax/leonardo/models/disk-models'
import { updatePdType } from 'src/pages/workspaces/workspace/analysis/utils/disk-utils'


export const Disks = signal => ({
  list: async (labels = {}): Promise<ListDiskItem> => {
    const res = await fetchLeo(`api/google/v1/disks${qs.stringify(labels, { addQueryPrefix: true })}`,
      _.mergeAll([authOpts(), appIdentifier, { signal }]))
    return res.json()
  },

  disk: (project: string, name: string) => ({
    create: (props): Promise<void> => fetchLeo(`api/google/v1/disks/${project}/${name}`,
      _.mergeAll([authOpts(), appIdentifier, { signal, method: 'POST' }, jsonBody(props)])
    ),
    delete: (): Promise<void> => {
      return fetchLeo(`api/google/v1/disks/${project}/${name}`, _.mergeAll([authOpts(), appIdentifier, { signal, method: 'DELETE' }]))
    },
    update: (size: number): Promise<void> => {
      return fetchLeo(`api/google/v1/disks/${project}/${name}`,
        _.mergeAll([authOpts(), jsonBody({ size }), appIdentifier, { signal, method: 'PATCH' }]))
    },
    details: async (): Promise<DecoratedPersistentDisk> => {
      const res = await fetchLeo(`api/google/v1/disks/${project}/${name}`,
        _.mergeAll([authOpts(), appIdentifier, { signal, method: 'GET' }]))
      const disk: GetDiskItem = await res.json()
      return updatePdType(disk)
    }
  })
})
