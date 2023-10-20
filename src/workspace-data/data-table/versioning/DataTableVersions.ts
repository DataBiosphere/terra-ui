import { cond } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import { Fragment, ReactNode } from 'react';
import { div, h, li, ol } from 'react-hyperscript-helpers';
import { ButtonSecondary, IdContainer } from 'src/components/common';
import { spinner } from 'src/components/icons';
import colors from 'src/libs/colors';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';

export interface DataTableVerionsProps {
  error: any;
  loading: boolean;
  savingNewVersion: boolean;
  versions: any[];
  onClickVersion: (version: any) => void;
}

export const DataTableVersions = (props: DataTableVerionsProps): ReactNode => {
  const { error, loading, savingNewVersion, versions, onClickVersion } = props;

  return div({ style: { padding: '1rem 0.5rem 1rem 1.5rem', borderBottom: `1px solid ${colors.dark(0.2)}` } }, [
    cond<ReactNode>(
      [
        loading,
        () =>
          div({ style: { display: 'flex', alignItems: 'center' } }, [
            spinner({ size: 16, style: { marginRight: '1ch' } }),
            'Loading version history',
          ]),
      ],
      [error, () => div({ style: { display: 'flex', alignItems: 'center' } }, ['Error loading version history'])],
      [_.isEmpty(versions) && !savingNewVersion, () => 'No versions saved'],
      () =>
        h(IdContainer, [
          (id) =>
            h(Fragment, [
              div({ id, style: { marginBottom: '0.5rem' } }, ['Version history']),
              savingNewVersion &&
                div({ style: { display: 'flex', alignItems: 'center' } }, [
                  spinner({ size: 16, style: { marginRight: '1ch' } }),
                  'Saving new version',
                ]),
              ol(
                {
                  'aria-labelledby': id,
                  style: { margin: savingNewVersion ? '0.5rem 0 0 ' : 0, padding: 0, listStyleType: 'none' },
                },
                [
                  _.map(([index, version]) => {
                    return li(
                      { key: version.url, style: { marginBottom: index < versions.length - 1 ? '0.5rem' : 0 } },
                      [
                        h(ButtonSecondary, { style: { height: 'auto' }, onClick: () => onClickVersion(version) }, [
                          Utils.makeCompleteDate(version.timestamp),
                        ]),
                        div({ style: { ...Style.noWrapEllipsis } }, [version.description || 'No description']),
                      ]
                    );
                  }, Utils.toIndexPairs(versions)),
                ]
              ),
            ]),
        ])
    ),
  ]);
};
