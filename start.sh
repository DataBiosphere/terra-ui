#!/bin/sh

set -eu

echo "Building packages..."
build_packages_output=$(mktemp)
set +e
FORCE_COLOR=true yarn build-packages >"$build_packages_output" 2>&1
build_packages_exit_code=$?
set -e

if [ $build_packages_exit_code -ne 0 ]; then
  echo "Failed to build packages"
  cat "$build_packages_output"
  rm "$build_packages_output"
  exit 1
fi
rm "$build_packages_output"

echo "Saving build info..."
yarn save-build-info

echo "Starting dev server..."
yarn run vite
