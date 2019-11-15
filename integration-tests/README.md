# Terra UI Integration Tests

### Setup

1. Start by making sure you're running the correct versions of Node and NPM, as described in the [root README](../README.md).
2. Run `npm install` in this directory.
3. To set up an environment, run `node scripts/initializeEnvironment.js`.

### Running the tests

```sh
TERRA_TOKEN=[bearer token] npm run test
```

#### Configuration
The following environment variables are parsed by the tests:

1. `TERRA_TOKEN` **(required)**: bearer token used to log into Terra.
2. `TEST_URL`: URL for the ui.
    * _Default `localhost:3000`_
3. `BILLING_PROJECT`: used for workspace creation.
    * _Default `general-dev-billing-account`_
4. `WORKFLOW_NAME`: workflow/method used for tests. Expects published config named `[name]-configured`.
    * _Default `echo_to_file`_
5. `SCREENSHOT_DIR`: without this, screenshots won't be saved on test failure.
