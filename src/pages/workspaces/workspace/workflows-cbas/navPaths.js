import _ from 'lodash/fp';
import * as SubmitWorkflow from 'src/pages/workspaces/workspace/workflows-cbas/SubmitWorkflow';

export const navPaths = _.flatten([SubmitWorkflow.navPaths]);
