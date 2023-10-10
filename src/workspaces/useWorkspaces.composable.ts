import { withHandlers } from '@terra-ui-packages/core-utils';
import { useState } from 'react';
import { FieldsArg, WorkspaceDataProvider } from 'src/libs/ajax/workspaces/providers/WorkspaceProvider';
import { withErrorReporting } from 'src/libs/error';
import { useCancellation, useOnMount } from 'src/libs/react-utils';
import { withBusyState } from 'src/libs/utils';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';

export interface UseWorkspacesStateResult {
  workspaces: WorkspaceWrapper[];
  refresh: () => Promise<void>;
  loading: boolean;
}

export type UseWorkspacesState = (fields?: FieldsArg, stringAttributeMaxLength?: number) => UseWorkspacesStateResult;

const defaultFieldsArgs: FieldsArg = [
  'accessLevel',
  'public',
  'workspace',
  'workspace.state',
  'workspace.attributes.description',
  'workspace.attributes.tag:tags',
  'workspace.workspaceVersion',
];

export type WorkspaceDataProviderNeeds = Pick<WorkspaceDataProvider, 'list'>;
export interface UseWorkspacesDeps {
  /**
   * Provides the data accessor for workspaces list
   */
  workspaceProvider: WorkspaceDataProviderNeeds;

  /**
   * Provides state retention of current workspaces list.  Implementation can just return useState
   * or an equivalent like useSettableStore.  Implementation is expected to be a React Hook that will
   * re-render a consuming component on state update.
   */
  useWorkspacesStore: () => [WorkspaceWrapper[], (newValue: WorkspaceWrapper[]) => void];

  // TODO: add eventReporter dependency to decouple (notification) errors, warnings, success/info
  // so we can remove assumption of withErrorHandling --> --> notify() flow in terra-ui for other teams
}

export const useWorkspacesComposable = (
  deps: UseWorkspacesDeps,
  fieldsArg?: FieldsArg,
  stringAttributeMaxLength?: number
): UseWorkspacesStateResult => {
  const { workspaceProvider, useWorkspacesStore } = deps;

  const signal = useCancellation();
  const [loading, setLoading] = useState<boolean>(false);
  const [workspaces, setWorkspaces] = useWorkspacesStore();
  const fields: FieldsArg = fieldsArg || defaultFieldsArgs;

  const refresh = withHandlers(
    [withErrorReporting('Error loading workspace list'), withBusyState(setLoading)],
    async () => {
      const results = await workspaceProvider.list(fields, { stringAttributeMaxLength, signal });
      setWorkspaces(results);
    }
  );

  useOnMount(() => {
    refresh();
  });

  return { workspaces, refresh, loading };
};
