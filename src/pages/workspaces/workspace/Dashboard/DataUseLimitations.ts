import { TooltipTrigger } from '@terra-ui-packages/components';
import { cond } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import { div, h, span } from 'react-hyperscript-helpers';
import { displayConsentCodes } from 'src/pages/workspaces/workspace/library-attributes';

const displayAttributeValue = (v: unknown): string => {
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

export const DataUseLimitations = ({ attributes }) => {
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
