import { isGcpContext } from 'src/analysis/utils/runtime-utils';
import { Ajax } from 'src/libs/ajax';
import { ListRuntimeItem, Runtime } from 'src/libs/ajax/leonardo/models/runtime-models';
import { AzureRuntimeWrapper, GoogleRuntimeWrapper, RuntimeWrapper } from 'src/libs/ajax/leonardo/Runtimes';

export type RuntimeBasics = RuntimeWrapper & Pick<Runtime, 'cloudContext'>;

export interface LeoRuntimeProvider {
  list: (listArgs: Record<string, string>, signal?: AbortSignal) => Promise<ListRuntimeItem[]>;
  stop: (runtime: RuntimeWrapper, signal?: AbortSignal) => Promise<void>;
  delete: (runtime: RuntimeBasics, deleteDisk: boolean, signal?: AbortSignal) => Promise<void>;
}

export const leoRuntimeProvider: LeoRuntimeProvider = {
  list: (listArgs: Record<string, string>, signal?: AbortSignal): Promise<ListRuntimeItem[]> => {
    return Ajax(signal).Runtimes.listV2(listArgs);
  },
  stop: (runtime: RuntimeWrapper, signal?: AbortSignal): Promise<void> => {
    return Ajax(signal).Runtimes.runtimeWrapper(runtime).stop();
  },
  delete: (runtime: RuntimeBasics, deleteDisk: boolean, signal?: AbortSignal): Promise<void> => {
    const { cloudContext, runtimeName } = runtime;
    if (isGcpContext(cloudContext)) {
      const googleProject = (runtime as GoogleRuntimeWrapper).googleProject;
      return Ajax(signal).Runtimes.runtime(googleProject, runtimeName).delete(deleteDisk);
    }
    const workspaceId = (runtime as AzureRuntimeWrapper).workspaceId;
    return Ajax(signal).Runtimes.runtimeV2(workspaceId, runtimeName).delete(deleteDisk);
  },
};
