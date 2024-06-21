import _ from 'lodash/fp';
import { getAppStatusForDisplay } from 'src/analysis/utils/app-utils';
import { getDisplayRuntimeStatus } from 'src/analysis/utils/runtime-utils';
import { App, isApp } from 'src/libs/ajax/leonardo/models/app-models';
import { isRuntime, Runtime } from 'src/libs/ajax/leonardo/models/runtime-models';
import { isPersistentDisk, PersistentDisk } from 'src/libs/ajax/leonardo/providers/LeoDiskProvider';
import * as Utils from 'src/libs/utils';

/**
 * 'Deletable' and 'Pausable' statuses are defined in a resource's respective model in Leonardo repo:
 * https://github.com/DataBiosphere/leonardo/blob/3339ae218b4258f704702475be1431b48a5e2932/core/src/main/scala/org/broadinstitute/dsde/workbench/leonardo/runtimeModels.scala
 * https://github.com/DataBiosphere/leonardo/blob/706a7504420ea4bec686d4f761455e8502b2ddf1/core/src/main/scala/org/broadinstitute/dsde/workbench/leonardo/kubernetesModels.scala
 * https://github.com/DataBiosphere/leonardo/blob/e60c71a9e78b53196c2848cd22a752e22a2cf6f5/core/src/main/scala/org/broadinstitute/dsde/workbench/leonardo/diskModels.scala
 */
export const isResourceDeletable = (resource: App | PersistentDisk | Runtime) =>
  _.includes(
    _.lowerCase(resource?.status),
    Utils.cond(
      [isApp(resource), () => ['unspecified', 'running', 'error']],
      [isRuntime(resource), () => ['unknown', 'running', 'updating', 'error', 'stopping', 'stopped', 'starting']],
      [isPersistentDisk(resource), () => ['failed', 'ready']],
      [
        Utils.DEFAULT,
        () => {
          console.error('Cannot determine deletability; resource type must be one of runtime, app or disk.');
          return undefined;
        },
      ]
    )
  );

export interface ComputeWithCreator {
  auditInfo: { creator: string };
}
export const getCreatorForCompute = (compute: ComputeWithCreator): string => compute?.auditInfo?.creator;

export const getDisplayStatus = (compute: Runtime | App): string => {
  if (isApp(compute)) {
    return getAppStatusForDisplay(compute.status);
  }
  if (isRuntime(compute)) {
    return getDisplayRuntimeStatus(compute.status);
  }
  throw Error('unimplemented compute type detected');
};
