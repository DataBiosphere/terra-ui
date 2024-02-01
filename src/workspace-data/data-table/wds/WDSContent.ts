import { Fragment, useState } from 'react';
import { h } from 'react-hyperscript-helpers';
import { DataTableProvider } from 'src/libs/ajax/data-table-providers/DataTableProvider';
import { RecordTypeSchema, wdsToEntityServiceMetadata } from 'src/libs/ajax/data-table-providers/WdsDataTableProvider';
import colors from 'src/libs/colors';
import { isGoogleWorkspace, WorkspaceWrapper as Workspace } from 'src/libs/workspace-utils';

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
  workspace: {
    workspace: { namespace, name },
  },
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
      loadMetadata,
    }),
  ]);
};

export default WDSContent;
