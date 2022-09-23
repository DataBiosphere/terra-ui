# Terra UI Integration Tests

### Setup

1. Start by making sure you're running the correct versions of Node and Yarn, as described in the [root README](../README.md).
2. Run `yarn install` in this directory.

### Creating a test

1. Update `slack-notify-channels.json` in `slack/` directory: Add new test name and Slack channel for test result notification.

### Running the tests

```sh
TERRA_SA_KEY=[full key json] LYLE_SA_KEY=[full key json] yarn test
```

#### Configuration
The following environment variables are parsed by the tests:

- Service account credentials **(required)**:
  - Both of:
    - `TERRA_SA_KEY`: service account key for creating access tokens for test user. Can be found in vault
      at `secret/dsde/alpha/common/firecloud-account.pem`
    - `LYLE_SA_KEY`: service account key to access Lyle. Can be found in vault
      at `secret/dsde/terra/envs/common/lyle-user-service-account-key`
  - Or both of:
    - `GCP_PROJECT`: GCP project containing the above secrets in Secret Manager, i.e. `terra-bueller`
    - `GOOGLE_APPLICATION_CREDENTIALS`: key file for Google App Engine default service account for `GCP_PROJECT`
- `ENVIRONMENT`: Terra UI instance to test. Options: `dev`, `alpha`, `perf`, `staging`
  * _Default `dev`_, which sets:
    - `BILLING_PROJECT`: used for workspace creation.
      * _Default `saturn-integration-test-dev`_
    - `TEST_URL`: URL for the ui.
      * _Default `https://bvdp-saturn-dev.appspot.com`_
    - `WORKFLOW_NAME`: workflow/method used for tests. Expects published config named `[name]-configured`.
      * _Default `echo_to_file`_
- `LYLE_URL`: URL for the service account allocator.
  * _Default `https://terra-lyle.appspot.com`_
- `SCREENSHOT_DIR`: without this, screenshots won't be saved on test failure.
- `LOG_DIR`: Directory where to save test logs.
  * _Default_ `/tmp/test-results`
- `TERRA_USER_EMAIL`: account that already has access to `BILLING_PROJECT`
  * _Default `Scarlett.Flowerpicker@test.firecloud.org`_

#### Convenient one-liner:

```sh
TERRA_SA_KEY=$(vault read --format=json secret/dsde/alpha/common/firecloud-account.pem | jq .data) \
LYLE_SA_KEY=$(vault read --format=json secret/dsde/terra/envs/common/lyle-user-service-account-key | jq .data) \
yarn test
```
Optionally, additional useful options are:

```sh
HEADLESS=false \
ENVIRONMENT=[dev|alpha|perf|staging] \
```
By default, the tests will run against dev.

#### Debugging

To open a debug port into the jest tests run the following in the integration-tests folder

```sh
TERRA_SA_KEY=$(vault read --format=json secret/dsde/alpha/common/firecloud-account.pem | jq .data) \
LYLE_SA_KEY=$(vault read --format=json secret/dsde/terra/envs/common/lyle-user-service-account-key | jq .data) \
node --inspect-brk node_modules/.bin/jest [test name] --runInBand
```

To disable headless mode while debugging

```sh
HEADLESS=false \
TERRA_SA_KEY=$(vault read --format=json secret/dsde/alpha/common/firecloud-account.pem | jq .data) \
LYLE_SA_KEY=$(vault read --format=json secret/dsde/terra/envs/common/lyle-user-service-account-key | jq .data) \
node --inspect-brk node_modules/.bin/jest [test name] --runInBand
```

Using your IDE you can connect to the debug port and set breakpoints. More
info [here](https://jestjs.io/docs/en/troubleshooting).

#### Detecting Flakiness

You can run:

```
yarn test-flakes [test name]
```

By default this will run your test 100 times and display the stack trace of every failure encountered.

You can tweak this with the following settings:

Setting | Default | Description
--------|-------:|------------|
RUNS | 100 | The number of test runs you want to execute (Default: 100)
CONCURRENCY | 10 | The size of the browser pool / the number of simultaneous tests to run. 25 seems to be the upper limit for a mac with an M1 max chip
CLUSTER_TIMEOUT_MINUTES | 120 | The number of minutes before the overall test times out. 120 is overkill. If you want to run hundreds of iterations, it is best to overestimate this value
### Creating a new environment (e.g., dev, alpha, etc)
To set up an environment, run `node scripts/initializeEnvironment.js`.
