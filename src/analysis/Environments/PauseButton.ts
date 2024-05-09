import _ from 'lodash/fp';
import { ReactNode } from 'react';
import { h } from 'react-hyperscript-helpers';
import { getDisplayStatus } from 'src/analysis/utils/resource-utils';
import { getToolLabelFromCloudEnv, isPauseSupported } from 'src/analysis/utils/tool-utils';
import { Link } from 'src/components/common';
import { makeMenuIcon } from 'src/components/PopupTrigger';
import { App, appStatuses, isApp, LeoAppStatus } from 'src/libs/ajax/leonardo/models/app-models';
import {
  isRuntime,
  LeoRuntimeStatus,
  ListRuntimeItem,
  Runtime,
  runtimeStatuses,
} from 'src/libs/ajax/leonardo/models/runtime-models';
import * as Utils from 'src/libs/utils';

import { LeoResourcePermissionsProvider } from './Environments.models';

type PausePermissionsProvider = Pick<LeoResourcePermissionsProvider, 'hasPausePermission'>;

export interface PauseButtonProps {
  cloudEnvironment: App | ListRuntimeItem;
  permissions: PausePermissionsProvider;
  pauseComputeAndRefresh: (cloudEnvironment: App | ListRuntimeItem) => void;
}

export const PauseButton = (props: PauseButtonProps): ReactNode => {
  const { cloudEnvironment, permissions, pauseComputeAndRefresh } = props;
  const shouldShowPauseButton =
    isPauseSupported(getToolLabelFromCloudEnv(cloudEnvironment)) && permissions.hasPausePermission(cloudEnvironment);

  return shouldShowPauseButton
    ? h(
        Link,
        {
          style: { marginRight: '1rem' },
          disabled: !isComputePausable(cloudEnvironment),
          tooltip: isComputePausable(cloudEnvironment)
            ? 'Pause cloud environment'
            : `Cannot pause a cloud environment while in status ${getDisplayStatus(cloudEnvironment)}.`,
          onClick: () => pauseComputeAndRefresh(cloudEnvironment),
        },
        [makeMenuIcon('pause'), 'Pause']
      )
    : null;
};

export const pauseableRuntimeStatuses: LeoRuntimeStatus[] = [
  runtimeStatuses.running.leoLabel,
  runtimeStatuses.updating.leoLabel,
  runtimeStatuses.starting.leoLabel,
];

export const pauseableAppStatuses: LeoAppStatus[] = [appStatuses.running.status, appStatuses.starting.status];

export const isComputePausable = (compute: App | Runtime): boolean =>
  Utils.cond(
    [isRuntime(compute), () => _.includes(_.capitalize(compute.status), pauseableRuntimeStatuses)],
    [isApp(compute), () => _.includes(_.upperCase(compute.status), pauseableAppStatuses)],
    [
      Utils.DEFAULT,
      () => {
        console.error(`Cannot determine pausability; compute ${compute} must be runtime or app.`);
        return false;
      },
    ]
  );
