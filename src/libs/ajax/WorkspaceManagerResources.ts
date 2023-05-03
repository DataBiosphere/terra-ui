import _ from 'lodash/fp';
import { authOpts, fetchWorkspaceManager } from 'src/libs/ajax/ajax-common';

export const WorkspaceManagerResources = (signal) => ({
  controlledResources: async (workspaceId) => {
    const res = await fetchWorkspaceManager(
      `workspaces/v1/${workspaceId}/resources?stewardship=CONTROLLED&limit=1000`,
      _.merge(authOpts(), { signal })
    );
    return await res.json();
  },
});
