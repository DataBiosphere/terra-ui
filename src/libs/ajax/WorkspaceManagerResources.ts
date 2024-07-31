import _ from 'lodash/fp';
import { authOpts } from 'src/auth/auth-options';
import { fetchWorkspaceManager } from 'src/libs/ajax/ajax-common';

export const WorkspaceManagerResources = (signal) => ({
  getWorkspace: (workspaceId: string): Promise<any> => {
    return fetchWorkspaceManager(`workspaces/v1/${workspaceId}`, _.merge(authOpts(), { signal })).then((r) => r.json());
  },

  controlledResources: async (workspaceId) => {
    const res = await fetchWorkspaceManager(
      `workspaces/v1/${workspaceId}/resources?stewardship=CONTROLLED&limit=1000`,
      _.merge(authOpts(), { signal })
    );
    return await res.json();
  },
});

export type WorkspaceManagerResourcesContract = ReturnType<typeof WorkspaceManagerResources>;
