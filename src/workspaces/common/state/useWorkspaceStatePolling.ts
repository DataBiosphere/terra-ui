import { LoadedState } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import { useEffect, useState } from 'react';
import { Ajax } from 'src/libs/ajax';
import { workspacesStore, workspaceStore } from 'src/libs/state';
import { pollWithCancellation } from 'src/libs/utils';
import { WorkspaceState, WorkspaceWrapper as Workspace } from 'src/workspaces/utils';

const updateWorkspacesList = (
  workspaces: Workspace[],
  workspaceId: string,
  state: WorkspaceState,
  errorMessage?: string
): Workspace[] => workspaces.map((ws) => updateWorkspace(ws, workspaceId, state, errorMessage));

const updateWorkspace = <T extends Workspace>(
  workspace: T,
  workspaceId: string,
  state: WorkspaceState,
  errorMessage?: string
): T => {
  if (workspace?.workspace?.workspaceId === workspaceId) {
    const update = _.cloneDeep(workspace);
    update.workspace.state = state;
    update.workspace.errorMessage = errorMessage;
    return update;
  }
  return workspace;
};

const checkWorkspaceState = async (workspace: Workspace, abort: () => void, signal: AbortSignal) => {
  const doUpdate = (abort: () => void, workspace: Workspace, state: WorkspaceState, errorMessage?: string) => {
    const workspaceId = workspace.workspace.workspaceId;
    workspacesStore.update((wsList) => updateWorkspacesList(wsList, workspaceId, state, errorMessage));
    workspaceStore.update((ws) => updateWorkspace(ws!, workspaceId, state, errorMessage));
    abort();
  };

  const startingState = workspace.workspace.state;
  try {
    const wsResp: Workspace = await Ajax(signal)
      .Workspaces.workspace(workspace.workspace.namespace, workspace.workspace.name)
      .details(['workspace.state', 'workspace.errorMessage']);
    const state = wsResp.workspace.state;

    if (!!state && state !== startingState) {
      doUpdate(abort, workspace, state, wsResp.workspace.errorMessage);
    }
  } catch (error) {
    // for workspaces that are being deleted, the details endpoint will return a 404 when the deletion is complete
    if (startingState === 'Deleting' && error instanceof Response && error.status === 404) {
      doUpdate(abort, workspace, 'Deleted');
    } else {
      console.error(`Error checking workspace state for ${workspace.workspace.name}: ${JSON.stringify(error)}`);
    }
  }
};

const updatingStates: WorkspaceState[] = ['Deleting', 'Cloning', 'CloningContainer'];

export const useWorkspaceStatePolling = (workspaces: Workspace[], status: LoadedState<Workspace[]>['status']) => {
  // we have to do the signal/abort manually instead of with useCancelable so that the it can be cleaned up in the
  // this component's useEffect, instead of the useEffect in useCancelable
  const [controller, setController] = useState(new window.AbortController());
  const abort = () => {
    controller.abort();
    setController(new window.AbortController());
  };

  useEffect(() => {
    const iterateUpdatingWorkspaces = async () => {
      if (status === 'Ready') {
        const updatingWorkspaces = _.filter((ws) => _.contains(ws?.workspace?.state, updatingStates), workspaces);
        for (const ws of updatingWorkspaces) {
          await checkWorkspaceState(ws, abort, controller.signal);
        }
      }
    };

    pollWithCancellation(() => iterateUpdatingWorkspaces(), 30000, false, controller.signal);
    return () => {
      abort();
    };
    //  eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaces, status]); // adding the controller to deps causes a double fire of the effect
};

// we need a separate implementation of this, because using useDeletetionPolling with a list
// containing a single workspace in the WorkspaceContainer causes a rendering loop
export const useSingleWorkspaceStatePolling = (workspace: Workspace) => {
  const [controller, setController] = useState(new window.AbortController());
  const abort = () => {
    controller.abort();
    setController(new window.AbortController());
  };

  useEffect(() => {
    pollWithCancellation(
      async () => {
        if (_.contains(workspace?.workspace?.state, updatingStates)) {
          await checkWorkspaceState(workspace, abort, controller.signal);
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
