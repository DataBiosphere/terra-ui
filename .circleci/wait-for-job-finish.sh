#!/usr/bin/env bash

# Exit script if you try to use an uninitialized variable.
set -o nounset

# Use the error status of the first failure, rather than that of the last item in a pipeline. Also fail explicitly on any exit code.
set -eo pipefail

trap 's=$?; echo -e >&2 "\nError in $0:\nat line "$LINENO": $BASH_COMMAND"; exit $s' ERR

echo "Starting wait-for-job-finish script"

date
counter=0
URL_BASE="https://circleci.com/api/v2/project/github/DataBiosphere/terra-ui"

# Wait up to 25 minutes for job to finish. A job can run on multiple nodes: parallelism > 1
while [ "$counter" -le 1500 ]; do
  # Get job details
  job_detail=$(curl -s "$URL_BASE/job/$CIRCLE_BUILD_NUM")

  # Wait for all nodes with status==running excluding self node
  nodes=$(echo "$job_detail" | jq -r '.parallel_runs[]')
  running_nodes=$(echo "$nodes" | jq -r --arg IDX "$CIRCLE_NODE_INDEX" 'select(.status=="running") | select(.index|tostring!=$IDX)')
  count=$(echo "$running_nodes" | grep -c -e "running" || test $? = 1;)
  if [ "$count" -eq 0 ]; then
      echo "Checking from NODE_INDEX #$CIRCLE_NODE_INDEX: Parallel running nodes have finished. Waited $counter seconds."
      echo "$nodes"
      exit 0
  fi

  echo "Waiting for parallel running nodes to finish. Sleep 10 seconds."
  sleep 10
  counter=$(($counter + 10))
done

# Something is wrong. Log response for error troubleshooting
curl -s "https://circleci.com/api/v2/project/github/DataBiosphere/terra-ui/job/$CIRCLE_BUILD_NUM" | jq -r '.'
echo "ERROR: Exceeded maximum wait time 25 minutes."
exit 1
