import { CSSProperties, Fragment, ReactNode } from 'react';
import { div, h, h2, h3 } from 'react-hyperscript-helpers';
import colors from 'src/libs/colors';
import * as Style from 'src/libs/style';

import { requiresSecurityMonitoring } from './import-requirements';
import { ImportRequest } from './import-types';

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
      return `Import snapshot ${importRequest.snapshot.name}`;
    case 'tdr-snapshot-reference':
    case 'catalog-dataset':
      return 'Link data to a workspace';
    default:
      return 'Import data to a workspace';
  }
};

export interface ImportDataOverviewProps {
  importRequest: ImportRequest;
}

export const ImportDataOverview = (props: ImportDataOverviewProps): ReactNode => {
  const { importRequest } = props;

  const importRequiresSecurityMonitoring = requiresSecurityMonitoring(importRequest);

  return div({ style: styles.card }, [
    h2({ style: styles.title }, [getTitleForImportRequest(importRequest)]),
    'url' in importRequest &&
      h(Fragment, [
        h3({ style: { fontSize: 16 } }, ['Dataset source:']),
        div({ style: { marginTop: '1rem' } }, [`${importRequest.url.href.split('?')[0]}`]),
      ]),
    h3({ style: { fontSize: 16 } }, ['Dataset security requirements:']),
    div(
      { style: { marginTop: '1rem' } },
      importRequiresSecurityMonitoring
        ? ['The data you have selected requires additional security monitoring.']
        : [
            'The data you just chose to import to Terra will be made available to you within a workspace of your choice where you can then perform analysis.',
          ]
    ),
  ]);
};
