import { DatasetBuilderView } from 'src/dataset-builder/DatasetBuilder';

export const navPaths = [
  {
    name: 'dataset-builder',
    path: '/library/builder/:datasetId/build',
    component: DatasetBuilderView,
    title: 'Build Dataset',
  },
];
