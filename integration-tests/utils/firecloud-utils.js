const { click, delay, findText } = require('./integration-utils');

const selectWorkspace = async (page, billingAccount, workspace) => {
  await click(page, '//*[@data-test-id="workspace-selector"]');
  return click(page, `//ul/li[contains(normalize-space(.),"${billingAccount}/${workspace}")]`);
};

const signIntoFirecloud = async (page, token) => {
  await page.waitForXPath('//title[text()="FireCloud | Broad Institute"]');
  await findText(page, 'content you are looking for is currently only accessible');

  await page.waitForXPath('//*[@id="sign-in-button"]');

  /*
   * The FireCloud not-signed-in page renders the sign-in button while it is still doing some
   * initialization. If you log the status of the App components state for user-status and auth2
   * with each render, you see the following sequence:
   *   '#{}' ''
   *   '#{}' '[object Object]'
   *   '#{:refresh-token-saved}' '[object Object]'
   *
   * If the page is used before this is complete (for example window.forceSignedIn adding
   * :signed-in to user-status), bad things happen (for example :signed-in being dropped from
   * user-status). Put another way, if forceSignedIn is called between the 2nd and 3rd render, the
   * sign-in doesn't work. The visible effect (failure screenshot) is that the test gets stuck on
   * the FireCloud sign-in page.
   *
   * There is no observable evidence that the component has settled into its final state. I (Brian)
   * believe that watching for the sign-in button (which is also what the FireCloud UI tests did:
   * https://github.com/broadinstitute/firecloud-ui/blob/ab678610367c8388d70de768db0ad84c6df63997/automation/src/test/scala/org/broadinstitute/dsde/firecloud/page/user/SignInPage.scala#L31) will get us past the 2nd render
   * but not necessarily the thrid. Therefore, instead of reworking the sign-in logic for a case
   * that (for the most part) only a computer will operate fast enough to encounter, we'll just slow
   * the computer down a little with a fixed-length sleep.
   *
   * Note that the amount of sleep needed is dependent on CPU load where the browser is running,
   * which can be affected by CPU speed, memory, and other processes running at the same time
   * (notably tests running in parallel). The duration below may be overkill in many conditions, but
   * we want it to always be enough, whether running 10 parallel executions on a developer laptop or
   * running in a CI server.
   */
  await delay(1500);

  console.log(`Sign in Firecloud: ${page.url()}`);
  await page.waitForFunction('!!window["forceSignedIn"]');
  await page.evaluate((token) => window.forceSignedIn(token), token); // Note: function for Fire Cloud is forceSignedIn() while Terra is forceSignIn()
};

module.exports = {
  selectWorkspace,
  signIntoFirecloud,
};
