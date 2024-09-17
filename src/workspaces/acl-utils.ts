import _ from 'lodash/fp';
import { RawAccessEntry, RawWorkspaceAcl } from 'src/libs/ajax/workspaces/workspace-models';
import { WorkspaceAccessLevel, workspaceAccessLevels } from 'src/workspaces/utils';

// a map of email -> AccessEntry
export type { RawWorkspaceAcl } from 'src/libs/ajax/workspaces/workspace-models';

// a list of email, AccessEntry pairs
export type WorkspaceAcl = AccessEntry[];

export interface AccessEntry extends RawAccessEntry {
  email: string;
}

export const transformAcl = (raw: RawWorkspaceAcl): WorkspaceAcl => {
  return _.flow(
    _.toPairs,
    _.map(([email, data]) => ({ email, ...data })),
    _.sortBy((x) => workspaceAccessLevels.indexOf(x.accessLevel))
  )(raw);
};

export const terraSupportEmail = 'Terra-Support@firecloud.org';

// The get workspace ACL API endpoint returns emails capitalized as they are registered in Terra.
// However, a user may type in the support email using different capitalization (terra-support, TERRA-SUPPORT, etc.)
// The email they entered will appear in the ACL stored in this component's state until updates are saved.
// We want the share with support switch to function with any variation of the support email.
export const aclEntryIsTerraSupport: (AccessEntry) => boolean = ({ email }) =>
  _.toLower(email) === _.toLower(terraSupportEmail);

export const terraSupportAccessLevel: (WorkspaceAcl) => WorkspaceAccessLevel | undefined = (acl) =>
  _.find(aclEntryIsTerraSupport, acl)?.accessLevel;
