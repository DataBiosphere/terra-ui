import { useAutoLoadedData } from 'src/libs/ajax/loaded-data/useAutoLoadedData';
import { UseLoadedDataArgs } from 'src/libs/ajax/loaded-data/useLoadedData';
import { FieldsArg } from 'src/libs/ajax/workspaces/providers/WorkspaceProvider';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';

export interface UseWorkspacesStateResult {
  workspaces: WorkspaceWrapper[];
  refresh: () => Promise<void>;
  loading: boolean;
}

export type UseWorkspacesDataArgs = UseLoadedDataArgs<WorkspaceWrapper[]> & {
  getData: () => Promise<WorkspaceWrapper[]>;
};

export type UseWorkspacesState = (fields?: FieldsArg, stringAttributeMaxLength?: number) => UseWorkspacesStateResult;

/**
 * handles conversion of useAutoLoadedData mechanics to existing hook return expectations
 * @param args - object {} must include getData method, and optionally onSuccess and/or onError
 */
export const useWorkspacesData = (args: UseWorkspacesDataArgs): UseWorkspacesStateResult => {
  const { getData, onSuccess, onError } = args;

  const [workspaces, updateWorkspaces] = useAutoLoadedData<WorkspaceWrapper[]>(getData, [], {
    onError,
    onSuccess,
  });

  return {
    workspaces: workspaces.status !== 'None' && workspaces.state !== null ? workspaces.state : [],
    refresh: () => updateWorkspaces(getData),
    loading: workspaces.status === 'Loading',
  };
};
