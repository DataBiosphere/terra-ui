#!/bin/bash

# Exit script if you try to use an uninitialized variable.
set -o nounset

# Exit script if a statement returns a non-true return value.
set -o errexit

# Use the error status of the first failure, rather than that of the last item in a pipeline.
set -o pipefail

# Wait up to 15 minutes for job to finish
x=0
while [[ $x -le 900 ]]; do
  status=$(curl --request
            GET "https://circleci.com/api/v2/workflow/$CIRCLE_WORKFLOW_ID/job" \
            --header "Circle-Token: $CIRCLECI_TOKEN" \
            | jq -r '.items[] | select(.name == "'$CIRCLE_JOB'") | .status' \
          )
  echo "$CIRCLE_JOB Job Status: ${status}"
  if [[ $status == "success" ]] || [[ $status == "failed" ]]; then
    break
  fi
  if [[ $status == "canceled" ]]; then
    circleci-agent step halt
  fi

  sleep 10
  x=$(($x + 10))
done

echo "Waited $x seconds"
date

# Is job stuck?
if [[ x -ge 900 ]]; then
  echo "Job may be stuck in Running. Exit CircleCI now."
  exit 1
fi
