import { div, h, h1 } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import colors from 'src/libs/colors';
import * as Nav from 'src/libs/nav';
import { PAGE_PADDING_HEIGHT, PAGE_PADDING_WIDTH } from 'src/pages/library/datasetBuilder/constants';

export const DatasetBuilderHeader = ({ name }: { name: string }) => {
  return div(
    {
      style: {
        borderBottom: `2px solid ${colors.primary()}`,
        padding: `${PAGE_PADDING_HEIGHT + 1}rem ${PAGE_PADDING_WIDTH}rem`,
      },
    },
    [
      div(['Data Browser / ', name]),
      h1([name, ' Dataset Builder']),
      div({ style: { display: 'flex', justifyContent: 'space-between' } }, [
        'Create groups of participants based on a specific criteria. You can also save any criteria grouping as a concept set using the menu icon next to the Participant Group title.',
        div({ style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '20rem' } }, [
          div({ style: { fontWeight: 600 } }, ['Have questions']),
          // TODO (DC-705): Link to proper place
          h(Link, { href: Nav.getLink('root'), style: { textDecoration: 'underline' } }, [
            'See supporting documentation',
          ]),
        ]),
      ]),
    ]
  );
};
