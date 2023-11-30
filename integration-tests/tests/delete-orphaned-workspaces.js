// This test is owned by the Workspaces Team.
const dateFns = require('date-fns/fp');
const _ = require('lodash/fp');
const { deleteWorkspaceV2, testWorkspaceNamePrefix } = require('../utils/integration-helpers');
const { Millis, signIntoTerra } = require('../utils/integration-utils');
const { registerTest } = require('../utils/jest-utils');
const { withUserToken } = require('../utils/terra-sa-utils');

/**
 * Function which returns difference between two times (from, to), by the name of its unit.
 */
const differenceFnByUnit = {
  days: dateFns.differenceInDays,
  hours: dateFns.differenceInHours,
  minutes: dateFns.differenceInMinutes,
};

/** The chosen unit of time. */
const timeUnit = 'hours';
/** How many [time unit]s must pass before a workspace should be deleted. */
const olderThanCount = 12;

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
  const testWorkspaces = workspaces.filter(({ workspace: { name } }) => _.startsWith(testWorkspaceNamePrefix, name));
  const testWorkspaceNames = testWorkspaces.map(({ workspace: { name } }) => name).join(', ');
  console.log(`${testWorkspaces.length} test workspaces (with prefix "${testWorkspaceNamePrefix}") found: ${testWorkspaceNames}`);

  const oldWorkspaces = testWorkspaces.filter(({ workspace: { createdDate } }) => {
    const getTimeDifference = differenceFnByUnit[timeUnit];
    const age = getTimeDifference(new Date(createdDate), new Date());
    return age > olderThanCount;
  });
  console.log(`Attempting to delete ${oldWorkspaces.length} test workspaces created more than ${olderThanCount} ${timeUnit} ago.`);

  return Promise.all(
    _.map(async ({ workspace: { namespace, name, cloudPlatform, state } }) => {
      try {
        if (state === 'DeleteFailed') {
          // Warn before deleting a workspace in a bad state
          console.log(`Old workspace ${name} is in state 'DeleteFailed'; delete may not succeed.`);
        }
        // Unlock the workspace in case it was left in a locked state during a test (locked workspaces can't be deleted).
        await page.evaluate(async (namespace, name) => await window.Ajax().Workspaces.workspace(namespace, name).unlock(), namespace, name);
        const isDeleted = await deleteWorkspaceV2({ page, billingProject: namespace, workspaceName: name });
        return { name, cloudPlatform, isDeleted };
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
    const failedNames = results
      .filter(({ isDeleted }) => !isDeleted)
      .map(({ name, cloudPlatform }) => `${name} (${cloudPlatform})`)
      .join(', ');
    console.info(`Triggered delete on workspaces: ${deletedNames}`);
    if (failedNames) {
      console.warn(`Failed to delete workspaces: ${failedNames}`);
    }
  });
});

registerTest({
  name: 'delete-orphaned-workspaces',
  fn: deleteOrphanedWorkspaces,
  timeout: Millis.ofMinutes(10),
});
