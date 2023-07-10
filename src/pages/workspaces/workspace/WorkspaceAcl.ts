import _ from 'lodash/fp';
import { WorkspaceAccessLevel, workspaceAccessLevels } from 'src/libs/workspace-utils';

// a map of email -> AccessEntry
export type RawWorkspaceAcl = { [key: string]: RawAccessEntry };

// a list of email, AccessEntry pairs
export type WorkspaceAcl = AccessEntry[];

export interface RawAccessEntry {
  pending: boolean;
  canShare: boolean;
  canCompute: boolean;
  accessLevel: WorkspaceAccessLevel;
}

export interface AccessEntry extends RawAccessEntry {
  email: string;
}

export const transformAcl: (RawWorkspaceAcl) => WorkspaceAcl = (raw) => {
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
