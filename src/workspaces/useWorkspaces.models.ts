import { FieldsArg } from 'src/libs/ajax/workspaces/providers/WorkspaceProvider';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';

/**
 * the expected hook return for useWorkpaces hook usage.
 */
export interface UseWorkspacesStateResult {
  workspaces: WorkspaceWrapper[];
  refresh: () => Promise<void>;
  loading: boolean;
}

/**
 * the hook signature for expected useWorkspaces hook usage.
 */
export type UseWorkspacesState = (fields?: FieldsArg, stringAttributeMaxLength?: number) => UseWorkspacesStateResult;
