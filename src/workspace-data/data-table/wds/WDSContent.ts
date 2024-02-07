import { Fragment, useState } from 'react';
import { h } from 'react-hyperscript-helpers';
import { DataTableProvider } from 'src/libs/ajax/data-table-providers/DataTableProvider';
import { RecordTypeSchema, wdsToEntityServiceMetadata } from 'src/libs/ajax/data-table-providers/WdsDataTableProvider';
import colors from 'src/libs/colors';
import { isGoogleWorkspace, WorkspaceWrapper as Workspace } from 'src/workspaces/utils';

import DataTable from '../shared/DataTable';

export interface WDSContentProps {
  workspace: Workspace;
  recordType: string;
  wdsSchema: RecordTypeSchema[];
  dataProvider: DataTableProvider;
  editable: boolean;
  loadMetadata: () => void;
}

export const WDSContent = ({
  workspace,
  recordType,
  wdsSchema,
  dataProvider,
  editable,
  loadMetadata,
}: WDSContentProps) => {
  const googleProject = isGoogleWorkspace(workspace) ? workspace.workspace.googleProject : undefined;
  // State
  const [refreshKey] = useState(0);

  // Render
  const [entityMetadata, setEntityMetadata] = useState(() => wdsToEntityServiceMetadata(wdsSchema));

  // dataProvider contains the proxyUrl for an instance of WDS
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
      loadMetadata,
    }),
  ]);
};

export default WDSContent;
