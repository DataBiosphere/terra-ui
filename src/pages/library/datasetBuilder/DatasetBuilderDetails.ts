import { div, h, h1 } from 'react-hyperscript-helpers';
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

interface DatasetBuilderDetailsProps {
  datasetId: string;
}

export const DatasetBuilderDetails = ({ datasetId }: DatasetBuilderDetailsProps) => {
  const [datasetDetails, loadDatasetDetails] = useLoadedData<DatasetResponse>();

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
                  href: Nav.getLink('create-dataset', { datasetId }),
                },
                ['Learn how to gain access']
              ),
              div({ style: { marginTop: '1rem', color: colors.dark(), fontStyle: 'italic' } }, [
                '* All datasets will need to be reviewed and approved before any analyses can be done',
              ]),
            ]),
          ]),
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
