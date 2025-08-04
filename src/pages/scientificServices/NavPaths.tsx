import { CliAuth } from 'src/pages/scientificServices/cli-auth/CliAuth';

export const navPaths = [
  {
    name: 'pipelines-cli-auth',
    path: '/services/pipelines/cli-auth',
    component: CliAuth,
    title: 'Sign in to the terralab CLI',
    public: true,
  },
];
