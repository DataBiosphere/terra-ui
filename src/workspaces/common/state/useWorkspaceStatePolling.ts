import { LoadedState } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import { useEffect, useRef } from 'react';
import { Workspaces } from 'src/libs/ajax/workspaces/Workspaces';
import { workspacesStore, workspaceStore } from 'src/libs/state';
import { pollWithCancellation } from 'src/libs/utils';
import { BaseWorkspaceInfo, WorkspaceInfo, WorkspaceState, WorkspaceWrapper as Workspace } from 'src/workspaces/utils';

export interface WorkspaceUpdate extends Partial<BaseWorkspaceInfo> {
  workspaceId: string;
  state: WorkspaceState;
  errorMessage?: string;
}

export const WORKSPACE_UPDATE_POLLING_INTERVAL = 15000;

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

// Applies the update to the workspace stores and returns the update
const doUpdate = (update: WorkspaceUpdate): WorkspaceUpdate => {
  workspacesStore.update((wsList) => updateWorkspacesList(wsList, update));
  workspaceStore.update((ws) => {
    if (ws) {
      return updateWorkspaceIfMatching(ws, update);
    }
    return undefined;
  });
  return update;
};

// Polls the workspace state, and updates the stores if the state changes
// Returns the new update if the workspace state transitions or undefined if the workspace was not updated
const checkWorkspaceState = async (
  workspace: WorkspaceInfo,
  signal: AbortSignal
): Promise<WorkspaceUpdate | undefined> => {
  const startingState = workspace.state;
  try {
    const wsResp: Workspace = await Workspaces(signal)
      .workspace(workspace.namespace, workspace.name)
      .details(['workspace.state', 'workspace.errorMessage']);
    const state = wsResp.workspace.state;

    if (!!state && state !== startingState) {
      const update = {
        workspaceId: workspace.workspaceId,
        state,
        errorMessage: wsResp.workspace.errorMessage,
      };
      return doUpdate(update);
    }
    return undefined;
  } catch (error) {
    // for workspaces that are being deleted, the details endpoint will return a 404 when the deletion is complete
    if (startingState === 'Deleting' && error instanceof Response && error.status === 404) {
      const update: WorkspaceUpdate = { workspaceId: workspace.workspaceId, state: 'Deleted' };
      return doUpdate(update);
    }
    console.error(`Error checking workspace state for ${workspace.name}: ${JSON.stringify(error)}`);
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
          const updatedState = await checkWorkspaceState(ws.workspace, controller.current.signal);
          if (updatedState) {
            abort();
          }
        }
      }
    };

    pollWithCancellation(
      () => iterateUpdatingWorkspaces(),
      WORKSPACE_UPDATE_POLLING_INTERVAL,
      false,
      controller.current.signal
    );
    return () => {
      abort();
    };
  }, [workspaces, status]);
};

export type StateUpdateAction = (WorkspaceUpdate) => void;
export type StateUpdateListener = { [key in WorkspaceState]?: StateUpdateAction[] };

// Monitors the state of workspaces and calls the listeners when the state changes
export const useWorkspacesStatePollingWithAction = (workspaces: WorkspaceInfo[], listeners: StateUpdateListener) => {
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
      const updatingWorkspaces = _.filter((ws) => _.contains(ws.state, updatingStates), workspaces);
      for (const ws of updatingWorkspaces) {
        const updatedState = await checkWorkspaceState(ws, controller.current.signal);
        if (updatedState) {
          const updatedWS = _.merge(ws, updatedState);
          listeners[updatedState.state]?.forEach((callback) => callback(updatedWS));
          abort();
        }
      }
    };

    pollWithCancellation(
      () => iterateUpdatingWorkspaces(),
      WORKSPACE_UPDATE_POLLING_INTERVAL,
      true,
      controller.current.signal
    );
    return () => {
      abort();
    };
  }, [workspaces, listeners]);
};
