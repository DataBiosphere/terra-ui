import _ from 'lodash/fp';
import { notebookLockHash } from 'src/analysis/utils/file-utils';
import { Ajax } from 'src/libs/ajax';
import { GoogleWorkspace, hasAccessLevel } from 'src/workspaces/utils';

export const findPotentialNotebookLockers = async (workspace: GoogleWorkspace): Promise<{ [key: string]: string }> => {
  const {
    canShare,
    workspace: { namespace, name, bucketName },
  } = workspace;
  if (!canShare) {
    return {};
  }
  // TODO: type
  const { acl } = await Ajax().Workspaces.workspace(namespace, name).getAcl();
  const potentialLockers = _.flow(
    _.toPairs,
    _.map(([email, data]) => ({ email, ...data })),
    _.filter(({ accessLevel }) => hasAccessLevel('WRITER', accessLevel))
  )(acl);
  const lockHolderPromises = _.map(async ({ email }) => {
    const lockHash = await notebookLockHash(bucketName, email);
    return { [lockHash]: email };
  }, potentialLockers);
  const lockHolders = _.mergeAll(await Promise.all(lockHolderPromises));

  return lockHolders;
};
