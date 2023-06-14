import _ from 'lodash/fp';
import { div, h, h1, h3 } from 'react-hyperscript-helpers';
import { ButtonOutline, spinnerOverlay } from 'src/components/common';
import FooterWrapper from 'src/components/FooterWrapper';
import { MarkdownViewer } from 'src/components/markdown';
import TopBar from 'src/components/TopBar';
import { DatasetBuilder, DatasetResponse } from 'src/libs/ajax/DatasetBuilder';
import { useLoadedData } from 'src/libs/ajax/loaded-data/useLoadedData';
import colors from 'src/libs/colors';
import * as Nav from 'src/libs/nav';
import { useOnMount } from 'src/libs/react-utils';
import { DatasetBuilderBreadcrumbs } from 'src/pages/library/datasetBuilder/Breadcrumbs';

interface DomainDisplayProps {
  title: string;
  displayInformation: {
    category: string;
    participantCount: number;
    conceptCount: number;
  }[];
}

const TileDisplay = (props: DomainDisplayProps) => {
  const { title, displayInformation } = props;
  return div([
    h3([title]),
    div({ style: { display: 'flex', flexWrap: 'wrap' } }, [
      _.map(
        (displayTile) =>
          div(
            {
              style: {
                width: '30%',
                height: '10rem',
                backgroundColor: 'white',
                padding: '0.5rem 2rem',
                marginTop: '1rem',
                marginRight: '1rem',
                border: `1px solid ${colors.light()}`,
              },
              key: displayTile.category,
            },
            [
              h3([displayTile.category]),
              div({ style: { display: 'flex', alignItems: 'baseline' } }, [
                div({ style: { fontSize: 30, fontWeight: 600 } }, [`${displayTile.conceptCount / 1000}K`]),
                div({ style: { fontSize: 20, marginLeft: '0.5rem' } }, ['concepts']),
              ]),
              div({ style: { fontSize: 20, marginTop: '0.5rem' } }, [`${displayTile.participantCount} participants`]),
            ]
          ),
        displayInformation
      ),
    ]),
  ]);
};

interface DatasetBuilderDetailsProps {
  datasetId: string;
}

export const DatasetBuilderDetails = ({ datasetId }: DatasetBuilderDetailsProps) => {
  const [datasetDetails, loadDatasetDetails] = useLoadedData<DatasetResponse>();
  const hasAggregateDataViewerAccess =
    datasetDetails.status === 'Ready' ? datasetDetails.state.accessLevel !== 'Discoverer' : false;

  useOnMount(() => {
    void loadDatasetDetails(() => DatasetBuilder().retrieveDataset(datasetId));
  });
  return datasetDetails.status === 'Ready'
    ? h(FooterWrapper, [
        h(TopBar, { title: 'Preview', href: '' }, []),
        div({ style: { padding: '2rem' } }, [
          h(DatasetBuilderBreadcrumbs, {
            breadcrumbs: [{ link: Nav.getLink('library-datasets'), title: 'Data Browser' }],
          }),
          h1({ style: { marginTop: '0.75rem' } }, [datasetDetails.state.name]),
          div({ style: { display: 'flex' } }, [
            h(MarkdownViewer, [datasetDetails.state.description]),
            div({ style: { width: '70rem', backgroundColor: 'white', padding: '1rem', marginLeft: '1rem' } }, [
              div([
                'Use the Dataset Builder to create specific tailored data for further analyses in a Terra Workspace',
              ]),
              h(
                ButtonOutline,
                {
                  style: { width: '100%', borderRadius: 0, marginTop: '1rem', textTransform: 'none' },
                  // TODO: Get link for learn how to get access
                  href: hasAggregateDataViewerAccess
                    ? Nav.getLink('create-dataset', { datasetId })
                    : encodeURIComponent(datasetDetails.state.learnMoreLink),
                },
                [hasAggregateDataViewerAccess ? 'Start creating datasets' : 'Learn how to gain access']
              ),
              div({ style: { marginTop: '1rem', color: colors.dark(), fontStyle: 'italic' } }, [
                '* All datasets will need to be reviewed and approved before any analyses can be done',
              ]),
            ]),
          ]),
          h(TileDisplay, { title: 'EHR Domains', displayInformation: datasetDetails.state.domainOptions }),
        ]),
      ])
    : spinnerOverlay;
};

export const navPaths = [
  {
    name: 'dataset-builder-details',
    path: '/library/builder/:datasetId',
    component: DatasetBuilderDetails,
    title: 'Build Dataset',
  },
];
