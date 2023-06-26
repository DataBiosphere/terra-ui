import _ from 'lodash/fp';
import * as RunDetails from 'src/pages/workspaces/workspace/workflows-cbas/RunDetails';
import * as SubmissionConfig from 'src/pages/workspaces/workspace/workflows-cbas/SubmissionConfig';
import * as SubmissionDetails from 'src/pages/workspaces/workspace/workflows-cbas/SubmissionDetails';
import * as SubmissionHistory from 'src/pages/workspaces/workspace/workflows-cbas/SubmissionHistory';
import * as SubmitWorkflow from 'src/pages/workspaces/workspace/workflows-cbas/SubmitWorkflow';

export const navPaths = _.flatten([
  SubmissionDetails.navPaths,
  SubmissionHistory.navPaths,
  SubmissionConfig.navPaths,
  SubmitWorkflow.navPaths,
  RunDetails.navPaths,
]);
