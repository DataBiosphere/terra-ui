import { IconId } from '@terra-ui-packages/components';
import { DEFAULT, switchCase } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import { CSSProperties, Fragment, ReactNode } from 'react';
import { div, h, h2, li, strong, ul } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import colors from 'src/libs/colors';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';

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

interface ResponseFragmentProps {
  responseIndex: number;
  snapshotResponses: { status: string; message: string | undefined }[] | undefined;
  title: string;
}

const ResponseFragment = (props: ResponseFragmentProps): ReactNode => {
  const { title, snapshotResponses, responseIndex } = props;
  const { status, message } = snapshotResponses
    ? snapshotResponses[responseIndex]
    : { status: undefined, message: undefined };

  const [color, iconKey, children] = switchCase<string | undefined, [string, IconId, ReactNode]>(
    status,
    [
      'fulfilled',
      () => [
        colors.primary(),
        'success-standard',
        h(Fragment, [strong(['Success: ']), 'Snapshot successfully imported']),
      ],
    ],
    ['rejected', () => [colors.danger(), 'warning-standard', h(Fragment, [strong(['Error: ']), message])]],
    [DEFAULT, () => [colors.primary(), 'success-standard', null]]
  );

  return h(Fragment, [
    icon(iconKey, { size: 18, style: { position: 'absolute', left: 0, color } }),
    title,
    children &&
      div({ style: { color, fontWeight: 'normal', fontSize: '0.625rem', marginTop: 5, wordBreak: 'break-word' } }, [
        children,
      ]),
  ]);
};

interface ImportDataOverviewProps {
  header: string;
  isDataset: boolean;
  isProtectedData: boolean;
  snapshotResponses: { status: string; message: string | undefined }[] | undefined;
  snapshots: { id: string; title: string }[];
  url?: URL;
}

export const ImportDataOverview = (props: ImportDataOverviewProps): ReactNode => {
  const { header, snapshots, isDataset, snapshotResponses, url, isProtectedData } = props;
  return div({ style: styles.card }, [
    h2({ style: styles.title }, [header]),
    !_.isEmpty(snapshots)
      ? div({ style: { marginTop: 20, marginBottom: 60 } }, [
          'Dataset(s):',
          ul({ style: { listStyle: 'none', position: 'relative', marginLeft: 0, paddingLeft: '2rem' } }, [
            snapshots.map(({ title, id }, index) => {
              return li(
                {
                  key: `snapshot_${id}`,
                  style: {
                    fontSize: 16,
                    fontWeight: 'bold',
                    marginTop: 20,
                    paddingTop: index ? 20 : 0,
                    borderTop: `${index ? 1 : 0}px solid #AAA`,
                  },
                },
                [h(ResponseFragment, { snapshotResponses, responseIndex: index, title })]
              );
            }),
          ]),
        ])
      : url && div({ style: { fontSize: 16 } }, ['From: ', url.hostname]),
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
            `The ${
              isDataset ? 'dataset' : 'snapshot'
            }(s) you just chose to import to Terra will be made available to you within a workspace of your choice where you can then perform analysis.`,
          ]
    ),
  ]);
};
