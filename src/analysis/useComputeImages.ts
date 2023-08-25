import { LoadedState } from '@terra-ui-packages/core-utils';
import { useEffect } from 'react';
import { RuntimeToolLabel } from 'src/analysis/utils/tool-utils';
import { ComputeImageProvider } from 'src/libs/ajax/compute-image-providers/ComputeImageProvider';
import { useLoadedData } from 'src/libs/ajax/loaded-data/useLoadedData';
import { useCancellation, useStore } from 'src/libs/react-utils';
import { workspaceStore } from 'src/libs/state';
import { isGoogleWorkspaceInfo, WorkspaceInfo, WorkspaceWrapper } from 'src/libs/workspace-utils';

export interface ComputeImage {
  id: string;
  url: string;
  isCommunity: boolean;
  isRStudio: boolean;
  isTerraSupported: boolean;
  toolLabel?: RuntimeToolLabel;
  label: string;
  packages: string;
  requiresSpark: boolean;
  updated: string;
  version: string;
}

export interface ComputeImageStore {
  refresh: () => void;
  loadedState: LoadedState<ComputeImage[], unknown>;
}

export const useComputeImages = (): ComputeImageStore => {
  const signal = useCancellation();
  const workspace: WorkspaceWrapper = useStore<WorkspaceWrapper>(workspaceStore);
  const [loadedState, setLoadedState] = useLoadedData<ComputeImage[]>({
    onError: (state) => {
      // We can't rely on the formatting of the error, so show a generic message but include the error in the console for debugging purposes.
      if (state.error instanceof Response) {
        state.error.text().then(console.error);
      } else {
        console.error(state.error);
      }
    },
  });

  const doRefresh = async (): Promise<void> => {
    await setLoadedState(async () => {
      const workspaceInfo: WorkspaceInfo = workspace.workspace;
      if (isGoogleWorkspaceInfo(workspaceInfo)) {
        const loadedImages: ComputeImage[] = await ComputeImageProvider.listImages(workspaceInfo.googleProject, signal);
        return loadedImages;
      }
      throw Error('Compute images are only configured for GCP workspaces');
    });
  };

  useEffect(() => {
    if (workspace?.workspace) {
      doRefresh();
    }
  }, [workspace?.workspace]); // eslint-disable-line react-hooks/exhaustive-deps
  // refresh depends only on workspace.workspace, do not want to refresh on workspace.workspaceInitialized

  return {
    refresh: (): void => {
      void doRefresh();
    },
    loadedState,
  };
};
