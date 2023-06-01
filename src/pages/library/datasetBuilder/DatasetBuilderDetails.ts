import { div, h, h1 } from 'react-hyperscript-helpers';
import { spinnerOverlay } from 'src/components/common';
import { Link } from 'src/components/common/Link';
import FooterWrapper from 'src/components/FooterWrapper';
import { MarkdownViewer } from 'src/components/markdown';
import TopBar from 'src/components/TopBar';
import { DatasetBuilder, DatasetResponse } from 'src/libs/ajax/DatasetBuilder';
import { useLoadedData } from 'src/libs/ajax/loaded-data/useLoadedData';
import { useOnMount } from 'src/libs/react-utils';

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
        div({ style: { padding: '1rem' } }, [
          div(['Data Browser']),
          h1([datasetDetails.state.name]),
          div({ style: { display: 'flex' } }, [
            h(MarkdownViewer, [datasetDetails.state.description]),
            div([
              div([
                'Use the Dataset Builder to create specific tailored data for further analyses in a Terra Workspace',
              ]),
              h(Link, { href: `library/builder/${datasetId}/build` }, ['Learn how to gain access']),
              div(['* All datasets will need to be reviewed and approved before any analyses can be done']),
            ]),
          ]),
        ]),
      ])
    : spinnerOverlay;
};

export const navPaths = [
  {
    name: 'create-dataset',
    path: '/library/builder/:datasetId',
    component: DatasetBuilderDetails,
    title: 'Build Dataset',
  },
];
