for d in */ ; do
    cd $d

    PACKAGE_NAME=$(node -p "require('./package.json').name")
    PACKAGE_VERSION=$(node -p -e "require('./package.json').version")
    echo "Will check if version ${PACKAGE_VERSION} of ${PACKAGE_NAME} should be published."

    PUBLISHED_VERSION=$(npm view "${PACKAGE_NAME}" version)
    echo "Current version of ${PACKAGE_NAME} in repository is ${PUBLISHED_VERSION}."

    if [[ ${PUBLISHED_VERSION} != ${PACKAGE_VERSION} ]]; then
      npm publish
      echo "Successfully published version ${PACKAGE_VERSION} of ${PACKAGE_NAME}."
    else
       echo "Version ${PACKAGE_VERSION} of ${PACKAGE_NAME} has already been published, so no new version has been published."
   fi
   echo " "
   cd ..
done
