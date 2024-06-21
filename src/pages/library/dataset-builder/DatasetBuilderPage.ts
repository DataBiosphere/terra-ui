import { DatasetBuilderView } from 'src/dataset-builder/DatasetBuilder';

export const navPaths = [
  {
    name: 'dataset-builder',
    path: '/library/builder/:snapshotId/build',
    component: DatasetBuilderView,
    title: 'Data Explorer',
  },
];
