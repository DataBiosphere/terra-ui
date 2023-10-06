import _ from 'lodash/fp';
import { ReactNode, useEffect, useState } from 'react';
import { div, h, h2, span } from 'react-hyperscript-helpers';
import { spinner } from 'src/components/icons';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { reportErrorAndRethrow } from 'src/libs/error';
import { useCancellation } from 'src/libs/react-utils';
import * as Utils from 'src/libs/utils';
import { BillingProjectParent } from 'src/pages/workspaces/migration/BillingProjectParent';
import { BillingProjectMigrationInfo, parseServerResponse } from 'src/pages/workspaces/migration/migration-utils';

export const BillingProjectList = (): ReactNode => {
  const [loadingMigrationInformation, setLoadingMigrationInformation] = useState(true);
  const [billingProjectWorkspaces, setBillingProjectWorkspaces] = useState<BillingProjectMigrationInfo[]>([]);
  const signal = useCancellation();
  const fontSize = 16;

  useEffect(() => {
    const loadWorkspaces = _.flow(
      reportErrorAndRethrow('Error loading workspace migration information'),
      Utils.withBusyState(setLoadingMigrationInformation)
    )(async () => {
      const migrationResponse = await Ajax(signal).Workspaces.bucketMigration();
      setBillingProjectWorkspaces(parseServerResponse(migrationResponse));
    });
    loadWorkspaces();
  }, [setBillingProjectWorkspaces, signal]);

  return div({ style: { padding: '10px', backgroundColor: colors.light(), flexGrow: 1 } }, [
    h2({ style: { fontSize, marginLeft: '1.0rem' } }, ['Billing Projects']),
    loadingMigrationInformation &&
      div({ style: { display: 'flex', alignItems: 'center', marginLeft: '1.0rem' } }, [
        spinner({ size: 36 }),
        span({ style: { fontSize, marginLeft: '0.5rem', marginTop: '0.5rem', fontStyle: 'italic' } }, [
          'Fetching billing projects',
        ]),
      ]),
    div({ role: 'list' }, [
      !loadingMigrationInformation &&
        billingProjectWorkspaces.length === 0 &&
        div({ style: { fontSize, marginTop: '1.5rem', marginLeft: '1.5rem' } }, ['You have no workspaces to migrate']),
      ..._.map(
        (billingProjectMigrationInfo) => h(BillingProjectParent, { billingProjectMigrationInfo }),
        billingProjectWorkspaces
      ),
    ]),
  ]);
};
