import { FieldsArg } from 'src/libs/ajax/workspaces/providers/WorkspaceProvider';
import { WorkspaceWrapper } from 'src/workspaces/utils';

/**
 * the expected hook return for useWorkpaces hook usage.
 */
export interface UseWorkspacesResult {
  workspaces: WorkspaceWrapper[];
  refresh: () => Promise<void>;
  loading: boolean;
}

/**
 * the hook signature for expected useWorkspaces hook usage.
 */
export type UseWorkspaces = (fields?: FieldsArg, stringAttributeMaxLength?: number) => UseWorkspacesResult;
