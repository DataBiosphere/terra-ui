import { CSSProperties, Fragment, ReactNode } from 'react';
import { div, h, h2, h3, span } from 'react-hyperscript-helpers';
import colors from 'src/libs/colors';
import * as Style from 'src/libs/style';

import { formatEstimatedImportTime, useFileSize } from './import-time-estimate';
import { ImportRequest } from './import-types';
import { ImportRequirements } from './ImportRequirements';

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
    overflowWrap: 'break-word',
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
    default:
      return 'Import data to a workspace';
  }
};

export interface ImportDataOverviewProps {
  importRequest: ImportRequest;
}

export const ImportDataOverview = (props: ImportDataOverviewProps): ReactNode => {
  const { importRequest } = props;

  const getDisplayUrl = (url: string) => url.replace(/^https?:\/\//, '').split('?')[0];

  const url = 'url' in importRequest ? importRequest.url.href : undefined;
  const fileSize = useFileSize(url);

  return div({ style: styles.card }, [
    h2({ style: styles.title }, [getTitleForImportRequest(importRequest)]),
    url &&
      h(Fragment, [
        h3({ style: { fontSize: 16, marginBottom: 2 } }, ['Dataset source:']),
        div(
          {
            style: {
              fontSize: 13,
              color: colors.dark(0.7),
              marginBottom: 8,
              marginTop: 0,
            },
          },
          ['(For reference only — not a direct link)']
        ),
        div(
          {
            style: {
              marginTop: '1rem',
              marginBottom: '0.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'baseline',
              columnGap: '1ch',
              color: fileSize.status === 'Ready' && fileSize.oversized  ? colors.danger() : undefined,
            },
          },
          [
            span([getDisplayUrl(url)]),
            fileSize.status === 'Ready' &&
              span([formatEstimatedImportTime(fileSize.bytes), fileSize.oversized && ' (Exceeds recommended size limit)']),
          ]
        ),
      ]),
    h(ImportRequirements, { importRequest }),
  ]);
};
