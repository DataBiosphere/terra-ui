import { CSSProperties, ReactNode } from 'react';
import { div, h, h2 } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import colors from 'src/libs/colors';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';

import { ImportRequest } from './import-types';
import { isProtectedSource } from './protected-data-utils';

const styles = {
  container: {
    display: 'flex',
    alignItems: 'flex-start',
    flex: 'auto',
    position: 'relative',
    padding: '2rem',
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    color: colors.dark(),
    margin: '0 0 1rem 0',
  },
  card: {
    borderRadius: 5,
    backgroundColor: 'white',
    padding: '2rem',
    flex: 1,
    minWidth: 0,
    boxShadow: Style.standardShadow,
  },
} as const satisfies Record<string, CSSProperties>;

const getTitleForImportRequest = (importRequest: ImportRequest): string => {
  switch (importRequest.type) {
    case 'tdr-snapshot-export':
      return `Importing snapshot ${importRequest.snapshot.name}`;
    case 'tdr-snapshot-reference':
    case 'catalog-dataset':
      return 'Linking data to a workspace';
    default:
      return 'Importing data to a workspace';
  }
};

export interface ImportDataOverviewProps {
  importRequest: ImportRequest;
}

export const ImportDataOverview = (props: ImportDataOverviewProps): ReactNode => {
  const { importRequest } = props;

  const isProtectedData = isProtectedSource(importRequest);

  return div({ style: styles.card }, [
    h2({ style: styles.title }, [getTitleForImportRequest(importRequest)]),
    'url' in importRequest && div({ style: { fontSize: 16 } }, ['From: ', importRequest.url.hostname]),
    div(
      { style: { marginTop: '1rem' } },
      isProtectedData
        ? [
            icon('warning-standard', { size: 15, style: { marginRight: '0.25rem' }, color: colors.warning() }),
            ' The data you chose to import to Terra are identified as protected and require additional security settings. Please select a workspace that has an Authorization Domain and/or protected data setting.',
            h(
              Link,
              {
                style: { marginLeft: '1rem', verticalAlign: 'middle' },
                href: 'https://support.terra.bio/hc/en-us/articles/360026775691-Overview-Managing-access-to-controlled-data-with-Authorization-Domains',
                ...Utils.newTabLinkProps,
              },
              ['Learn more about protected data', icon('pop-out', { size: 12 })]
            ),
          ]
        : [
            'The data you just chose to import to Terra will be made available to you within a workspace of your choice where you can then perform analysis.',
          ]
    ),
  ]);
};
