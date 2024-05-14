import { LoadedState } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import { useEffect, useRef, useState } from 'react';
import { Ajax } from 'src/libs/ajax';
import { workspacesStore, workspaceStore } from 'src/libs/state';
import { pollWithCancellation } from 'src/libs/utils';
import { BaseWorkspaceInfo, WorkspaceState, WorkspaceWrapper as Workspace } from 'src/workspaces/utils';

interface WorkspaceUpdate extends Partial<BaseWorkspaceInfo> {
  workspaceId: string;
  state: WorkspaceState;
  errorMessage?: string;
}

// Returns a new list of workspaces with the workspace matching the update replaced with the updated version
const updateWorkspacesList = (workspaces: Workspace[], update: WorkspaceUpdate): Workspace[] =>
  workspaces.map((ws) => updateWorkspaceIfMatching(ws, update));

// If the workspace matches the update, return a new workspace with the update applied
// otherwise return the original workspace unchanged
const updateWorkspaceIfMatching = <T extends Workspace>(workspace: T, update: WorkspaceUpdate): T => {
  if (workspace.workspace?.workspaceId === update.workspaceId) {
    return _.merge(_.cloneDeep(workspace), { workspace: update });
  }
  return workspace;
};

// Applies the update to the workspace stores and returns the update state
const doUpdate = (update: WorkspaceUpdate): WorkspaceState => {
  workspacesStore.update((wsList) => updateWorkspacesList(wsList, update));
  workspaceStore.update((ws) => {
    if (ws) {
      updateWorkspaceIfMatching(ws, update);
    }
    return undefined;
  });
  return update.state;
};

// Polls the workspace state, and updates the stores if the state changes
// Returns the new state or if the workspace state transitions or undefined if the workspace was not updated
const checkWorkspaceState = async (workspace: Workspace, signal: AbortSignal): Promise<WorkspaceState | undefined> => {
  const startingState = workspace.workspace.state;
  try {
    const wsResp: Workspace = await Ajax(signal)
      .Workspaces.workspace(workspace.workspace.namespace, workspace.workspace.name)
      .details(['workspace.state', 'workspace.errorMessage']);
    const state = wsResp.workspace.state;

    if (!!state && state !== startingState) {
      const update = {
        workspaceId: workspace.workspace.workspaceId,
        state,
        errorMessage: wsResp.workspace.errorMessage,
      };
      return doUpdate(update);
    }
    return undefined;
  } catch (error) {
    // for workspaces that are being deleted, the details endpoint will return a 404 when the deletion is complete
    if (startingState === 'Deleting' && error instanceof Response && error.status === 404) {
      const update: WorkspaceUpdate = { workspaceId: workspace.workspace.workspaceId, state: 'Deleted' };
      return doUpdate(update);
    }
    console.error(`Error checking workspace state for ${workspace.workspace.name}: ${JSON.stringify(error)}`);
    return undefined;
  }
};

const updatingStates: WorkspaceState[] = ['Deleting', 'Cloning', 'CloningContainer'];

export const useWorkspaceStatePolling = (workspaces: Workspace[], status: LoadedState<Workspace[]>['status']) => {
  // we have to do the signal/abort manually instead of with useCancelable so that the it can be cleaned up in the
  // this component's useEffect, instead of the useEffect in useCancelable
  const controller = useRef(new window.AbortController());
  const abort = () => {
    controller.current.abort();
    controller.current = new window.AbortController();
  };

  useEffect(() => {
    const iterateUpdatingWorkspaces = async () => {
      // wait for the workspaces to be loaded (LoadedState.status) before polling
      if (status === 'Ready') {
        const updatingWorkspaces = _.filter((ws) => _.contains(ws?.workspace?.state, updatingStates), workspaces);
        for (const ws of updatingWorkspaces) {
          const updatedState = await checkWorkspaceState(ws, controller.current.signal);
          if (updatedState) {
            abort();
          }
        }
      }
    };

    pollWithCancellation(() => iterateUpdatingWorkspaces(), 30000, false, controller.current.signal);
    return () => {
      abort();
    };
  }, [workspaces, status]); // adding the controller to deps causes a double fire of the effect
};

// we need a separate implementation of this, because using useWorkspaceStatePolling with a list
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
          const updatedState = await checkWorkspaceState(workspace, controller.signal);
          if (updatedState) {
            abort();
          }
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
