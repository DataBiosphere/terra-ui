const { withUser } = require("../utils/integration-helpers");
const { fillIn, findText, click, clickable, input, signIntoTerra, verifyAccessibility } = require("../utils/integration-utils");
const { fillInReplace, gotoPage } = require("../utils/integration-utils");
const { registerTest } = require("../utils/jest-utils");

const testRegisterUserFn = withUser(async ({ page, testUrl, token }) => {
  await gotoPage(page, testUrl);
  await verifyAccessibility(page);
  await click(page, clickable({ textContains: "View Workspaces" }));
  await signIntoTerra(page, { token });
  await fillInReplace(page, input({ labelContains: "First Name" }), "Integration");
  await fillIn(page, input({ labelContains: "Last Name" }), "Test");
  await verifyAccessibility(page);
  await click(page, clickable({ textContains: "Register" }));
  await click(page, clickable({ textContains: "Accept" }), { timeout: 90000 });
  await findText(page, "Welcome to Terra Community Workbench");
});

registerTest({
  name: "register-user",
  fn: testRegisterUserFn,
});
