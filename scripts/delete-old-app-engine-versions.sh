#!/bin/bash
#
# Deletes old Google App Engine deployments of Terra UI in an environment. You
# MUST have jq installed to be able to use this script.
#
# USAGE: ./delete-old-app-engine-versions.sh ENV
#   ENV must be one of dev, alpha, or staging
#

set -eu
set -o pipefail

# check if colors are supported in the terminal
check_color_support() {
    NCOLORS=$(tput colors)
    if [ "$NCOLORS" -ge 8 ]; then
        BLD="$(tput bold)"
        RED="$(tput setaf 1)"
        GRN="$(tput setaf 2)"
        RST="$(tput sgr0)"
    else
        BLD=""
        RED=""
        GRN=""
        RST=""
    fi
    INFO="${BLD}+${RST}"
}

# print out usage to stdout
usage() {
    printf "Usage: %s ${BLD}ENV${RST}\n  ${BLD}ENV${RST} must be one of dev, alpha, or staging\n" "$0"
    exit 0
}

# print out error with help message to stderr and exit
error() {
    printf "${RED}ERROR: %s${RST}\n\nTry ${BLD}%s --help${RST} to see a list of all options.\n" "$1" "$0" >&2
    exit 1
}

# print out error to stderr and exit
abort() {
    printf "${RED}ABORT: %s${RST}\n" "$1" >&2
    exit 1
}

# ensure that jq is installed
check_jq_installed() {
    if ! jq --version 1>/dev/null 2>&1; then
        abort "jq v1.6 or above is required; install jq to continue"
    fi
}

# ensure that gcloud is installed
check_gcloud_installed() {
    if ! gcloud --version 1>/dev/null 2>&1; then
        abort "gcloud is required; install google-cloud-sdk to continue"
    fi
}

# ensure that user has appropriate permissions for app engine
check_user_permissions() {
    FAKE_VERSION="example-invalid-version-for-permission-testing"
    if ! gcloud app versions delete "${FAKE_VERSION}" --project="${NEW_PROJECT}" 1>/dev/null 2>&1; then
        GCLOUD_USER=$(gcloud config get-value account)
        abort "User ${GCLOUD_USER} does not have permissions in ${NEW_PROJECT}"
    fi
}

# convert unix epoch to year-month-day date
unix_epoch_to_date() {
    echo "$1" | jq -r '. | strftime("%Y-%m-%d")'
}

# ensure that the deletion date is always older than the oldest pr date
set_dev_deletion_date() {
    OLDEST_PR=$(gcloud app versions list --filter="pr-" --project="${NEW_PROJECT}" --format=json | jq '. |= sort_by(.last_deployed_time.datetime) | first')
    OLDEST_PR_NAME=$(echo "${OLDEST_PR}" | jq -r '.id')
    OLDEST_PR_TIME=$(echo "${OLDEST_PR}" | jq -r '.last_deployed_time.datetime | sub(":00$";"00") | strptime("%Y-%m-%d %H:%M:%S%z") | mktime')
    OLDEST_PR_DATE=$(unix_epoch_to_date "${OLDEST_PR_TIME}")

    printf "${INFO} ${GRN}%s${RST} is the oldest PR and was deployed on ${GRN}%s${RST}\n" "${OLDEST_PR_NAME}" "${OLDEST_PR_DATE}"

    OLDEST_PR_DELETION_TIME=$(echo "${OLDEST_PR_TIME}" | jq -r '. - (24 * 60 * 60)') # 1 day
    if [ "${DELETION_TIME}" -gt "${OLDEST_PR_DELETION_TIME}" ]; then
        DELETION_DATE=$(unix_epoch_to_date "${OLDEST_PR_DELETION_TIME}")
    fi
}

# return versions of app engine that match filter
filter_app_engine_versions() {
    gcloud app versions list --filter="$1" --project="${NEW_PROJECT}" --format=json 2>/dev/null | jq -r '.[].version.id'
}

# ensure that deletions leave a certain number of deployments
check_remaining_items() {
    REMAIN_LIST_ITEMS=($(filter_app_engine_versions "version.createTime.date('%Y-%m-%d', Z)>'${DELETION_DATE}'"))
    REMAIN_LIST_COUNT="${#REMAIN_LIST_ITEMS[@]}"
    if [ "$REMAIN_LIST_COUNT" -lt 5 ]; then
        abort "less than 5 deployments would remain"
    fi
}

# ensure that deletions erase a certain number of deployments
check_deletion_items() {
    DELETE_LIST_ITEMS=($(filter_app_engine_versions "version.createTime.date('%Y-%m-%d', Z)<='${DELETION_DATE}'"))
    DELETE_LIST_COUNT="${#DELETE_LIST_ITEMS[@]}"
    if [ "${DELETE_LIST_COUNT}" -lt 1 ]; then
        abort "no deployments to delete"
    elif [ "${DELETE_LIST_COUNT}" -lt 10 ]; then
        abort "less than 10 deployments to delete"
    fi
}

# run preflight checks to minimize deletion errors
deletion_preflight_checks() {
    check_remaining_items
    check_deletion_items
}

# print out a summary of the deployments that will be affected
deletion_preflight_summary() {
    printf "${INFO} This script will ${GRN}keep %d${RST} deployments and ${RED}delete %d${RST} deployments\n" "${REMAIN_LIST_COUNT}" "${DELETE_LIST_COUNT}"
    printf "${INFO} Deployments to keep (check this list):\n[ %s ]\n\n" "${REMAIN_LIST_ITEMS[*]}"
}

# actually execute the deletion process
execute_delete() {
    printf "${RED}THIS OPERATION WILL IRREVERSIBLY DELETE ${DELETE_LIST_COUNT} DEPLOYMENTS FROM %s AND EARLIER IN THE ${NEW_PROJECT} PROJECT.${RST}\n" "${DELETION_DATE}"
    gcloud app versions delete "${DELETE_LIST_ITEMS[@]}" --project="${NEW_PROJECT}"
}

check_color_support

check_jq_installed
check_gcloud_installed

if [ -z "${1+:}" ]; then
    usage
fi

case $1 in
    --help ) usage;;
    dev|alpha|staging ) ;;
    prod ) error "This script cannot be run against prod.";;
    * ) error "ENV must be one of dev, alpha, or staging";;
esac

NEW_PROJECT="bvdp-saturn-$1"

check_user_permissions

printf "${INFO} Selected project ${GRN}%s${RST}\n" "${NEW_PROJECT}"

DELETION_TIME=$(jq -n 'now - (10 * 24 * 60 * 60)') # 10 days
DELETION_DATE=$(unix_epoch_to_date "${DELETION_TIME}")
if [ "$1" == "dev" ]; then
    set_dev_deletion_date
fi
printf "${INFO} Set the deletion date to ${RED}%s and earlier${RST}\n" "${DELETION_DATE}"

deletion_preflight_checks
deletion_preflight_summary

execute_delete
