import _ from 'lodash/fp';
import { useEffect, useMemo, useState } from 'react';
import { useWorkspaces } from 'src/components/workspace-utils';
import { Ajax } from 'src/libs/ajax';
import { withErrorReporting } from 'src/libs/error';
import { useCancellation } from 'src/libs/react-utils';
import * as Utils from 'src/libs/utils';
import { WorkspaceSubmissionStats, WorkspaceWrapper as Workspace } from 'src/libs/workspace-utils';

interface WorkspacesWithSubmissionStatsReturn {
  workspaces: Workspace[];
  refresh: () => void;
  loadingWorkspaces: boolean;
  loadingSubmissionStats: boolean;
}

export const useWorkspacesWithSubmissionStats = (): WorkspacesWithSubmissionStatsReturn => {
  const {
    workspaces,
    loading: loadingWorkspaces,
    refresh,
  } = useWorkspaces(
    [
      'accessLevel',
      'public',
      'workspace.attributes.description',
      'workspace.attributes.tag:tags',
      'workspace.authorizationDomain',
      'workspace.cloudPlatform',
      'workspace.createdBy',
      'workspace.lastModified',
      'workspace.name',
      'workspace.namespace',
      'workspace.workspaceId',
      'workspace.state',
    ],
    250
  );

  const signal = useCancellation();
  const [loadingSubmissionStats, setLoadingSubmissionStats] = useState(true);
  const [submissionStats, setSubmissionStats] = useState<Record<string, WorkspaceSubmissionStats>>();

  useEffect(() => {
    // After the inital load, workspaces are refreshed after deleting a workspace or locking a workspace.
    // We don't need to reload submission stats in those cases.
    if (workspaces && !submissionStats) {
      const loadSubmissionStats: () => Promise<void> = _.flow(
        withErrorReporting('Error loading submission stats'),
        Utils.withBusyState(setLoadingSubmissionStats)
      )(async () => {
        const response = await Ajax(signal).Workspaces.list(['workspace.workspaceId', 'workspaceSubmissionStats']);
        setSubmissionStats(
          _.fromPairs(_.map((ws: Workspace) => [ws.workspace.workspaceId, ws.workspaceSubmissionStats], response))
        );
      }) as () => Promise<void>;

      loadSubmissionStats();
    }
  }, [workspaces, submissionStats, signal]);

  const workspacesWithSubmissionStats = useMemo(() => {
    return _.map(
      (ws) => _.set('workspaceSubmissionStats', _.get(ws.workspace.workspaceId, submissionStats), ws),
      workspaces
    );
  }, [workspaces, submissionStats]);

  return { workspaces: workspacesWithSubmissionStats, refresh, loadingWorkspaces, loadingSubmissionStats };
};
