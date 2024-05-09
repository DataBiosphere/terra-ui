import { div, h, h1 } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import colors from 'src/libs/colors';
import * as Nav from 'src/libs/nav';

import { DatasetBuilderBreadcrumbs } from './Breadcrumbs';

type DatasetBuilderHeaderProps = { snapshotId: string };

interface BuilderPageHeaderProps {
  readonly style?: React.CSSProperties;
  readonly children: React.ReactNode[];
}

const PAGE_PADDING_HEIGHT = 0;
const PAGE_PADDING_WIDTH = 3;
const DATASET_NAME = 'AXIN';

// The dataset builder has "pages" each of which has a similarly styled header.
export const BuilderPageHeader = (props: BuilderPageHeaderProps) => {
  const { style, children } = props;
  return div({ style: { padding: `${PAGE_PADDING_HEIGHT}rem ${PAGE_PADDING_WIDTH}rem`, ...style } }, children);
};

export const DatasetBuilderHeader = ({ snapshotId }: DatasetBuilderHeaderProps) => {
  return div(
    {
      style: {
        borderBottom: `2px solid ${colors.primary()}`,
        padding: `${PAGE_PADDING_HEIGHT + 1}rem ${PAGE_PADDING_WIDTH}rem`,
      },
    },
    [
      h(DatasetBuilderBreadcrumbs, {
        breadcrumbs: [
          { title: 'Data Browser', link: Nav.getLink('library-datasets') },
          {
            title: DATASET_NAME,
            link: Nav.getLink('dataset-builder-details', { snapshotId }),
          },
        ],
      }),
      h1([DATASET_NAME, ' Dataset Builder']),
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
