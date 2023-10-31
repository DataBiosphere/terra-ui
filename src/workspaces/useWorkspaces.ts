import { FieldsArg, workspaceProvider } from 'src/libs/ajax/workspaces/providers/WorkspaceProvider';
import { useCancellation } from 'src/libs/react-utils';
import { workspacesStore } from 'src/libs/state';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';
import { useWorkspacesData, UseWorkspacesStateResult } from 'src/workspaces/useWorkspacesData';

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
 * A composed version of useWorkspacesData hook that adds Terra-UI specific data-access and concerns.
 * Honors expected hook return contract.
 * @param fieldsArg
 * @param stringAttributeMaxLength
 */
export const useWorkspaces = (fieldsArg?: FieldsArg, stringAttributeMaxLength?: number): UseWorkspacesStateResult => {
  const signal = useCancellation();
  const fields: FieldsArg = fieldsArg || defaultFieldsArgs;

  const getData = async (): Promise<WorkspaceWrapper[]> =>
    await workspaceProvider.list(fields, { stringAttributeMaxLength, signal });

  const workspacesResult = useWorkspacesData({
    getData,
    onError: () => {
      reportError('Error loading workspace list');
    },
    onSuccess: (result) => {
      // update application source-off-truth
      workspacesStore.set(result.state);
    },
  });

  return {
    ...workspacesResult,
    workspaces: workspacesStore.get(), // reflect application source-of-truth
  };
};
