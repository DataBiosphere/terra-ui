#!/bin/bash

# Exit script if you try to use an uninitialized variable.
set -o nounset

# Use the error status of the first failure, rather than that of the last item in a pipeline.
set -o pipefail

# Wait up to 15 minutes for job to finish
x=0
NODE_INDEX=0
while [[ $x -le 30 ]]; do
  # Find number of nodes still is running
  runningNodesCount=$(curl -s "https://circleci.com/api/v2/project/github/DataBiosphere/terra-ui/job/$CIRCLE_BUILD_NUM" --header 'Circle-Token: "'$CIRCLECI_TOKEN'"' | jq -r '.parallel_runs[] | select(.index != "'$NODE_INDEX'") | select(.status == "running")' | grep "running" | wc -l)
  if [[ $runningNodesCount -eq 0 ]]; then
    exit 0
  fi

  sleep 10
  x=$(($x + 10))
done

echo "Waited $x seconds"
date

# Something is wrong. Log response for error troubleshooting
if [[ x -ge 900 ]]; then
  curl -s "https://circleci.com/api/v2/project/github/DataBiosphere/terra-ui/job/$CIRCLE_BUILD_NUM" --header 'Circle-Token: "'$CIRCLECI_TOKEN'"' | jq -r '.'
  echo "Wait time exceeded 15 minutes. This is unexpected. Job: \"$CIRCLE_JOB\"."
  exit 1
fi
