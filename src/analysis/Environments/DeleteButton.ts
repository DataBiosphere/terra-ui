import _ from 'lodash/fp';
import { ReactNode } from 'react';
import { h } from 'react-hyperscript-helpers';
import { getDisplayRuntimeStatus } from 'src/analysis/utils/runtime-utils';
import { Link } from 'src/components/common';
import { makeMenuIcon } from 'src/components/PopupTrigger';
import { isApp } from 'src/libs/ajax/leonardo/models/app-models';
import { LeoRuntimeStatus } from 'src/libs/ajax/leonardo/models/runtime-models';
import * as Utils from 'src/libs/utils';

import { DecoratedComputeResource, LeoResourcePermissionsProvider } from './Environments.models';

type DeletePermissionsProvider = Pick<LeoResourcePermissionsProvider, 'canDeleteApp' | 'canDeleteResource'>;

export interface DeleteButtonProps {
  resource: DecoratedComputeResource;
  permissions: DeletePermissionsProvider;
  onClick: (resource: DecoratedComputeResource) => void;
}

export const DeleteButton = (props: DeleteButtonProps): ReactNode => {
  const { resource, permissions, onClick } = props;
  const isDeletable = isApp(resource) ? permissions.canDeleteApp(resource) : permissions.canDeleteResource(resource);

  return h(
    Link,
    {
      disabled: !isDeletable,
      tooltip: Utils.cond(
        [isDeletable, () => 'Delete cloud environment'],
        [isApp(resource) && !permissions.canDeleteApp(resource), () => 'Deleting not yet supported'],
        [
          Utils.DEFAULT,
          () =>
            `Cannot delete a cloud environment while in status ${_.upperCase(
              getDisplayRuntimeStatus(resource.status as LeoRuntimeStatus)
            )}.`,
        ]
      ),
      onClick: () => onClick(resource),
    },
    [makeMenuIcon('trash', undefined), 'Delete']
  );
};
