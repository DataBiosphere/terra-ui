import { isGcpContext } from 'src/analysis/utils/runtime-utils';
import { Ajax } from 'src/libs/ajax';
import { ListRuntimeItem, Runtime } from 'src/libs/ajax/leonardo/models/runtime-models';
import { RuntimeWrapper } from 'src/libs/ajax/leonardo/Runtimes';

export type RuntimeBasics = Pick<Runtime, 'runtimeName' | 'googleProject' | 'cloudContext'>;

export interface LeoRuntimeProvider {
  list: (listArgs: Record<string, string>, signal?: AbortSignal) => Promise<ListRuntimeItem[]>;
  stop: (runtime: RuntimeWrapper) => Promise<void>;
  delete: (runtime: Runtime, workspaceId: string, deleteDisk: boolean) => Promise<void>;
}

export const leoRuntimeProvider: LeoRuntimeProvider = {
  list: (listArgs: Record<string, string>, signal?: AbortSignal): Promise<ListRuntimeItem[]> => {
    return Ajax(signal).Runtimes.listV2(listArgs);
  },
  stop: (runtime: RuntimeWrapper, signal?: AbortSignal): Promise<void> => {
    return Ajax(signal).Runtimes.runtimeWrapper(runtime).stop();
  },
  delete: (runtime: RuntimeBasics, workspaceId: string, deleteDisk: boolean): Promise<void> => {
    const { cloudContext, googleProject, runtimeName } = runtime;
    if (isGcpContext(cloudContext)) {
      return Ajax().Runtimes.runtime(googleProject, runtimeName).delete(deleteDisk);
    }
    return Ajax().Runtimes.runtimeV2(workspaceId, runtimeName).delete(deleteDisk);
  },
};
