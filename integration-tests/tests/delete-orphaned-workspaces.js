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
/** How many [time unit]s must pass before an orphaned workspace should be deleted. */
const olderThanCount = 18;

/**
 * Attempts to delete any workspaces which are named with the auto-generated test workspace name prefix,
 * and are more than a certain configured age. These can result from local integration test runs where the
 * process was prematurely terminated, but a few also appear in alpha and staging indicating that
 * ci test runs also sometimes leak workspaces.
 *
 * Not a test: a cleanup utility.
 */
const deleteOrphanedWorkspaces = withUserToken(async ({ page, testUrl, token }) => {
  // Sign into Terra so we have the correct credentials.
  await signIntoTerra(page, { token, testUrl });

  // List orphaned workspaces
  const oldWorkspaces = await listOrphanWorkspaces(page);
  // List orphans which are already in state DeleteFailed (resistant to automated delete, don't fail on these)
  const oldWorkspaceNamesInDeleteFailed = getDeleteFailedWorkspaceNames(oldWorkspaces);

  // Delete orphans
  console.log(`Attempting to delete ${oldWorkspaces.length} test workspaces created more than ${olderThanCount} ${timeUnit} ago.`);
  return Promise.all(
    _.map(async ({ workspace: { namespace, name, cloudPlatform } }) => {
      try {
        // Unlock the workspace in case it was left in a locked state during a test (locked workspaces can't be deleted).
        await page.evaluate(async (namespace, name) => await window.Ajax().Workspaces.workspace(namespace, name).unlock(), namespace, name);
        const isDeleted = await deleteWorkspaceV2({ page, billingProject: namespace, workspaceName: name });
        return { name, cloudPlatform, isDeleted };
      } catch (e) {
        return { name, cloudPlatform, isDeleted: false };
      }
    }, oldWorkspaces)
  ).then(async (results) => {
    // Report results
    const deletedNames =
      results
        .filter(({ isDeleted }) => isDeleted)
        .map(({ name, cloudPlatform }) => `${name} (${cloudPlatform})`)
        .join(', ') || '(none)';
    const failedDeletes = results.filter(({ isDeleted }) => !isDeleted);
    const failedNames = failedDeletes.map(({ name, cloudPlatform }) => `${name} (${cloudPlatform})`).join(', ');
    console.info(`Triggered delete on workspaces: ${deletedNames}`);
    if (failedNames) {
      console.warn(`Failed to delete workspaces: ${failedNames}`);
    }

    const currentOrphans = await listOrphanWorkspaces(page, { isVerbose: false });
    const persistentOrphans = currentOrphans.filter(({ workspace: { name } }) =>
      oldWorkspaces.some(({ workspace: { name: oldName } }) => oldName === name)
    );
    const deleteFailedOrphans = getDeleteFailedWorkspaceNames(persistentOrphans);
    const newlyFailedDeletes = deleteFailedOrphans.filter((newName) => !oldWorkspaceNamesInDeleteFailed.includes(newName));

    if (newlyFailedDeletes.length) {
      const newlyFailedNames = newlyFailedDeletes.map(({ name, cloudPlatform }) => `${name} (${cloudPlatform})`).join(', ');
      throw new Error(
        `${newlyFailedDeletes.length} workspaces entered state DeleteFailed after orphan cleanup. These should be manually deleted: ${newlyFailedNames}`
      );
    }
  });
});

const listOrphanWorkspaces = async (page, { isVerbose = true } = {}) => {
  const workspaces = await page.evaluate(async () => await window.Ajax().Workspaces.list());

  // filter to workspaces created by integration tests only
  const testWorkspaces = workspaces.filter(({ workspace: { name } }) => _.startsWith(testWorkspaceNamePrefix, name));
  const testWorkspaceNames = testWorkspaces.map(({ workspace: { name } }) => name).join(', ');
  if (isVerbose) {
    console.log(`${testWorkspaces.length} test workspaces (with prefix "${testWorkspaceNamePrefix}") found: ${testWorkspaceNames}`);
  }

  // filter to workspaces not already deleting
  const deletableWorkspaces = testWorkspaces.filter(({ workspace: { state } }) => state !== 'Deleting');

  // filter to workspaces older than the freshness window
  const oldWorkspaces = deletableWorkspaces.filter(({ workspace: { createdDate } }) => {
    const getTimeDifference = differenceFnByUnit[timeUnit];
    const age = getTimeDifference(new Date(createdDate), new Date());
    return age > olderThanCount;
  });

  return oldWorkspaces;
};

const getDeleteFailedWorkspaceNames = (workspaces) => {
  return workspaces.filter(({ workspace: { state } }) => state === 'DeleteFailed').map(({ workspace: { name } }) => name);
};

registerTest({
  name: 'delete-orphaned-workspaces',
  fn: deleteOrphanedWorkspaces,
  timeout: Millis.ofMinutes(10),
});
