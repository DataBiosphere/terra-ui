import _ from 'lodash/fp';
import { useState } from 'react';
import { RawAccessEntry, RawWorkspaceAcl } from 'src/libs/ajax/workspaces/workspace-models';
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
    loggedInUser: { userEmail?: string; accessLevel: WorkspaceAccessLevel } | {};
  },
  fields: string[]
) => {
  const { namespace, name, selectedWorkspace, loggedInUser } = workspaceName;
  const userEmail = (loggedInUser as { userEmail?: string })?.userEmail ?? '';
  const initialAccessLevel = (loggedInUser as { accessLevel?: WorkspaceAccessLevel })?.accessLevel ?? 'NO ACCESS';

  const [workspace, setWorkspace] = useState<Workspace>();
  const [loading, setLoading] = useState(true);
  const signal = useCancellation();

  const fetchWorkspaceDetails = async (): Promise<Workspace | undefined> => {
    if (canRead(initialAccessLevel)) {
      // Fetch workspace details if the user has read access
      return await Workspaces(signal).workspace(namespace, name).details(fields);
    }
    // Fetch ACL and construct workspace object for users without read access
    const wsAcls: Record<'acl', RawWorkspaceAcl> = await Workspaces(signal).workspace(namespace, name).getAcl();
    const accessEntry = _.flow(
      _.toPairs,
      _.find(([key, entry]: [string, RawAccessEntry]) => key === userEmail && entry.accessLevel === 'OWNER'),
      _.last
    )(wsAcls.acl) as RawAccessEntry | undefined;

    return {
      accessLevel: accessEntry?.accessLevel ?? 'NO ACCESS',
      canCompute: accessEntry?.canCompute ?? false,
      canShare: accessEntry?.canShare ?? false,
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
