import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { isResourceDeletable } from 'src/analysis/utils/resource-utils';
import { getDisplayRuntimeStatus } from 'src/analysis/utils/runtime-utils';
import { Link } from 'src/components/common';
import { makeMenuIcon } from 'src/components/PopupTrigger';
import { isApp } from 'src/libs/ajax/leonardo/models/app-models';
import { LeoRuntimeStatus } from 'src/libs/ajax/leonardo/models/runtime-models';

import { DecoratedComputeResource } from './Environments.models';

export interface DeleteButtonProps {
  resource: DecoratedComputeResource;
  onClick: (resource: DecoratedComputeResource) => void;
}

export const DeleteButton: React.FC<DeleteButtonProps> = (props) => {
  const { resource, onClick } = props;
  const resourceType = isApp(resource) ? 'app' : 'runtime';
  const isDeletable = isResourceDeletable(resourceType, resource);

  return h(
    Link,
    {
      disabled: !isDeletable,
      tooltip: isDeletable
        ? 'Delete cloud environment'
        : `Cannot delete a cloud environment while in status ${_.upperCase(
            getDisplayRuntimeStatus(resource.status as LeoRuntimeStatus)
          )}.`,
      onClick: () => onClick(resource),
    },
    [makeMenuIcon('trash'), 'Delete']
  );
};
