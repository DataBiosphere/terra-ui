import { div, h, h1 } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import { DatasetModel } from 'src/libs/ajax/DataRepo';
import colors from 'src/libs/colors';
import * as Nav from 'src/libs/nav';

import { DatasetBuilderBreadcrumbs } from './Breadcrumbs';

type DatasetBuilderHeaderProps = { datasetDetails: DatasetModel };

interface BuilderPageHeaderProps {
  readonly style?: React.CSSProperties;
  readonly children: React.ReactNode[];
}

// The dataset builder has "pages" each of which has a similarly styled header.
export const BuilderPageHeader = (props: BuilderPageHeaderProps) => {
  const { style, children } = props;
  return div({ style: { padding: '0rem 3rem', ...style } }, children);
};

export const DatasetBuilderHeader = ({ datasetDetails }: DatasetBuilderHeaderProps) => {
  return h(
    BuilderPageHeader,
    {
      style: {
        borderBottom: `2px solid ${colors.primary()}`,
      },
    },
    [
      h(DatasetBuilderBreadcrumbs, {
        breadcrumbs: [
          { title: 'Data Browser', link: Nav.getLink('library-datasets') },
          {
            title: datasetDetails.name,
            link: Nav.getLink('dataset-builder-details', { datasetId: datasetDetails.id }),
          },
        ],
      }),
      h1([datasetDetails.name, ' Dataset Builder']),
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
