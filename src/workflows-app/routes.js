import _ from 'lodash/fp';
import * as RunDetails from 'src/workflows-app/RunDetails';
import * as SubmissionConfig from 'src/workflows-app/SubmissionConfig';
import * as SubmissionDetails from 'src/workflows-app/SubmissionDetails';
import * as SubmitWorkflow from 'src/workflows-app/SubmitWorkflow';

export const navPaths = _.flatten([SubmissionDetails.navPaths, SubmissionConfig.navPaths, SubmitWorkflow.navPaths, RunDetails.navPaths]);
