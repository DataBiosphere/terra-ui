const { withUser } = require('../utils/integration-helpers');
const { fillIn, findText, click, clickable, input, signIntoTerra, verifyAccessibility } = require('../utils/integration-utils');
const { fillInReplace, gotoPage } = require('../utils/integration-utils');
const { registerTest } = require('../utils/jest-utils');

const testRegisterUserFn = withUser(async ({ page, testUrl, token }) => {
  await gotoPage(page, testUrl);
  await verifyAccessibility(page);
  await click(page, clickable({ textContains: 'View Workspaces' }));
  await signIntoTerra(page, { token });
  await fillInReplace(page, input({ labelContains: 'First Name' }), 'Integration');
  await fillIn(page, input({ labelContains: 'Last Name' }), 'Test');
  await fillIn(page, input({ labelContains: 'Organization' }), 'Test Organization');
  await fillIn(page, input({ labelContains: 'Department' }), 'Test Department');
  await fillIn(page, input({ labelContains: 'Title' }), 'Test Title');
  await verifyAccessibility(page);
  await click(page, clickable({ textContains: 'Register' }));
  await click(page, clickable({ textContains: 'Accept' }), { timeout: 90000 });
  await findText(page, 'Welcome to Terra Community Workbench');

  // This is the hamburger menu
  await click(page, '/html/body/div[1]/div[2]/div/div[1]/div[1]/div[1]/div/div[1]');
  await findText(page, 'Integration Test');
});

registerTest({
  name: 'register-user',
  fn: testRegisterUserFn,
});
