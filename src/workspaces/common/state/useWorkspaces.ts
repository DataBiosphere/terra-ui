import { useAutoLoadedData, useLoadedDataEvents, withCachedData } from '@terra-ui-packages/components';
import { useNotificationsFromContext } from '@terra-ui-packages/notifications';
import { FieldsArg, workspaceProvider } from 'src/libs/ajax/workspaces/providers/WorkspaceProvider';
import { withErrorReporter } from 'src/libs/error';
import { useCancellation } from 'src/libs/react-utils';
import { workspacesStore } from 'src/libs/state';
import { UseWorkspacesResult } from 'src/workspaces/common/state/useWorkspaces.models';
import { WorkspaceWrapper } from 'src/workspaces/utils';

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
export const useWorkspaces = (fieldsArg?: FieldsArg, stringAttributeMaxLength?: number): UseWorkspacesResult => {
  const signal = useCancellation();
  const { reportError } = withErrorReporter(useNotificationsFromContext());
  const fields: FieldsArg = fieldsArg || defaultFieldsArgs;
  const getData = async (): Promise<WorkspaceWrapper[]> =>
    await workspaceProvider.list(fields, { stringAttributeMaxLength, signal });

  const useData = withCachedData(workspacesStore, useAutoLoadedData);

  const [workspaces, updateWorkspaces] = useData(getData, []);

  useLoadedDataEvents(workspaces, {
    onError: () => {
      void reportError('Error loading workspace list');
    },
  });

  const hookResult: UseWorkspacesResult = {
    workspaces: workspaces.state !== null ? workspaces.state : [],
    refresh: () => updateWorkspaces(getData),
    loading: workspaces.status === 'Loading',
  };

  return hookResult;
};
