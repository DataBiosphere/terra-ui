import { Ajax } from 'src/libs/ajax';
import { AbortOption } from 'src/libs/ajax/data-provider-common';
import { WorkspaceWrapper } from 'src/workspaces/utils';

export type FieldsArg = string[];
export type WorkspaceListOptions = AbortOption & {
  stringAttributeMaxLength?: number;
};

// TODO: grow this interface to include more of the available data verbs
export interface WorkspaceDataProvider {
  list: (fieldsArgs: FieldsArg, options: WorkspaceListOptions) => Promise<WorkspaceWrapper[]>;
}

export const workspaceProvider: WorkspaceDataProvider = {
  list: async (fieldsArgs: FieldsArg, options: WorkspaceListOptions): Promise<WorkspaceWrapper[]> => {
    const { signal, stringAttributeMaxLength } = options;

    const ws = await Ajax(signal).Workspaces.list(fieldsArgs, stringAttributeMaxLength);
    return ws;
  },
};
