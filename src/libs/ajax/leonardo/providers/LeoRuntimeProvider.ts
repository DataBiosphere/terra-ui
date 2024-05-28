import { isGcpContext } from 'src/analysis/utils/runtime-utils';
import { Ajax } from 'src/libs/ajax';
import { AbortOption } from 'src/libs/ajax/data-provider-common';
import { ListRuntimeItem, Runtime } from 'src/libs/ajax/leonardo/models/runtime-models';
import { AzureRuntimeWrapper, GoogleRuntimeWrapper, RuntimeWrapper } from 'src/libs/ajax/leonardo/Runtimes';

export type RuntimeBasics = RuntimeWrapper & Pick<Runtime, 'cloudContext'>;

export type DeleteRuntimeOptions = AbortOption & {
  deleteDisk?: boolean;
};

export interface LeoRuntimeProvider {
  list: (listArgs: Record<string, string>, options?: AbortOption) => Promise<ListRuntimeItem[]>;
  stop: (runtime: RuntimeWrapper, options?: AbortOption) => Promise<void>;
  delete: (runtime: RuntimeBasics, options?: DeleteRuntimeOptions) => Promise<void>;
}

export const leoRuntimeProvider: LeoRuntimeProvider = {
  list: (listArgs: Record<string, string>, options: AbortOption = {}): Promise<ListRuntimeItem[]> => {
    const { signal } = options;

    return Ajax(signal).Runtimes.listV2(listArgs);
  },
  stop: (runtime: RuntimeWrapper, options: AbortOption = {}): Promise<void> => {
    const { signal } = options;

    // TODO: refactor runtimeWrapper and related v1/v2 mechanics into this provider.
    // This provider largely does the same abstraction pattern that runtimeWrapper is going for.
    // We should follow-up and see about removing runtimeWrapper from Ajax.Runtimes and point all current
    // consumers to this leoRuntimeProvider instead.  Any v1/v2 (GCP/Azure) conditional logic should happen
    // here, and the Ajax layer should just be mirrors of backend endpoints.
    return Ajax(signal).Runtimes.runtimeWrapper(runtime).stop();
  },
  delete: (runtime: RuntimeBasics, options: DeleteRuntimeOptions = {}): Promise<void> => {
    const { cloudContext, runtimeName } = runtime;
    const { deleteDisk, signal } = options;

    if (isGcpContext(cloudContext)) {
      const googleProject = (runtime as GoogleRuntimeWrapper).googleProject;
      return Ajax(signal).Runtimes.runtime(googleProject, runtimeName).delete(!!deleteDisk);
    }
    const workspaceId = (runtime as AzureRuntimeWrapper).workspaceId;
    return Ajax(signal).Runtimes.runtimeV2(workspaceId, runtimeName).delete(!!deleteDisk);
  },
};
