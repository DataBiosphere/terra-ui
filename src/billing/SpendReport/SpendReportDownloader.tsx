import { Icon } from '@terra-ui-packages/components';
import _ from 'lodash';
import React from 'react';
import { MenuButton } from 'src/components/MenuButton';
import { MenuTrigger } from 'src/components/PopupTrigger';
import { WorkspaceInfo } from 'src/libs/ajax/workspaces/workspace-models';

interface SpendReportDownloaderProps {
  title?: string;
  filteredOwnedWorkspaces: WorkspaceInfo[];
  style?: React.CSSProperties;
}

export const SpendReportDownloader: React.FC<SpendReportDownloaderProps> = ({
  title = 'Spend Report',
  filteredOwnedWorkspaces,
  style,
}) => {
  const downloadWorkspacesReport = (format: 'csv' | 'tsv') => {
    const delimiter = format === 'csv' ? ',' : '\t';
    const headers = [
      'Billing Project',
      'Workspace Name',
      'Google Project ID',
      'Total Spend',
      'Total Compute',
      'Total Storage',
      'Total Other',
      'Created By',
      'Last Modified Date',
    ];
    const rows = filteredOwnedWorkspaces.map((ws: WorkspaceInfo) => [
      ws.namespace,
      ws.name,
      ws.googleProject,
      ws.totalSpend,
      ws.totalCompute,
      ws.totalStorage,
      ws.otherSpend ?? 'N/A',
      ws.createdBy,
      ws.lastModified ? new Date(ws.lastModified).toLocaleDateString() : 'N/A',
    ]);
    const content = [headers, ...rows]
      .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(delimiter))
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ ...style }}>
      <MenuTrigger
        side='bottom'
        closeOnClick
        content={
          <>
            <MenuButton onClick={() => downloadWorkspacesReport('csv')}>CSV</MenuButton>
            <MenuButton onClick={() => downloadWorkspacesReport('tsv')}>TSV</MenuButton>
          </>
        }
      >
        <button
          type='button'
          style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}
          disabled={_.isEmpty(filteredOwnedWorkspaces)}
        >
          {Icon({ icon: 'download' })} Download Report
        </button>
      </MenuTrigger>
    </div>
  );
};
