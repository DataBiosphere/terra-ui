// This test is owned by the Workspaces Team.
const dateFns = require('date-fns/fp');
const _ = require('lodash/fp');
const { deleteWorkspaceV2AsUser, testWorkspaceNamePrefix } = require('../utils/integration-helpers');
const { signIntoTerra } = require('../utils/integration-utils');
const { registerTest } = require('../utils/jest-utils');
const { withUserToken } = require('../utils/terra-sa-utils');

const olderThanCount = 6;
const timeUnit =
  // 'days';
  'hours';
// 'minutes';
const getTimeDifference =
  // .differenceInDays;
  dateFns.differenceInHours;
// .differenceInMinutes;

/**
 * Attempts to delete any workspaces which are named with the auto-generated test workspace name prefix,
 * and are more than a certain configured age.
 */
const runOrphanCleanser = withUserToken(async ({ page, testUrl, token }) => {
  // Sign into Terra so we have the correct credentials.
  await signIntoTerra(page, { token, testUrl });

  // Delete old orphaned workspaces. These can result from local integration test runs where the
  // process was prematurely terminated, but a few also appear in alpha and staging indicating that
  // ci test runs also sometimes leak workspaces.
  const workspaces = await page.evaluate(async () => await window.Ajax().Workspaces.list());
  const oldWorkspaces = _.filter(({ workspace: { name, createdDate } }) => {
    const age = getTimeDifference(new Date(createdDate), new Date());
    // console.info(`${namespace} ${name}, age ${age} days`)
    return _.startsWith(testWorkspaceNamePrefix, name) && age > olderThanCount;
  }, workspaces);

  console.log(
    `Attempting to delete ${oldWorkspaces.length} workspaces with prefix "${testWorkspaceNamePrefix}" created more than ${olderThanCount} ${timeUnit} ago.`
  );
  console.log(`${_.filter({ workspace: { cloudPlatform: 'Azure' } }, oldWorkspaces).length} of the old workspaces are Azure workspaces.`);
  return Promise.all(
    _.map(async ({ workspace: { namespace, name, cloudPlatform } }) => {
      try {
        // Unlock the workspace in case it was left in a locked state during a test (locked workspaces can't be deleted).
        await page.evaluate(async (namespace, name) => await window.Ajax().Workspaces.workspace(namespace, name).unlock(), namespace, name);
        await deleteWorkspaceV2AsUser({ page, billingProject: namespace, workspaceName: name });
        console.info(`Triggered delete for old workspace: ${name}`);
      } catch (e) {
        console.error(`Failed to delete old ${cloudPlatform} workspace: ${name} with billing project ${namespace}`);
      }
    }, oldWorkspaces)
  );
});

registerTest({
  name: 'delete-orphaned-workspaces',
  fn: runOrphanCleanser,
});
