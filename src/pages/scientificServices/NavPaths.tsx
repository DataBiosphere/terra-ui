import { CliAuth } from 'src/pages/scientificServices/cli-auth/CliAuth';
import { About } from 'src/pages/scientificServices/pipelines/views/About';
import { JobHistory } from 'src/pages/scientificServices/pipelines/views/JobHistory';
import { RunJob } from 'src/pages/scientificServices/pipelines/views/RunJob';

export const navPaths = [
  // For now, redirect /pipelines to the Imputation home page
  {
    name: 'pipelines-about-all',
    path: '/pipelines',
    component: About,
    title: 'Home',
  },
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
  {
    name: 'cli-auth',
    path: '/pipelines/cli-auth',
    component: CliAuth,
    title: 'Sign in to the terralab CLI',
    public: true,
  },
];
