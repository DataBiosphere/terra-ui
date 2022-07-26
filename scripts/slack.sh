#!/bin/bash

scriptname=$0
function usage {
    echo ""
    echo "Description: Post a message to a Slack channel."
    echo "Usage: Set environment variable SLACK_BOT_TOKEN."
    echo "Usage: $scriptname --channel_id string --text string --blocks string "
    echo ""
    echo "  --channel_id string     Required: Slack channel id. If not set, read from env variable SLACK_CHANNEL_ID"
    echo "                          (Example: C7H40L71D)"
    echo "  --blocks     string     Required: JSON text"
    echo "                          (Example: https://app.slack.com/block-kit-builder)"
    echo ""
}

while [ $# -gt 0 ]; do
    if [[ $1 == "--"* ]]; then
        v="${1/--/}"
        declare "$v"="$2"
        shift
    fi
    shift
done

channel="${channel_id:-$SLACK_CHANNEL_ID}"
token="${SLACK_BOT_TOKEN}"


function terminate {
    printf "Script failed: %s\n\n" "$1"
    exit 1
}

if [[ -z $token ]]; then
    usage
    terminate "Missing environment variable SLACK_BOT_TOKEN"
elif [[ -z $channel ]]; then
    usage
    terminate "Missing parameter --channel_id"
elif [[ -z $blocks ]]; then
    usage
    terminate "Missing parameter --blocks"
fi


URL="https://slack.com/api/chat.postMessage"


function post() {
  curl \
    -H "Content-type: application/json; charset=utf8" \
    -H "Authorization: Bearer ${token}" \
    --data "{\"channel\": \"${channel}\", \"blocks\": ${blocks}}" \
    -X POST "${URL}"
}

# --data '{"channel":"C123456","blocks":[{"type":"section","text":{"type":"mrkdwn","text":"Hi I am a bot that can post *_fancy_* messages to any public channel."}}]}' \

post "$@"

#  "blocks": "'"${blocks}"'",
# "text": "'"${text}"'"}'
# curl -X POST -H 'Content-type: application/json' -H 'Authorization: Bearer '$TOKEN --data '{"channel":"$(params.channel)", "text":"$(params.message)"}' https://slack.com/api/chat.postMessage
