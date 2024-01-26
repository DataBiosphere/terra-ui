import { Fragment, useState } from 'react';
import { h } from 'react-hyperscript-helpers';
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
}) => {
  // State
  const [refreshKey] = useState(0);

  // Render
  const [entityMetadata, setEntityMetadata] = useState(() => wdsSchema);

  const id = workspace.workspace.workspaceId;
  // dataProvider contains the proxyUrl for an instance of WDS
  return h(Fragment, [
    h(DataTable, {
      dataProvider,
      persist: true,
      refreshKey,
      editable: true,
      entityType: recordType,
      activeCrossTableTextFilter: false,
      entityMetadata,
      googleProject,
      workspaceId: { namespace, name, id },
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
