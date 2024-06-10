#!/usr/bin/env bash

# Exit script if you try to use an uninitialized variable.
set -o nounset

# Use the error status of the first failure, rather than that of the last item in a pipeline. Also fail explicitly on any exit code.
set -eo pipefail

# Because terra-ui is a public repository on GitHub, API token is not required. See: https://circleci.com/docs/oss#security
BASE_URL="https://circleci.com/api/v1.1/project/github/DataBiosphere/terra-ui"

counter=0

# Wait up to 30 minutes for job to finish. A job can run on multiple nodes: parallelism > 1
while [ "$counter" -le 1800 ]; do
  # Find number of nodes in running
  job_detail=$(curl -s "$BASE_URL/$CIRCLE_BUILD_NUM")
  ui_test_step=$(echo "$job_detail" | jq -r '.steps[] | select(.name=="Running UI integration tests")')
  running_nodes_count=$(echo "$ui_test_step" | jq -r '[.actions[] | select(.status == "running") | select(.index != '"$CIRCLE_NODE_INDEX"')] | length')
  
  if [ "$running_nodes_count" -eq 0 ]; then
    exit 0
  fi

  sleep 30
  counter=$(($counter + 30))
done

echo "Waited total $counter seconds"
date

# Something is wrong. Log response for error troubleshooting
curl -s "https://circleci.com/api/v2/project/github/DataBiosphere/terra-ui/job/$CIRCLE_BUILD_NUM" | jq -r '.'
echo "ERROR: Exceeded maximum waiting time 25 minutes."
exit 1
