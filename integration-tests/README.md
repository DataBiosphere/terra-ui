# Terra UI Integration Tests

### Setup

1. Start by making sure you're running the correct versions of Node and Yarn, as described in the [root README](../README.md).
2. Run `yarn install` in this directory.
3. To set up an environment, run `node scripts/initializeEnvironment.js`.

### Running the tests

```sh
TERRA_TOKEN=[bearer token] LYLE_SA_KEY=[full key json] yarn test
```

#### Configuration
The following environment variables are parsed by the tests:

1. `TERRA_SA_KEY` **(required\*)**: service account key for creating access tokens for test user.
1. `TERRA_TOKEN` **(required\*)**: bearer token used to log into Terra.
1. `TEST_URL`: URL for the ui.
    * _Default `localhost:3000`_
1. `BILLING_PROJECT`: used for workspace creation.
    * _Default `general-dev-billing-account`_
1. `WORKFLOW_NAME`: workflow/method used for tests. Expects published config named `[name]-configured`.
    * _Default `echo_to_file`_
1.  `LYLE_SA_KEY` **(required)**: service account key to access Lyle.  
    Can be found in vault at `secret/dsde/terra/envs/common/lyle-user-service-account-key`
1.  `LYLE_URL`: URL for the service account allocator.
    * _Default `https://terra-lyle.appspot.com`_
1. `SCREENSHOT_DIR`: without this, screenshots won't be saved on test failure.

\* One of either `TERRA_SA_KEY` or `TERRA_TOKEN` is required

#### Convenient one-liner:
_(make sure you're `gcloud auth`ed as a user registered on Terra on your environment, with access to the billing project)_

```sh
TERRA_SA_KEY=$(vault read --format=json secret/dsde/alpha/common/firecloud-account.pem | jq .data) \
LYLE_SA_KEY=$(vault read --format=json secret/dsde/terra/envs/common/lyle-user-service-account-key | jq .data) \
yarn test
```
