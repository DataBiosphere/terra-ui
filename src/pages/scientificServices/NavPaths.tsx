import { CliAuth } from 'src/pages/scientificServices/cli-auth/CliAuth';
import { Home } from 'src/pages/scientificServices/pipelines/views/Home';
import { JobHistory } from 'src/pages/scientificServices/pipelines/views/JobHistory';
import { RunJob } from 'src/pages/scientificServices/pipelines/views/RunJob';

export const navPaths = [
  {
    name: 'cli-auth',
    path: '/pipelines/cli-auth',
    component: CliAuth,
    title: 'Sign in to the terralab CLI',
    public: true,
  },
  {
    name: 'pipelines-home',
    path: '/services/pipelines',
    component: Home,
    title: 'Home',
  },
  {
    name: 'pipelines-run',
    path: '/services/pipelines/run',
    component: RunJob,
    title: 'Run Job',
  },
  {
    name: 'pipelines-history',
    path: '/services/pipelines/history',
    component: JobHistory,
    title: 'Job History',
  },
];
