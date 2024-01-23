import _ from 'lodash/fp';
import { ReactNode } from 'react';
import { h } from 'react-hyperscript-helpers';
import { isResourceDeletable } from 'src/analysis/utils/resource-utils';
import { getDisplayRuntimeStatus } from 'src/analysis/utils/runtime-utils';
import { cromwellAppToolLabels } from 'src/analysis/utils/tool-utils';
import { Link } from 'src/components/common';
import { makeMenuIcon } from 'src/components/PopupTrigger';
import { isApp } from 'src/libs/ajax/leonardo/models/app-models';
import { LeoRuntimeStatus } from 'src/libs/ajax/leonardo/models/runtime-models';
import * as Utils from 'src/libs/utils';
import { makeCromwellAppsNotDeletable } from 'src/pages/EnvironmentsPage/environmentsPermissions';

import { DecoratedComputeResource } from './Environments.models';

export interface DeleteButtonProps {
  resource: DecoratedComputeResource;
  onClick: (resource: DecoratedComputeResource) => void;
}

export const DeleteButton = (props: DeleteButtonProps): ReactNode => {
  const { resource, onClick } = props;
  const resourceType = isApp(resource) ? 'app' : 'runtime';
  const appsToDelete = makeCromwellAppsNotDeletable();
  const isDeletable = appsToDelete.canBeDeleted(resource) && isResourceDeletable(resourceType, resource);

  return h(
    Link,
    {
      disabled: !isDeletable,
      tooltip: Utils.cond(
        [isDeletable, () => 'Delete cloud environment'],
        [Object.keys(cromwellAppToolLabels).includes(resource.appType), () => 'Deleting not yet supported'],
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
