#!/usr/bin/env bash

set -euo pipefail

SCRIPTS_DIR="$(dirname "$0")"
cd "${SCRIPTS_DIR}/../packages"
for d in */ ; do
    cd "$d"

    # Get the current package name and version from package.json.
    PACKAGE_NAME=$(node -p "require('./package.json').name")
    PACKAGE_VERSION=$(node -p -e "require('./package.json').version")
    echo "Will check if version ${PACKAGE_VERSION} of ${PACKAGE_NAME} should be published."

    # Look up the currently published version of the package in the registry.
    # npm view will fail if the package does not exist. This case needs to be handled
    # in order to support publishing new packages for the first time.
    set +e
    PUBLISHED_VERSION=$(npm --loglevel=error view "${PACKAGE_NAME}" version 2>&1)
    NPM_VIEW_STATUS=$?
    set -e
    if [ $NPM_VIEW_STATUS != 0 ]; then
      if echo "${PUBLISHED_VERSION}" | grep "E404" >/dev/null; then
        PUBLISHED_VERSION="unpublished"
      else
        echo "Unable to get published package version" >&2
        exit 1
      fi
    fi

    echo "Current version of ${PACKAGE_NAME} in repository is ${PUBLISHED_VERSION}."

    # If the current and published versions differ, then publish the package.
    if [ "${PUBLISHED_VERSION}" != "${PACKAGE_VERSION}" ]; then
      echo "Building ${PACKAGE_NAME}."
      yarn build

      echo "Publishing ${PACKAGE_NAME}."
      npm publish
      echo "Successfully published version ${PACKAGE_VERSION} of ${PACKAGE_NAME}."
    else
       echo "Version ${PACKAGE_VERSION} of ${PACKAGE_NAME} has already been published, so no new version has been published."
   fi
   echo " "
   cd ..
done
