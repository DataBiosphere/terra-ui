import { workspaceProvider } from 'src/libs/ajax/workspaces/providers/WorkspaceProvider';
import { useSettableStore } from 'src/libs/react-utils';
import { workspacesStore } from 'src/libs/state';
import { makeUseWorkspaces } from 'src/workspaces/useWorkspaces.composable';

export const useWorkspacesState = () => useSettableStore(workspacesStore);

export const useWorkspacesComposer = {
  make: () =>
    makeUseWorkspaces({
      workspaceProvider,
      useWorkspacesState,
    }),
};
export const useWorkspaces = useWorkspacesComposer.make();
