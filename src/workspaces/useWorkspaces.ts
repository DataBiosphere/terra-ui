import { useAutoLoadedData } from 'src/libs/ajax/loaded-data/useAutoLoadedData';
import { useCachedData } from 'src/libs/ajax/loaded-data/useCachedData';
import { useLoadedDataEvents } from 'src/libs/ajax/loaded-data/useLoadedData';
import { FieldsArg, workspaceProvider } from 'src/libs/ajax/workspaces/providers/WorkspaceProvider';
import { reportError } from 'src/libs/error';
import { useCancellation } from 'src/libs/react-utils';
import { workspacesStore } from 'src/libs/state';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';
import { UseWorkspacesStateResult } from 'src/workspaces/useWorkspaces.models';

const defaultFieldsArgs: FieldsArg = [
  'accessLevel',
  'public',
  'workspace',
  'workspace.state',
  'workspace.attributes.description',
  'workspace.attributes.tag:tags',
  'workspace.workspaceVersion',
];

/**
 * A hook that retrieves workspaces list, and adds Terra-UI specific data-access and concerns.
 * Honors expected hook return contract.
 * @param fieldsArg
 * @param stringAttributeMaxLength
 */
export const useWorkspaces = (fieldsArg?: FieldsArg, stringAttributeMaxLength?: number): UseWorkspacesStateResult => {
  const signal = useCancellation();
  const fields: FieldsArg = fieldsArg || defaultFieldsArgs;
  const getData = async (): Promise<WorkspaceWrapper[]> =>
    await workspaceProvider.list(fields, { stringAttributeMaxLength, signal });

  const useAutoLoadedWorkspaces = () => useAutoLoadedData(getData, []);

  const [workspaces, updateWorkspaces] = useCachedData(useAutoLoadedWorkspaces, workspacesStore);

  useLoadedDataEvents(workspaces, {
    onError: () => {
      void reportError('Error loading workspace list');
    },
  });

  const hookResult: UseWorkspacesStateResult = {
    workspaces: workspaces.state !== null ? workspaces.state : [],
    refresh: () => updateWorkspaces(getData),
    loading: workspaces.status === 'Loading',
  };

  return hookResult;
};
