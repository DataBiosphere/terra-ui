import { DatasetBuilderDetails } from 'src/dataset-builder/DatasetBuilderDetails';

export const navPaths = [
  {
    name: 'dataset-builder-details',
    path: '/library/builder/:datasetId',
    component: DatasetBuilderDetails,
    title: 'Build Dataset',
  },
];
