import { ReactNode } from 'react';
import { h } from 'react-hyperscript-helpers';
import { getDisplayStatus, isComputePausable } from 'src/analysis/utils/resource-utils';
import { getToolLabelFromCloudEnv, isPauseSupported } from 'src/analysis/utils/tool-utils';
import { Link } from 'src/components/common';
import { makeMenuIcon } from 'src/components/PopupTrigger';
import { App } from 'src/libs/ajax/leonardo/models/app-models';
import { ListRuntimeItem } from 'src/libs/ajax/leonardo/models/runtime-models';

import { LeoResourcePermissionsProvider } from './Environments.models';

type PausePermissionsProvider = Pick<LeoResourcePermissionsProvider, 'canPauseResource'>;

interface PauseButtonProps {
  cloudEnvironment: App | ListRuntimeItem;
  permissions: PausePermissionsProvider;
  pauseComputeAndRefresh: (cloudEnvironment: App | ListRuntimeItem) => void;
}

export function PauseButton(props: PauseButtonProps): ReactNode {
  const { cloudEnvironment, permissions, pauseComputeAndRefresh } = props;
  const shouldShowPauseButton =
    isPauseSupported(getToolLabelFromCloudEnv(cloudEnvironment)) && permissions.canPauseResource(cloudEnvironment);

  return shouldShowPauseButton
    ? h(
        Link,
        {
          style: { marginRight: '1rem' },
          disabled: !shouldShowPauseButton,
          tooltip: isComputePausable(cloudEnvironment)
            ? 'Pause cloud environment'
            : `Cannot pause a cloud environment while in status ${getDisplayStatus(cloudEnvironment)}.`,
          onClick: () => pauseComputeAndRefresh(cloudEnvironment),
        },
        [makeMenuIcon('pause'), 'Pause']
      )
    : null;
}
