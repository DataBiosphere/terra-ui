import { CliAuth } from 'src/pages/scientificServices/cli-auth/CliAuth';
import { About } from 'src/pages/scientificServices/pipelines/tabs/about/About';
import { JobDetails } from 'src/pages/scientificServices/pipelines/tabs/history/details/JobDetails';
import { JobHistory } from 'src/pages/scientificServices/pipelines/tabs/history/JobHistory';
import { RunJob } from 'src/pages/scientificServices/pipelines/tabs/run/RunJob';

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
    name: 'pipelines-history-detail',
    path: '/pipelines/imputation/history/:jobId',
    component: JobDetails,
    title: 'Job Details',
  },
  {
    name: 'cli-auth',
    path: '/pipelines/cli-auth',
    component: CliAuth,
    title: 'Sign in to the terralab CLI',
    public: true,
  },
];
