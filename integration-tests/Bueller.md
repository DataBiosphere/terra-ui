# Bueller

Test runner service

## Overview

This service provides a way to run an integration test via an HTTP request. The initial primary use case is to use a tool like [Gatling](https://gatling.io/) to initiate many simultaneous test runs to determine how well Terra performs under load.

## Authentication

Requires an OpenID Connect ID token for the service account `bueller-user@terra-bueller.iam.gserviceaccount.com`. A private key for that service account is stored in Vault at `secret/dsde/terra/envs/common/bueller-user-service-account-key`.

To generate a token, create a JWT with the additional claim `target_audience: 'https://terra-bueller.appspot.com'`, sign it with the private key, and pass it to Google's OAuth2 `token` endpoint. Using one of Google's client libraries will make this easier.

Pass the token in a header with every call: `Authorization: Bearer <token>`

### Generating an OpenID Connect ID token: 

First make sure you have vault set up on your computer. Instructions for how to do that can be found [here](../Vault.md).

At that point, you can run `node scripts/makeBearerToken.js "$(vault read --format=json secret/dsde/terra/envs/common/bueller-user-service-account-key | jq .data)" https://terra-bueller.appspot.com`, which will output an OpenID Connect ID token.

## Running tests

In addition to the bearer token described above, you'll need three things to run a test:
1. A `targetEnv` against which to run the tests (`dev`|`alpha`|`perf`|`staging`)
1. A `testGroup` label of your choosing; you will use this to query the results database
1. A version-specific base URL for bueller, e.g. `https://20200721t071912-dot-terra-bueller.appspot.com/`

You can find the base URL at https://console.cloud.google.com/appengine/versions?project=terra-bueller&serviceId=default. Using the default `terra-bueller.appspot.com` URL could lead to unpredictable results if Bueller is redeployed in the middle of a long-running batch of requests. Therefore, Bueller requires choosing a specific version.

Once you have all of these inputs, you can construct a request to run a single test once, for example using the following `curl` command:
 
```bash
curl --request POST \
  --url 'https://20200721t071912-dot-terra-bueller.appspot.com/test/find-workflow?targetEnv=dev&testGroup=breilly-20200721' \
  --header 'Authorization: Bearer ...'
```

To group the results of several concurrent test executions (e.g. for a performance test), you can script multiple requests with the same `testGroup`.

## Querying Test Results

Test results are stored in Firestore in the terra-bueller Google Cloud project: https://console.cloud.google.com/firestore/data?project=terra-bueller. GCP does not provide a UI for querying Firestore, but you can write code to perform queries as described at https://cloud.google.com/firestore/docs/query-data/queries.

Another option is to export the test results and import them into BigQuery. Instructions are at:
* Exporting from Firestore: https://cloud.google.com/firestore/docs/manage-data/export-import
* Importing to BigQuery: https://cloud.google.com/bigquery/docs/loading-data-cloud-firestore

Quickstart:
1. gcloud --project terra-bueller firestore export gs://terra-bueller-test-exports --collection-ids=tests
1. Starting at https://console.cloud.google.com/storage/browser/terra-bueller-test-exports?project=terra-bueller, find the export by timestamp, open the `all_namespaces/kind_tests` folder, locate the `all_namespaces_kind_tests.export_metadata` object, and copy its `gs://` URL
1. From https://console.cloud.google.com/bigquery?project=terra-bueller&p=terra-bueller&d=tests&page=dataset, click `[+] CREATE TABLE`:
    * Source > Create table from: `Google Cloud Storage`
    * Source > Select file from GCS bucket: `gs://` path to `all_namespaces_kind_tests.export_metadata` object
    * Source > File format: `Cloud Datastore Backup`
    * Destination > Table name: A table name of your choosing
    * [optional] Advanced options > Write preference: `Overwrite table` if you are replacing an existing table
    * click `Create table`

You can now query the test result data using SQL, for example:
```app engine dockerfile template
SELECT testName, status, runtimeInMilliseconds, error.name, error.message, error.stack FROM `terra-bueller.tests.my_export_2020_07_21` WHERE testGroup = 'my_group' LIMIT 1000
```

## Developing

Install deps
```bash
yarn install
```

Start a dev server on port 8080 with auto-reload
```bash
GCP_PROJECT=terra-bueller GOOGLE_APPLICATION_CREDENTIALS=<path-to-key-file> \
TERRA_SA_KEY=$(vault read --format=json secret/dsde/alpha/common/firecloud-account.pem | jq .data) \
LYLE_SA_KEY=$(vault read --format=json secret/dsde/terra/envs/common/lyle-user-service-account-key | jq .data) \
yarn start-dev
```

Example of a curl command to run a test against a dev server:
```bash
curl --request POST --header \
"Authorization: Bearer $(node scripts/makeBearerToken.js \
"$(vault read --format=json secret/dsde/terra/envs/common/bueller-user-service-account-key | jq .data)" \
 https://terra-bueller.appspot.com)" --url "http://localhost:8080/test/find-workflow?targetEnv=dev"
```
