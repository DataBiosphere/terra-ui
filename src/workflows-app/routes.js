import _ from 'lodash/fp';
import * as SubmissionHistory from 'src/workflows-app/pages/SubmissionHistory';
import * as RunDetails from 'src/workflows-app/RunDetails';
import * as SubmissionConfig from 'src/workflows-app/SubmissionConfig';
import * as SubmissionDetails from 'src/workflows-app/SubmissionDetails';
import * as SubmitWorkflow from 'src/workflows-app/SubmitWorkflow';

export const navPaths = _.flatten([
  SubmissionDetails.navPaths,
  SubmissionHistory.navPaths,
  SubmissionConfig.navPaths,
  SubmitWorkflow.navPaths,
  RunDetails.navPaths,
]);
