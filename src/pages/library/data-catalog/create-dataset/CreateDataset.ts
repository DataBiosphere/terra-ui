import { CreateDataset } from 'src/data-catalog/create-dataset/CreateDataset';

export const navPaths = [
  {
    name: 'create-dataset',
    path: '/library/datasets/create',
    component: CreateDataset,
    title: 'Catalog - Create Dataset',
  },
  {
    name: 'update-dataset',
    path: '/library/datasets/create/:storageSystem/:storageSourceId',
    component: CreateDataset,
    title: 'Catalog - Update Dataset',
  },
];
