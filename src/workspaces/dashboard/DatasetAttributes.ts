import { TooltipTrigger } from '@terra-ui-packages/components';
import { cond } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import { Fragment, ReactNode } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import { SimpleTable } from 'src/components/table';
import * as Style from 'src/libs/style';
import { append } from 'src/libs/utils';
import { displayConsentCodes, displayLibraryAttributes } from 'src/workspaces/dashboard/library-attributes';
import { WorkspaceInfo } from 'src/workspaces/utils';

interface DatasetAttributesProps {
  attributes: WorkspaceInfo['attributes'];
}

export const DatasetAttributes = (props: DatasetAttributesProps): ReactNode => {
  const { attributes = {} } = props;

  return (
    _.some(_.startsWith('library:'), _.keys(attributes)) &&
    h(Fragment, [
      div({ style: Style.dashboard.header }, ['Dataset Attributes']),
      // @ts-expect-error
      h(SimpleTable, {
        'aria-label': 'dataset attributes table',
        rows: _.flow(
          _.map(({ key, title }) => ({ name: title, value: displayAttributeValue(attributes[key]) })),
          append({
            name: 'Structured Data Use Limitations',
            value: attributes['library:orsp'] ? null : h(DataUseLimitations, { attributes }),
          }),
          _.filter('value')
        )(displayLibraryAttributes),
        columns: [
          { key: 'name', size: { grow: 1 } },
          { key: 'value', size: { grow: 2 } },
        ],
      }),
    ])
  );
};

export const displayAttributeValue = (v: unknown): string => {
  return cond(
    [_.isArray(v), () => (v as string[]).join(', ')],
    [v === true, () => 'Yes'],
    [v === false, () => 'No'],
    [typeof v === 'string', () => v as string],
    [
      !!v && typeof v === 'object' && 'items' in v && _.isArray(v.items),
      () => ((v as any).items as string[]).join(', '),
    ],
    [typeof v === 'object', () => JSON.stringify(v)],
    () => JSON.stringify(v)
  );
};

interface DataUseLimitationsProps {
  attributes: WorkspaceInfo['attributes'];
}

const DataUseLimitations = (props: DataUseLimitationsProps): ReactNode => {
  const { attributes = {} } = props;
  return _.map(
    ({ key, title }) => {
      return div({ key, style: { display: 'inline-block', marginRight: '0.75rem' } }, [
        h(TooltipTrigger, { content: title }, [
          span({ style: { textDecoration: 'underline dotted' } }, [key.slice(8)]),
        ]),
        ': ',
        displayAttributeValue(attributes[key]),
      ]);
    },
    _.filter(({ key }) => _.has(key, attributes), displayConsentCodes)
  );
};
