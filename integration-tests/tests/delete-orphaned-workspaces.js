// This test is owned by the Workspaces Team.
const dateFns = require('date-fns/fp');
const _ = require('lodash/fp');
const { deleteWorkspaceV2, testWorkspaceNamePrefix } = require('../utils/integration-helpers');
const { signIntoTerra } = require('../utils/integration-utils');
const { registerTest } = require('../utils/jest-utils');
const { withUserToken } = require('../utils/terra-sa-utils');

/**
 * Function which returns difference between two times (from, to).
 * Try `.differenceInHours`, `.differenceInDays`, or `.differenceInMinutes`.
 */
const getTimeDifference = dateFns.differenceInHours;
/** How many [time unit]s must pass before a workspace should be deleted. */
const olderThanCount = 6;
/** Display name for the chosen time unit. */
const timeUnit = 'hours';

/**
 * Attempts to delete any workspaces which are named with the auto-generated test workspace name prefix,
 * and are more than a certain configured age. Not a test, a cleanup utility.
 */
const deleteOrphanedWorkspaces = withUserToken(async ({ page, testUrl, token }) => {
  // Sign into Terra so we have the correct credentials.
  await signIntoTerra(page, { token, testUrl });

  // Delete old orphaned workspaces. These can result from local integration test runs where the
  // process was prematurely terminated, but a few also appear in alpha and staging indicating that
  // ci test runs also sometimes leak workspaces.
  const workspaces = await page.evaluate(async () => await window.Ajax().Workspaces.list());
  const oldWorkspaces = _.filter(({ workspace: { name, createdDate } }) => {
    const age = getTimeDifference(new Date(createdDate), new Date());
    return age > olderThanCount && _.startsWith(testWorkspaceNamePrefix, name);
  }, workspaces);

  console.log(
    `Attempting to delete ${oldWorkspaces.length} workspaces with prefix "${testWorkspaceNamePrefix}" created more than ${olderThanCount} ${timeUnit} ago.`
  );
  console.log(`${_.filter({ workspace: { cloudPlatform: 'Azure' } }, oldWorkspaces).length} of the old workspaces are Azure workspaces.`);

  return Promise.all(
    _.map(async ({ workspace: { namespace, name, cloudPlatform, state } }) => {
      try {
        if (state === 'DeleteFailed') {
          // Warn before deleting a workspace in a bad state
          console.warn(`Old workspace ${name} is in state 'DeleteFailed'; delete may not succeed.`);
        }
        // Unlock the workspace in case it was left in a locked state during a test (locked workspaces can't be deleted).
        await page.evaluate(async (namespace, name) => await window.Ajax().Workspaces.workspace(namespace, name).unlock(), namespace, name);
        await deleteWorkspaceV2({ page, billingProject: namespace, workspaceName: name });
        return { name, cloudPlatform, isDeleted: true };
      } catch (e) {
        return { name, cloudPlatform, isDeleted: false };
      }
    }, oldWorkspaces)
  ).then((results) => {
    const deletedNames =
      results
        .filter(({ isDeleted }) => isDeleted)
        .map(({ name, cloudPlatform }) => `${name} (${cloudPlatform})`)
        .join(', ') || '(none)';
    const failedNames =
      results
        .filter(({ isDeleted }) => !isDeleted)
        .map(({ name, cloudPlatform }) => `${name} (${cloudPlatform})`)
        .join(', ') || '(none)';
    console.info(`Triggered delete on workspaces: ${deletedNames}`);
    console.warn(`Failed to delete workspaces: ${failedNames}`);
  });
});

registerTest({
  name: 'delete-orphaned-workspaces',
  fn: deleteOrphanedWorkspaces,
});
