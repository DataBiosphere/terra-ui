import { LoadedState, withHandlers } from '@terra-ui-packages/core-utils';
import { useEffect, useState } from 'react';
import { ComputeImageProvider } from 'src/libs/ajax/compute-image-providers/ComputeImageProvider';
import { withErrorReporting } from 'src/libs/error';
import { useCancellation, useStore } from 'src/libs/react-utils';
import { workspaceStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';

/**
 * Refers to a docker image of a Terra VM.
 * Sample response:
     {
        "id": "terra-jupyter-bioconductor",
        "image": "us.gcr.io/broad-dsp-gcr-public/terra-jupyter-bioconductor:2.2.1",
        "label": "R / Bioconductor: (Python 3.10.11, R 4.3.1, Bioconductor 3.17, tidyverse 2.0.0)",
        "packages": "https://storage.googleapis.com/terra-docker-image-documentation/terra-jupyter-bioconductor-2.2.1-versions.json",
        "requiresSpark": false,
        "updated": "2023-07-13",
        "version": "2.2.1"
    },
 */
export interface ComputeImage {
  id: string;
  image: string;
  isCommunity?: boolean;
  isRStudio?: boolean;
  label: string;
  packages: string;
  requiresSpark: boolean;
  updated: string;
  version: string;
}

export interface ComputeImageStore {
  refreshStore: () => Promise<void>;
  loadedState: LoadedState<ComputeImage[], unknown>;
}

export const useComputeImages = (): ComputeImageStore => {
  const signal = useCancellation();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<ComputeImage[]>([]);
  const workspace: WorkspaceWrapper = useStore<WorkspaceWrapper>(workspaceStore);

  const refresh = withHandlers(
    [withErrorReporting('Error loading compute images'), Utils.withBusyState(setLoading)],
    async (): Promise<void> => {
      const loadedImages = await ComputeImageProvider.listImages(workspace.workspace.googleProject, signal);
      setImages(loadedImages);
    }
  );

  useEffect(() => {
    refresh();
  }, [workspace.workspace]); // eslint-disable-line react-hooks/exhaustive-deps
  // refresh depends only on workspace.workspace, do not want to refresh on workspace.workspaceInitialized

  return {
    refreshStore: refresh,
    loadedState: { status: loading ? 'Loading' : 'Ready', state: images },
  };
};
