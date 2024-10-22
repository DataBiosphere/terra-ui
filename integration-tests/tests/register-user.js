const { withUser } = require('../utils/integration-helpers');
const {
  Millis,
  assertLabelledTextInputValue,
  checkbox,
  click,
  clickable,
  delay,
  fillIn,
  findText,
  getLabelledTextInputValue,
  input,
  label,
  signIntoTerra,
  verifyAccessibility,
  waitForModal,
  waitForNoModal,
  waitForNoSpinners,
} = require('../utils/integration-utils');
const { fillInReplace, gotoPage } = require('../utils/integration-utils');
const { registerTest } = require('../utils/jest-utils');

const testRegisterUserFn = withUser(async ({ page, testUrl, token }) => {
  await gotoPage(page, testUrl);
  await findText(page, 'Terra uses cookies');
  await click(page, clickable({ textContains: 'Agree' }));
  // We wait here for the cookie message to disappear, it has a fixed duration fading animation of 300ms
  await delay(350);
  await verifyAccessibility(page);

  // This is the hamburger menu
  await click(page, clickable({ textContains: 'Toggle main menu' }));
  // Wait for sidebar to transition in.
  // Matches transition durations in ModalDrawer.
  await delay(200);

  await click(page, clickable({ textContains: 'Sign In' }));

  await signIntoTerra(page, { token });
  await fillInReplace(page, input({ labelContains: 'First Name' }), 'Integration');
  await fillIn(page, input({ labelContains: 'Last Name' }), 'Test');
  await fillIn(page, input({ labelContains: 'Organization' }), 'Test Organization');
  await fillIn(page, input({ labelContains: 'Department' }), 'Test Department');
  await fillIn(page, input({ labelContains: 'Title' }), 'Test Title');
  await fillInReplace(page, input({ labelContains: 'Contact Email for Notifications' }), 'ltcommanderdata@neighborhood.horse');

  // Accept the Terms of Service
  await click(page, clickable({ textContains: 'Read Terra Platform Terms of Service here' }));
  await waitForModal(page);
  await waitForNoSpinners(page);
  await click(page, clickable({ text: 'OK' }));
  await waitForNoModal(page);
  await click(page, checkbox({ textContains: 'By checking this box, you are agreeing to the Terra Terms of Service' }));

  await verifyAccessibility(page);
  await click(page, clickable({ textContains: 'Register' }));
  await findText(page, 'Welcome to Terra Community Workbench', { timeout: 90000 });

  await click(page, clickable({ textContains: 'Toggle main menu' }));
  // Wait for sidebar to transition in.
  // Matches transition durations in ModalDrawer.
  await delay(200);

  await findText(page, 'Integration Test', { timeout: Millis.ofMinute });
  await click(page, clickable({ textContains: 'Integration Test' }));
  // Wait for user menu to open.
  // Matches transition duration on .ReactCollapse--collapse in style.css.
  await delay(500);

  await click(page, clickable({ textContains: 'Profile' }));
  await waitForNoSpinners(page);

  await findText(page, 'Hello again, Integration');

  await assertLabelledTextInputValue(page, label({ labelContains: 'First Name' }), 'Integration');
  await assertLabelledTextInputValue(page, label({ labelContains: 'Last Name' }), 'Test');
  await assertLabelledTextInputValue(page, label({ labelContains: 'Organization' }), 'Test Organization');
  await assertLabelledTextInputValue(page, label({ labelContains: 'Department' }), 'Test Department');
  await assertLabelledTextInputValue(page, label({ labelContains: 'Title' }), 'Test Title');

  await assertLabelledTextInputValue(page, label({ labelContains: 'Contact Email' }), 'ltcommanderdata@neighborhood.horse');

  const registrationEmailDiv = await page.waitForSelector("xpath/(//div[.='Email']/following-sibling::div)");
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
