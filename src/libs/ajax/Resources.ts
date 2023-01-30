import _ from 'lodash/fp'
import { appIdentifier, authOpts, fetchSam, fetchWorkspaceManager } from 'src/libs/ajax/ajax-common'


export const Resources = signal => ({
  leave: (samResourceType, samResourceId) => fetchSam(`api/resources/v2/${samResourceType}/${samResourceId}/leave`, _.mergeAll([authOpts(), appIdentifier, { method: 'DELETE' }])),

  workspaceControlledResources: async workspaceId => {
    const res = await fetchWorkspaceManager(`workspaces/v1/${workspaceId}/resources?stewardship=CONTROLLED&limit=1000`,
      _.merge(authOpts(), { signal })
    )
    return await res.json()
  }
})
