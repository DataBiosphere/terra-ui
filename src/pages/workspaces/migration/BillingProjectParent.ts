import _ from 'lodash/fp';
import { ReactNode } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import Collapse from 'src/components/Collapse';
import colors from 'src/libs/colors';
import { BillingProjectMigrationInfo } from 'src/pages/workspaces/migration/migration-utils';
import { WorkspaceItem } from 'src/pages/workspaces/migration/WorkspaceItem';

interface BillingProjectParentProps {
  billingProjectMigrationInfo: BillingProjectMigrationInfo;
}

export const BillingProjectParent = (props: BillingProjectParentProps): ReactNode => {
  return div({ role: 'listitem' }, [
    h(
      Collapse,
      {
        summaryStyle: { height: 60, padding: '1.5rem', fontWeight: 600 },
        titleFirst: true,
        style: {
          fontSize: 14,
          margin: '10px 15px',
          borderBottom: `1px solid ${colors.dark(0.2)}`,
          borderRadius: 5,
          background: 'white',
        },
        title: div({}, [props.billingProjectMigrationInfo.namespace]),
        initialOpenState: true,
      },
      _.map(
        (workspaceMigrationInfo) => h(WorkspaceItem, { workspaceMigrationInfo }),
        props.billingProjectMigrationInfo.workspaces
      )
    ),
  ]);
};