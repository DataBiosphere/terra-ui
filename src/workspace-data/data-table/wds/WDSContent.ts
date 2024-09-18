import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { ButtonSecondary } from 'src/components/common';
import { icon } from 'src/components/icons';
import { MenuButton } from 'src/components/MenuButton';
import { MenuTrigger } from 'src/components/PopupTrigger';
import { DataTableProvider } from 'src/libs/ajax/data-table-providers/DataTableProvider';
import { RecordTypeSchema, wdsToEntityServiceMetadata } from 'src/libs/ajax/data-table-providers/WdsDataTableProvider';
import colors from 'src/libs/colors';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { isGoogleWorkspace, WorkspaceWrapper as Workspace } from 'src/workspaces/utils';
import * as WorkspaceUtils from 'src/workspaces/utils';

import DataTable from '../shared/DataTable';
import { RecordDeleter } from './RecordDeleter';

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
    workspace: { workspaceId },
    workspaceSubmissionStats: { runningSubmissionsCount },
  },
  recordType,
  wdsSchema,
  dataProvider,
  editable,
  loadMetadata,
}: WDSContentProps) => {
  const googleProject = isGoogleWorkspace(workspace) ? workspace.workspace.googleProject : undefined;
  // State
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedRecords, setSelectedRecords] = useState({});
  const [deletingRecords, setDeletingRecords] = useState(false);

  // Render
  const [entityMetadata, setEntityMetadata] = useState(() => wdsToEntityServiceMetadata(wdsSchema));

  const entitiesSelected = !_.isEmpty(selectedRecords);

  // TODO: This is a (mostly) copy/paste from the EntitiesContent component.
  //       should it be abstracted into its own component or shared function?
  const renderEditMenu = () => {
    return h(
      MenuTrigger,
      {
        side: 'bottom',
        closeOnClick: true,
        content: h(Fragment, [
          h(
            MenuButton,
            {
              disabled: !entitiesSelected,
              tooltip: !entitiesSelected && 'Select rows to delete in the table',
              onClick: () => setDeletingRecords(true),
            },
            'Delete selected rows'
          ),
        ]),
      },
      [
        h(
          ButtonSecondary,
          {
            tooltip: 'Edit data',
            ...WorkspaceUtils.getWorkspaceEditControlProps(workspace),
            style: { marginRight: '1.5rem' },
          },
          [icon('edit', { style: { marginRight: '0.5rem' } }), 'Edit']
        ),
      ]
    );
  };

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
        selected: selectedRecords,
        setSelected: setSelectedRecords,
      },
      setEntityMetadata,
      enableSearch: false,
      controlPanelStyle: {
        background: colors.light(1),
        borderBottom: `1px solid ${colors.grey(0.4)}`,
      },
      border: false,
      loadMetadata,
      childrenBefore: () => div({ style: { display: 'flex', alignItems: 'center', flex: 'none' } }, [renderEditMenu()]),
    }),
    deletingRecords &&
      h(RecordDeleter, {
        onDismiss: () => setDeletingRecords(false),
        onSuccess: () => {
          setDeletingRecords(false);
          setSelectedRecords({});
          setRefreshKey(_.add(1));
          Ajax().Metrics.captureEvent(Events.workspaceDataDelete, extractWorkspaceDetails(workspace.workspace));
          loadMetadata();
        },
        dataProvider,
        collectionId: workspaceId,
        selectedRecords,
        selectedRecordType: recordType,
        runningSubmissionsCount,
      }),
  ]);
};

export default WDSContent;
