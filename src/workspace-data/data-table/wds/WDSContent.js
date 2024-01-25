import { Fragment, useState } from 'react';
import { h } from 'react-hyperscript-helpers';
import { wdsToEntityServiceMetadata } from 'src/libs/ajax/data-table-providers/WdsDataTableProvider';
import colors from 'src/libs/colors';

import DataTable from '../shared/DataTable';

const WDSContent = ({
  workspace,
  workspace: {
    workspace: { namespace, name, googleProject },
  },
  recordType,
  wdsSchema,
  dataProvider,
  editable,
}) => {
  // State
  const [refreshKey] = useState(0);

  // Render
  const [entityMetadata, setEntityMetadata] = useState(() => wdsToEntityServiceMetadata(wdsSchema));

  return h(Fragment, [
    h(DataTable, {
      dataProvider,
      persist: true,
      refreshKey,
      editable,
      entityType: recordType,
      activeCrossTableTextFilter: false,
      entityMetadata,
      googleProject,
      workspaceId: { namespace, name },
      workspace,
      snapshotName: undefined,
      selectionModel: {
        selected: [],
        setSelected: () => [],
      },
      setEntityMetadata,
      childrenBefore: undefined,
      enableSearch: false,
      controlPanelStyle: {
        background: colors.light(1),
        borderBottom: `1px solid ${colors.grey(0.4)}`,
      },
      border: false,
    }),
  ]);
};

export default WDSContent;
