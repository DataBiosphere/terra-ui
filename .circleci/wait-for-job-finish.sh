#!/usr/bin/env bash

# Exit script if you try to use an uninitialized variable.
set -o nounset

# Use the error status of the first failure, rather than that of the last item in a pipeline.
set -o pipefail

counter=0

# Wait up to 7 minutes for job to finish. A job can run on multiple nodes: parallelism > 1
while [ "$counter" -le 420 ]; do
  # Find number of nodes in running
  job_detail=$(curl -s "https://circleci.com/api/v2/project/github/DataBiosphere/terra-ui/job/$CIRCLE_BUILD_NUM" --header 'Circle-Token: "'"$CIRCLECI_USER_TOKEN"'"')
  job_running_nodes_count=$(echo "$job_detail" | jq -r '.parallel_runs[] | select(.status == "running") | select(.index != '"$CIRCLE_NODE_INDEX"')' | grep -c "running")

  if [ "$job_running_nodes_count" -eq 0 ]; then
    exit 0
  fi

  sleep 10
  counter=$(($counter + 10))
done

echo "Waited total $counter seconds"
date

# Something is wrong. Log response for error troubleshooting
curl -s "https://circleci.com/api/v2/project/github/DataBiosphere/terra-ui/job/$CIRCLE_BUILD_NUM" --header 'Circle-Token: "'"$CIRCLECI_USER_TOKEN"'"' | jq -r '.'
echo "ERROR: Exceeded maximum waiting time 7 minutes."
exit 1
