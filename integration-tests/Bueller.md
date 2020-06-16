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