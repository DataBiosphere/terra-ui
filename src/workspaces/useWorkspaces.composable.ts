import { withHandlers } from '@terra-ui-packages/core-utils';
import { useState } from 'react';
import { FieldsArg, WorkspaceDataProvider } from 'src/libs/ajax/workspaces/providers/WorkspaceProvider';
import { withErrorReporting } from 'src/libs/error';
import { useCancellation, useOnMount, useStore } from 'src/libs/react-utils';
import { workspacesStore } from 'src/libs/state';
import { withBusyState } from 'src/libs/utils';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';

export interface UseWorkspacesStateResult {
  workspaces: WorkspaceWrapper[];
  refresh: () => Promise<void>;
  loading: boolean;
}

export type UseWorkspacesState = (
  fields?: FieldsArg,
  stringAttributeMaxLength?: string | number
) => UseWorkspacesStateResult;

const defaultFieldsArgs: FieldsArg = [
  'accessLevel',
  'public',
  'workspace',
  'workspace.attributes.description',
  'workspace.attributes.tag:tags',
  'workspace.workspaceVersion',
];

export type WorkspaceDataProviderNeeds = Pick<WorkspaceDataProvider, 'list'>;
export interface UseWorkspacesDeps {
  workspaceProvider: WorkspaceDataProviderNeeds;

  // TODO: add eventReporter dependency to decouple (notification) errors, warnings, success/info
  // so we can remove assumption of withErrorHandling --> --> notify() flow in terra-ui for other teams
}

export const makeUseWorkspaces = (deps: UseWorkspacesDeps): UseWorkspacesState => {
  const useWorkspacesHook: UseWorkspacesState = (
    fieldsArg?: FieldsArg,
    stringAttributeMaxLength?: string | number
  ): UseWorkspacesStateResult => {
    const { workspaceProvider } = deps;
    const signal = useCancellation();
    const [loading, setLoading] = useState<boolean>(false);
    const workspaces = useStore(workspacesStore);
    const fields: FieldsArg = fieldsArg || defaultFieldsArgs;

    const refresh = withHandlers(
      [withErrorReporting('Error loading workspace list'), withBusyState(setLoading)],
      async () => {
        const ws = await workspaceProvider.list(fields, { stringAttributeMaxLength, signal });
        workspacesStore.set(ws);
      }
    );
    useOnMount(() => {
      refresh();
    });
    return { workspaces, refresh, loading };
  };
  return useWorkspacesHook;
};
