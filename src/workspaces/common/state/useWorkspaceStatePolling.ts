import { LoadedState } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import { useEffect, useRef, useState } from 'react';
import { Ajax } from 'src/libs/ajax';
import { workspacesStore, workspaceStore } from 'src/libs/state';
import { pollWithCancellation } from 'src/libs/utils';
import { BaseWorkspaceInfo, WorkspaceState, WorkspaceWrapper as Workspace } from 'src/workspaces/utils';

// type WorkspaceUpdate = Partial<Workspace['workspace']>

interface WorkspaceUpdate extends Partial<BaseWorkspaceInfo> {
  workspaceId: string;
  state: WorkspaceState;
  errorMessage?: string;
}

const updateWorkspacesList = (workspaces: Workspace[], update: WorkspaceUpdate): Workspace[] =>
  workspaces.map((ws) => updateWorkspaceIfMatching(ws, update));

const updateWorkspaceIfMatching = <T extends Workspace>(workspace: T, update: WorkspaceUpdate): T => {
  if (workspace.workspace?.workspaceId === update.workspaceId) {
    const updatedWs = _.cloneDeep(workspace);
    updatedWs.workspace.state = update.state;
    updatedWs.workspace.errorMessage = update.errorMessage;
    return updatedWs;
  }
  return workspace;
};

const checkWorkspaceState = async (workspace: Workspace, abort: () => void, signal: AbortSignal) => {
  const doUpdate = (abort: () => void, update: WorkspaceUpdate) => {
    workspacesStore.update((wsList) => updateWorkspacesList(wsList, update));
    workspaceStore.update((ws) => {
      if (ws) {
        return updateWorkspaceIfMatching(ws, update);
      }
      return undefined;
    });
    abort();
  };

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
      doUpdate(abort, update);
    }
  } catch (error) {
    // for workspaces that are being deleted, the details endpoint will return a 404 when the deletion is complete
    if (startingState === 'Deleting' && error instanceof Response && error.status === 404) {
      const update: WorkspaceUpdate = { workspaceId: workspace.workspace.workspaceId, state: 'Deleted' };
      doUpdate(abort, update);
    } else {
      console.error(`Error checking workspace state for ${workspace.workspace.name}: ${JSON.stringify(error)}`);
    }
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
      if (status === 'Ready') {
        const updatingWorkspaces = _.filter((ws) => _.contains(ws?.workspace?.state, updatingStates), workspaces);
        for (const ws of updatingWorkspaces) {
          await checkWorkspaceState(ws, abort, controller.current.signal);
        }
      }
    };

    pollWithCancellation(() => iterateUpdatingWorkspaces(), 30000, false, controller.current.signal);
    return () => {
      abort();
    };
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
