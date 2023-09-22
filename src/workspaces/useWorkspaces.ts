import { workspaceProvider } from 'src/libs/ajax/workspaces/providers/WorkspaceProvider';
import { makeUseWorkspaces, UseWorkspacesState } from 'src/workspaces/useWorkspaces.composable';

export const useWorkspaces: UseWorkspacesState = makeUseWorkspaces({ workspaceProvider });
