import React from 'react';
import * as Nav from 'src/libs/nav';
import { CliAuth } from 'src/pages/scientificServices/cli-auth/CliAuth';
import { ProfileView } from 'src/pages/scientificServices/pipelines/account/ProfileView';
import { QuotasView } from 'src/pages/scientificServices/pipelines/account/QuotasView';
import { About } from 'src/pages/scientificServices/pipelines/tabs/about/About';
import { JobDetails } from 'src/pages/scientificServices/pipelines/tabs/history/details/JobDetails';
import { JobHistory } from 'src/pages/scientificServices/pipelines/tabs/history/JobHistory';
import { RunJob } from 'src/pages/scientificServices/pipelines/tabs/run/RunJob';
import { ScientificServicesTermsOfServicePage } from 'src/pages/scientificServices/termsOfService/TermsOfServicePage';

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
    name: 'pipelines-job-detail',
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
  {
    name: 'pipelines-profile',
    path: '/pipelines/profile',
    component: ProfileView,
    title: 'Profile',
  },
  // DEPRECATED: this redirect is here to avoid breaking any existing links to /pipelines/account.
  // The pipelines-profile path should be used going forward.
  {
    name: 'pipelines-account',
    path: '/pipelines/account',
    component: (props) => <Nav.Redirector pathname={Nav.getPath('pipelines-profile', props)} search='' />,
    title: 'Account',
  },
  {
    name: 'pipelines-quotas',
    path: '/pipelines/quotas',
    component: QuotasView,
    title: 'Quotas',
  },
  {
    name: 'scientific-services-terms-of-service',
    path: '/pipelines/terms-of-service',
    component: ScientificServicesTermsOfServicePage,
    public: true,
    title: 'Terms of Service',
  },
];
