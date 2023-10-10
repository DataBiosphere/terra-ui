import { FieldsArg, workspaceProvider } from 'src/libs/ajax/workspaces/providers/WorkspaceProvider';
import { useSettableStore } from 'src/libs/react-utils';
import { workspacesStore } from 'src/libs/state';
import {
  useWorkspacesComposable,
  UseWorkspacesState,
  UseWorkspacesStateResult,
} from 'src/workspaces/useWorkspaces.composable';

export const useWorkspaces: UseWorkspacesState = (
  fieldsArg?: FieldsArg,
  stringAttributeMaxLength?: string | number
): UseWorkspacesStateResult => {
  const useWorkspacesStore = () => useSettableStore(workspacesStore);

  return useWorkspacesComposable(
    {
      workspaceProvider,
      useWorkspacesStore,
    },
    fieldsArg,
    stringAttributeMaxLength
  );
};
