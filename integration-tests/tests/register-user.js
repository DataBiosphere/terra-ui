const { withUser } = require('../utils/integration-helpers');
const {
  fillIn,
  findText,
  click,
  clickable,
  input,
  signIntoTerra,
  verifyAccessibility,
  label,
  getLabelledTextInputValue,
  assertLabelledTextInputValue,
  delay,
} = require('../utils/integration-utils');
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
  await fillInReplace(page, input({ labelContains: 'Contact Email for Notifications' }), 'ltcommanderdata@neighborhood.horse');
  await verifyAccessibility(page);
  await click(page, clickable({ textContains: 'Register' }));
  await click(page, clickable({ textContains: 'Accept' }), { timeout: 90000 });
  await findText(page, 'Welcome to Terra Community Workbench');

  // This is the hamburger menu
  await click(page, '/html/body/div[1]/div[2]/div/div[1]/div[1]/div[1]/div/div[1]');
  await delay(1000);

  await findText(page, 'Integration Test');
  await click(page, clickable({ textContains: 'Integration Test' }));
  await delay(1000);

  await click(page, clickable({ textContains: 'Profile' }));
  await delay(1000);

  await findText(page, 'Hello again, Integration');

  await assertLabelledTextInputValue(page, label({ labelContains: 'First Name' }), 'Integration');
  await assertLabelledTextInputValue(page, label({ labelContains: 'Last Name' }), 'Test');
  await assertLabelledTextInputValue(page, label({ labelContains: 'Organization' }), 'Test Organization');
  await assertLabelledTextInputValue(page, label({ labelContains: 'Department' }), 'Test Department');
  await assertLabelledTextInputValue(page, label({ labelContains: 'Title' }), 'Test Title');

  await assertLabelledTextInputValue(page, label({ labelContains: 'Contact Email' }), 'ltcommanderdata@neighborhood.horse');

  const registrationEmailDiv = await page.waitForXPath("(//div[.='Email']/following-sibling::div)");
  const registrationEmail = registrationEmailDiv?.evaluate((d) => d.value);
  const contactEmail = await getLabelledTextInputValue(page, label({ labelContains: 'Contact Email' }));

  if (registrationEmail === contactEmail) {
    throw new Error('The custom contact email should be different from the registration email');
  }
});

registerTest({
  name: 'register-user',
  fn: testRegisterUserFn,
});
