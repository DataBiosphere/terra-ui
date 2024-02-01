import { h } from 'react-hyperscript-helpers';
import { spinnerOverlay } from 'src/components/common';
import * as Utils from 'src/libs/utils';

import EntitiesContent from './EntitiesContent';
import { SnapshotInfo } from './SnapshotInfo';

export const SnapshotContent = ({ workspace, snapshotDetails, loadMetadata, onUpdate, onDelete, snapshotName, tableName }) => {
  return Utils.cond(
    [!snapshotDetails?.[snapshotName], () => spinnerOverlay],
    [
      !!tableName,
      () =>
        h(EntitiesContent, {
          snapshotName,
          workspace,
          entityMetadata: snapshotDetails[snapshotName].entityMetadata,
          setEntityMetadata: () => {},
          entityKey: tableName,
          loadMetadata,
          editable: false, // snapshot data isn't ever editable
        }),
    ],
    () => h(SnapshotInfo, { workspace, resource: snapshotDetails[snapshotName].resource, snapshotName, onUpdate, onDelete })
  );
};
