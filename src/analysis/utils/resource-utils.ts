import _ from 'lodash/fp';
import { getAppStatusForDisplay } from 'src/analysis/utils/app-utils';
import { getDisplayRuntimeStatus } from 'src/analysis/utils/runtime-utils';
import { App, isApp } from 'src/libs/ajax/leonardo/models/app-models';
import { PersistentDisk } from 'src/libs/ajax/leonardo/models/disk-models';
import { isRuntime, Runtime, runtimeStatuses } from 'src/libs/ajax/leonardo/models/runtime-models';
import * as Utils from 'src/libs/utils';

/**
 * 'Deletable' and 'Pausable' statuses are defined in a resource's respective model in Leonardo repo:
 * https://github.com/DataBiosphere/leonardo/blob/3339ae218b4258f704702475be1431b48a5e2932/core/src/main/scala/org/broadinstitute/dsde/workbench/leonardo/runtimeModels.scala
 * https://github.com/DataBiosphere/leonardo/blob/706a7504420ea4bec686d4f761455e8502b2ddf1/core/src/main/scala/org/broadinstitute/dsde/workbench/leonardo/kubernetesModels.scala
 * https://github.com/DataBiosphere/leonardo/blob/e60c71a9e78b53196c2848cd22a752e22a2cf6f5/core/src/main/scala/org/broadinstitute/dsde/workbench/leonardo/diskModels.scala
 */
// TODO: stop using resourceType here when all types are defined....
export const isResourceDeletable = (resourceType, resource: App | PersistentDisk | Runtime) =>
  _.includes(
    _.lowerCase(resource?.status),
    Utils.switchCase(
      resourceType,
      ['runtime', () => ['unknown', 'running', 'updating', 'error', 'stopping', 'stopped', 'starting']],
      ['app', () => ['unspecified', 'running', 'error']],
      ['disk', () => ['failed', 'ready']],
      [
        Utils.DEFAULT,
        () => {
          console.error(
            `Cannot determine deletability; resource type ${resourceType} must be one of runtime, app or disk.`
          );
          return undefined;
        },
      ]
    )
  );
export const isComputePausable = (compute: App | Runtime): boolean =>
  Utils.cond(
    [
      isRuntime(compute),
      () =>
        _.includes(_.capitalize(compute.status), [
          runtimeStatuses.running.leoLabel,
          runtimeStatuses.updating.leoLabel,
          runtimeStatuses.starting.leoLabel,
        ]),
    ],
    [isApp(compute), () => _.includes(_.capitalize(compute.status), ['Running', 'Starting'])],
    [Utils.DEFAULT, () => console.error(`Cannot determine pausability; compute ${compute} must be runtime or app.`)]
  );

export const getCreatorForCompute = (compute: Runtime | App): string => compute?.auditInfo?.creator;

export const getDisplayStatus = (compute: Runtime | App): string => {
  if (isApp(compute)) {
    return getAppStatusForDisplay(compute.status);
  }
  if (isRuntime(compute)) {
    return getDisplayRuntimeStatus(compute.status);
  }
  throw Error('unimplemented compute type detected');
};
