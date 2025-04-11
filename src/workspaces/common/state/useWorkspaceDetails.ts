import _ from 'lodash/fp';
import { useState } from 'react';
import { SamResources } from 'src/libs/ajax/SamResources';
import { Workspaces } from 'src/libs/ajax/workspaces/Workspaces';
import { withErrorReporting } from 'src/libs/error';
import { useCancellation, useOnMount } from 'src/libs/react-utils';
import * as Utils from 'src/libs/utils';
import { canRead, WorkspaceAccessLevel, WorkspaceWrapper as Workspace } from 'src/workspaces/utils';

export const useWorkspaceDetails = (
  workspaceName: {
    namespace: string;
    name: string;
    selectedWorkspace?: Workspace;
    accessLevel: WorkspaceAccessLevel;
  },
  fields: string[]
) => {
  const { namespace, name, selectedWorkspace, accessLevel: initialAccessLevel } = workspaceName;
  const [workspace, setWorkspace] = useState<Workspace>();
  const [loading, setLoading] = useState(true);
  const signal = useCancellation();

  const fetchWorkspaceDetails = async (): Promise<Workspace | undefined> => {
    if (canRead(initialAccessLevel)) {
      // Fetch workspace details if the user has read access
      return await Workspaces(signal).workspace(namespace, name).details(fields);
    }
    // Fetch Workspace User Resource Roles and construct workspace object for users without read access
    const workspaceUserRoles: string[] = await SamResources(signal).getResourceRolesV2({
      resourceTypeName: 'workspace',
      resourceId: `${selectedWorkspace?.workspace?.workspaceId}`,
    });
    const isProjectOwner = workspaceUserRoles.includes('project-owner');
    const isOwner = workspaceUserRoles.includes('owner');

    // Construct a workspace object (contains dummy values for TS compliance) for users without read access
    return {
      accessLevel: isProjectOwner ? 'PROJECT_OWNER' : (isOwner && 'OWNER') || 'NO ACCESS',
      canCompute: isProjectOwner || isOwner,
      canShare: isProjectOwner || isOwner,
      policies: selectedWorkspace?.policies ?? [],
      workspace: {
        ...selectedWorkspace?.workspace,
        namespace,
        name,
        authorizationDomain: selectedWorkspace?.workspace?.authorizationDomain ?? [],
        billingAccount: '',
        bucketName: selectedWorkspace?.workspace?.bucketName ?? '',
        cloudPlatform: 'Gcp',
        createdBy: selectedWorkspace?.workspace?.createdBy ?? '',
        createdDate: selectedWorkspace?.workspace?.createdDate ?? '',
        googleProject: selectedWorkspace?.workspace?.googleProject ?? '',
        lastModified: selectedWorkspace?.workspace?.lastModified ?? '',
        workspaceId: selectedWorkspace?.workspace?.workspaceId ?? '',
      },
    };
  };

  const refresh = _.flow(
    withErrorReporting('Error loading workspace details'),
    Utils.withBusyState(setLoading)
  )(async () => {
    const ws = await fetchWorkspaceDetails();

    if (ws?.workspace) {
      // Update the cloud platform based on the selected workspace
      ws.workspace.cloudPlatform = selectedWorkspace?.workspace.cloudPlatform === 'Gcp' ? 'Gcp' : 'Azure';
      setWorkspace(ws);
    }
  });

  useOnMount(() => {
    refresh();
  });

  return { workspace, refresh, loading };
};
