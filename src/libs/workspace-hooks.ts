import { useEffect, useState } from 'react';
import { Ajax } from 'src/libs/ajax';
import { useCancellation } from 'src/libs/react-utils';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';

type UseWorkspaceResult =
  | {
      status: 'Loading';
      workspace: null;
    }
  | {
      status: 'Ready';
      workspace: WorkspaceWrapper;
    }
  | {
      status: 'Error';
      workspace: null;
      error: unknown;
    };

export const useWorkspaceById = (workspaceId: string, fields?: string[]): UseWorkspaceResult => {
  const [state, setState] = useState<UseWorkspaceResult>({ status: 'Loading', workspace: null });

  const signal = useCancellation();
  useEffect(
    () => {
      const loadWorkspace = async () => {
        setState({ status: 'Loading', workspace: null });
        try {
          const workspace = await Ajax(signal).Workspaces.getById(workspaceId, fields);
          setState({ status: 'Ready', workspace });
        } catch (error: unknown) {
          setState({ status: 'Error', workspace: null, error });
        }
      };
      loadWorkspace();
    },
    // Since fields is an array and will likely be defined inline (recreated on each render),
    // we can't use it directly in the dependencies list. Instead, using a joined list of the
    // fields provides the behavior we want, rerunning the effect when the fields change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [signal, workspaceId, (fields || []).join(',')]
  );

  return state;
};
