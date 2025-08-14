import { About } from 'src/pages/scientificServices/pipelines/views/About';
import { JobHistory } from 'src/pages/scientificServices/pipelines/views/JobHistory';
import { RunJob } from 'src/pages/scientificServices/pipelines/views/RunJob';

export const navPaths = [
  {
    name: 'pipelines-about',
    path: '/pipelines/imputation',
    component: About,
    title: 'Home',
  },
  {
    name: 'pipelines-run',
    path: '/pipelines/imputation/run',
    component: RunJob,
    title: 'Run Job',
  },
  {
    name: 'pipelines-history',
    path: '/pipelines/imputation/history',
    component: JobHistory,
    title: 'Job History',
  },
];
