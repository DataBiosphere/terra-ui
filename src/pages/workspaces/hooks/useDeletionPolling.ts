import _ from 'lodash/fp';
import { useEffect, useState } from 'react';
import { Ajax } from 'src/libs/ajax';
import { workspacesStore, workspaceStore } from 'src/libs/state';
import { pollWithCancellation } from 'src/libs/utils';
import { WorkspaceState, WorkspaceWrapper as Workspace } from 'src/libs/workspace-utils';

const updateWorkspacesList = (
  workspaces: Workspace[],
  workspaceId: string,
  state: WorkspaceState,
  errorMessage?: string
): Workspace[] => workspaces.map((ws) => updateWorkspace(ws, workspaceId, state, errorMessage));

const updateWorkspace = (
  workspace: Workspace,
  workspaceId: string,
  state: WorkspaceState,
  errorMessage?: string
): Workspace => {
  if (workspace.workspace.workspaceId === workspaceId) {
    const update = _.cloneDeep(workspace);
    update.workspace.state = state;
    update.workspace.errorMessage = errorMessage;
    return update;
  }
  return workspace;
};

const checkWorkspaceDeletion = async (workspace: Workspace, abort: () => void, signal: AbortSignal) => {
  const doUpdate = (abort: () => void, workspace: Workspace, state: WorkspaceState, errorMessage?: string) => {
    const workspaceId = workspace.workspace.workspaceId;
    abort();
    workspacesStore.update((wsList) => updateWorkspacesList(wsList, workspaceId, state, errorMessage));
    workspaceStore.update((ws) => updateWorkspace(ws, workspaceId, state, errorMessage));
  };

  try {
    const wsResp: Workspace = await Ajax(signal)
      .Workspaces.workspace(workspace.workspace.namespace, workspace.workspace.name)
      .details(['workspace.state', 'workspace.errorMessage']);
    const state = wsResp.workspace.state;

    if (!!state && state !== 'Deleting') {
      doUpdate(abort, workspace, state, wsResp.workspace.errorMessage);
    }
  } catch (error) {
    if (error instanceof Response && error.status === 404) {
      doUpdate(abort, workspace, 'Deleted');
    }
  }
};

export const useDeletionPolling = (workspaces: Workspace[]) => {
  // we have to do the signal/abort manually instead of with useCancelable so that the it can be cleaned up in the
  // this component's useEffect, instead of the useEffect in useCancelable
  const [controller, setController] = useState(new window.AbortController());
  const abort = () => {
    controller.abort();
    setController(new window.AbortController());
  };

  useEffect(() => {
    const iterateDeletingWorkspaces = async () => {
      const deletingWorkspaces = _.filter((ws) => ws?.workspace?.state === 'Deleting', workspaces);
      for (const ws of deletingWorkspaces) {
        await checkWorkspaceDeletion(ws, abort, controller.signal);
      }
    };

    pollWithCancellation(() => iterateDeletingWorkspaces(), 30000, false, controller.signal);
    return () => {
      abort();
    };
    //  eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaces]); // adding the controller to deps causes a double fire of the effect
};

// we need a separate implementation of this, because using useDeletetionPolling with a list
// containing a single workspace in the WorkspaceContainer causes a rendering loop
export const useSingleWorkspaceDeletionPolling = (workspace: Workspace) => {
  const [controller, setController] = useState(new window.AbortController());
  const abort = () => {
    controller.abort();
    setController(new window.AbortController());
  };

  useEffect(() => {
    pollWithCancellation(
      async () => {
        if (workspace?.workspace?.state === 'Deleting') {
          await checkWorkspaceDeletion(workspace, abort, controller.signal);
        }
      },
      30000,
      false,
      controller.signal
    );
    return () => {
      abort();
    };
    //  eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace]); // adding the controller to deps causes a double fire of the effect
};
