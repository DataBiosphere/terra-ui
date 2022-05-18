#!/bin/bash
#
# Deletes old Google App Engine deployments of Terra UI in an environment. You
# MUST have GNU date installed to be able to use this script.
#
# USAGE: ./delete-old-app-engine-versions.sh ENV
#   ENV must be one of dev, alpha, staging, or perf
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
    printf "Usage: %s ${BLD}ENV${RST}\n  ${BLD}ENV${RST} must be one of dev, alpha, staging, or perf\n" "$0"
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

# always reset gcloud project regardless of error or exit
reset() {
    gcloud config set project "${OLD_PROJECT}" 2>/dev/null
}

# ensure that date from GNU coreutils is installed
check_gnu_date_installed() {
    if ! date --version 1>/dev/null 2>&1; then
        abort "date from GNU coreutils is required"
    fi
}

# switch gcloud project to appropriate terra ui environment
switch_gcloud_project() {
    gcloud config set project "${NEW_PROJECT}" 2>/dev/null
    printf "${INFO} Switched the project to ${GRN}%s${RST}\n" "${NEW_PROJECT}"
}

# ensure that user has appropriate permissions for app engine
check_user_permissions() {
    if ! gcloud app services list 1>/dev/null 2>&1; then
        GCLOUD_USER=$(gcloud config get-value account)
        abort "User ${GCLOUD_USER} does not have permissions in ${NEW_PROJECT}"
    fi
}

# ensure that the deletion date is always older than the oldest pr date
set_dev_deletion_date() {
    OLDEST_PR=$(gcloud app versions list --filter="pr-" --sort-by="LAST_DEPLOYED" | tail -n +2 | head -n 1 | sed 's/ \+/ /g')
    OLDEST_PR_NAME=$(echo "${OLDEST_PR}" | cut -d' ' -f2)
    OLDEST_PR_DATE=$(echo "${OLDEST_PR}" | cut -d' ' -f4)
    OLDEST_PR_DATE=$(date --date="${OLDEST_PR_DATE}" +%F)

    printf "${INFO} ${GRN}%s${RST} is the oldest PR and was deployed on ${GRN}%s${RST}\n" "${OLDEST_PR_NAME}" "${OLDEST_PR_DATE}"

    UNIX_EPOCH_DELETION_DATE=$(date --date="${DELETION_DATE}" +%s)
    UNIX_EPOCH_OLDEST_PR_DATE="$(date --date="${OLDEST_PR_DATE}" +%s)"

    if [ "${UNIX_EPOCH_DELETION_DATE}" -gt "${UNIX_EPOCH_OLDEST_PR_DATE}" ]; then
        DELETION_DATE=$(date --date="${OLDEST_PR_DATE} -1 day" +%F)
    fi
}

# return versions of app engine that match filter
filter_app_engine_versions() {
    gcloud app versions list --filter="$1" 2>/dev/null | tail -n +2 | sed 's/ \+/ /g' | cut -d' ' -f2
}

# ensure that deletions leave a certain number of deployments
check_remaining_items() {
    REMAIN_LIST_ITEMS=($(filter_app_engine_versions "version.createTime.date('%Y-%m-%d', Z)>'${DELETION_DATE}'"))
    REMAIN_LIST_COUNT="${#REMAIN_LIST_ITEMS[@]}"
    if [ "${REMAIN_LIST_COUNT}" -lt 1 ]; then
        abort "all deployments would be deleted"
    elif [ "$REMAIN_LIST_COUNT" -lt 15 ]; then
        abort "less than 15 deployments would remain"
    fi
}

# ensure that deletions erase a certain number of deployments
check_deletion_items() {
    DELETE_LIST_ITEMS=($(filter_app_engine_versions "version.createTime.date('%Y-%m-%d', Z)<='${DELETION_DATE}'"))
    DELETE_LIST_COUNT="${#DELETE_LIST_ITEMS[@]}"
    if [ "${DELETE_LIST_COUNT}" -lt 1 ]; then
        abort "no deployments to delete"
    elif [ "${DELETE_LIST_COUNT}" -lt 30 ]; then
        abort "less than 30 deployments to delete"
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
    printf "${BLD}gcloud app versions delete %s${RST}\n" "${DELETE_LIST_ITEMS[*]}"
}

# ensure that a deletion phrase must be entered correctly before continuing
enter_deletion_phrase() {
    DELETION_PHRASE="yes delete ${DELETE_LIST_COUNT} deployments in ${ENV_TO_EXEC}"
    printf "${RED}THIS OPERATION WILL IRREVERSIBLY DELETE ${DELETE_LIST_COUNT} DEPLOYMENTS FROM %s AND EARLIER IN THE ${NEW_PROJECT} PROJECT.${RST}\n" "${DELETION_DATE}"
    printf "${INFO} To continue with the deletion process, type: ${BLD}%s${RST}\n" "${DELETION_PHRASE}"
    read -r ACTUAL_PHRASE
    if [ "${ACTUAL_PHRASE}" = "${DELETION_PHRASE}" ]; then
        execute_delete
    else
        abort "mistyped phrase"
    fi
}

check_color_support

check_gnu_date_installed

if [ -z "${1+:}" ]; then
    usage
fi

case $1 in
    --help ) usage;;
    dev|alpha|staging|perf ) ;;
    prod ) error "This script cannot be run against prod.";;
    * ) error "ENV must be one of dev, alpha, staging, or perf";;
esac

OLD_PROJECT=$(gcloud config get-value project)
NEW_PROJECT="bvdp-saturn-$1"
ENV_TO_EXEC="$1"

trap reset EXIT

switch_gcloud_project
check_user_permissions

DELETION_DATE=$(date --date="-7 days" +%F)
if [ "$1" == "dev" ]; then
    set_dev_deletion_date
fi
printf "${INFO} Setting the deletion date to ${RED}%s and earlier${RST}\n" "${DELETION_DATE}"

deletion_preflight_checks
deletion_preflight_summary

enter_deletion_phrase
