import { Home } from 'src/pages/scientificServices/imputation/views/Home';
import { JobHistory } from 'src/pages/scientificServices/imputation/views/JobHistory';
import { RunJob } from 'src/pages/scientificServices/imputation/views/RunJob';

export const navPaths = [
  {
    name: 'imputation-home',
    path: '/services/imputation',
    component: Home,
    title: 'Imputation Service - Home',
  },
  {
    name: 'imputation-run',
    path: '/services/imputation/run',
    component: RunJob,
    title: 'Imputation Service - Run Job',
  },
  {
    name: 'imputation-history',
    path: '/services/imputation/history',
    component: JobHistory,
    title: 'Imputation Service - Job History',
  },
];
