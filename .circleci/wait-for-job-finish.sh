#!/usr/bin/env bash

# Exit script if you try to use an uninitialized variable.
set -o nounset

# Use the error status of the first failure, rather than that of the last item in a pipeline. Also fail explicitly on any exit code.
set -eo pipefail

counter=0

# Wait up to 30 minutes for job to finish. A job can run on multiple nodes: parallelism > 1
while [ "$counter" -le 1800 ]; do
  # Find number of nodes in running
  job_detail=$(curl -s "https://circleci.com/api/v2/project/github/DataBiosphere/terra-ui/job/$CIRCLE_BUILD_NUM")
  job_running_nodes_count=$(echo "$job_detail" | jq -r '[.parallel_runs[] | select(.status == "running") | select(.index != '"$CIRCLE_NODE_INDEX"')] | length')

  if [ "$job_running_nodes_count" -eq 0 ]; then
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
