#!/bin/bash

# installer.sh - This script installs a policykit rule for the Shutdown Timer gnome-shell extension.
#
# This file is part of the gnome-shell extension ShutdownTimer@Deminder.

# Authors: Martin Koppehel <psl.kontakt@gmail.com>, Fin Christensen <christensen.fin@gmail.com> (cpupower extension), Deminder <tremminder@gmail.com>

set -e

################################
# EXTENSION SPECIFIC OPTIONS:  #
################################

EXTENSION_NAME="Battery Health Charging"
ACTION_BASE="dem.batteryhealthcharging"
RULE_BASE="$ACTION_BASE.setthreshold"
CFC_BASE="batteryhealthchargingctl"
POLKIT_DIR="polkit"
VERSION=1


EXIT_SUCCESS=0
EXIT_INVALID_ARG=1
EXIT_FAILED=2
EXIT_NEEDS_UPDATE=3
EXIT_NEEDS_SECURITY_UPDATE=4
EXIT_NOT_INSTALLED=5
EXIT_MUST_BE_ROOT=6

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )" #stackoverflow 59895

export TEXTDOMAINDIR="$DIR/../locale"
export TEXTDOMAIN="Battery-Health-Charging@maniacx.github.com"
function gtxt() {
    gettext "$1"
}

function recent_polkit() {
    printf -v versions '%s\n%s' "$(pkaction --version | cut -d' ' -f3)" "0.106"
    if [[ $versions != "$(sort -V <<< "$versions")" ]];then
        echo "available"
    else
        echo "unavailable"
    fi
}

function check_support() {
    RECENT_STR=", stand-alone polkit rules $(recent_polkit)"
    if which rtcwake >/dev/null 2>&1
    then
        echo "rtcwake supported${RECENT_STR}"
        exit ${EXIT_SUCCESS}
    else
        echo "rtcwake unsupported${RECENT_STR}"
        exit ${EXIT_FAILED}
    fi
}

function fail() {
    echo "$(gtxt "Failed")${1}" >&2 && exit ${EXIT_FAILED}
}
DEFAULT_SUCCESS_MSG=$(gtxt 'Success')

function success() {
    echo -n "${1:-$DEFAULT_SUCCESS_MSG}"
    echo -e "\U1F7E2"
}



########################
# GENERALIZED SCRIPT:  #
########################

function usage() {
    echo "Usage: installer.sh [options] {supported,install,check,update,uninstall}"
    echo
    echo "Available options:"
    echo "  --tool-user USER   Set the user of the tool (default: \$USER)"
    echo
    exit ${EXIT_INVALID_ARG}
}

if [ $# -lt 1 ]
then
    usage
fi

ACTION=""
TOOL_USER="$USER"
while [[ $# -gt 0 ]]
do
    key="$1"

    # we have to use command line arguments here as pkexec does not support
    # setting environment variables
    case $key in
        --tool-user)
            TOOL_USER="$2"
            shift
            shift
            ;;
        supported|install|check|update|uninstall)
            if [ -z "$ACTION" ]
            then
                ACTION="$1"
            else
                echo "Too many actions specified. Please give at most 1."
                usage
            fi
            shift
            ;;
        *)
            echo "Unknown argument $key"
            usage
            ;;
    esac
done


CFC_DIR="/usr/local/bin"
RULE_DIR="/etc/polkit-1/rules.d"

RULE_IN="${DIR}/../${POLKIT_DIR}/10-$RULE_BASE.rules"
if [[ "$(recent_polkit)" != "available" ]];then
    RULE_IN="${RULE_IN}.legacy"
    ACTION_IN="${DIR}/../${POLKIT_DIR}/${ACTION_BASE}.policy.in"
fi
TOOL_IN="${DIR}/$CFC_BASE"

TOOL_OUT="${CFC_DIR}/${CFC_BASE}-${TOOL_USER}"
RULE_OUT="${RULE_DIR}/10-${RULE_BASE}-${TOOL_USER}.rules"
ACTION_ID="${RULE_BASE}.${TOOL_USER}"
ACTION_OUT="/usr/share/polkit-1/actions/${ACTION_ID}.policy"

function print_policy_xml() {
    sed -e "s:{{PATH}}:${TOOL_OUT}:g" \
        -e "s:{{ACTION_BASE}}:${ACTION_BASE}:g" \
        -e "s:{{ACTION_ID}}:${ACTION_ID}:g" "${ACTION_IN}"
}

function print_rules_javascript() {
    if [[ "$RULE_IN" == *.legacy ]]; then
        sed -e "s:{{RULE_BASE}}:${RULE_BASE}:g" "${RULE_IN}"
    else
        sed -e "s:{{TOOL_OUT}}:${TOOL_OUT}:g" \
            -e "s:{{TOOL_USER}}:${TOOL_USER}:g" "${RULE_IN}"
    fi

}

if [ "$ACTION" = "supported" ]
then
    check_support
fi

if [ "$ACTION" = "check" ]
then
    if ! print_rules_javascript | cmp --silent "${RULE_OUT}"
    then
        if [ -f "${ACTION_OUT}" ]
        then
            echo "Your $EXTENSION_NAME installation needs updating!"
            exit ${EXIT_NEEDS_UPDATE}
        else
            echo "Not installed"
            exit ${EXIT_NOT_INSTALLED}
        fi
    fi
    echo "Installed"

    exit ${EXIT_SUCCESS}
fi

TOOL_NAME=$(basename ${TOOL_OUT})

if [ "$ACTION" = "install" ]
then
    if [ "${EUID}" -ne 0 ]; then
        echo "The install action must be run as root for security reasons!"
        echo "Please have a look at https://github.com/martin31821/cpupower/issues/102"
        echo "for further details."
        exit ${EXIT_MUST_BE_ROOT}
    fi

    echo -n "$(gtxt 'Installing') ${TOOL_NAME} $(gtxt 'tool')... "
    mkdir -p "${CFC_DIR}"
    install "${TOOL_IN}" "${TOOL_OUT}" || fail
    success

    if [ ! -z "$ACTION_IN" ];then
        echo "$(gtxt 'Using legacy policykit install')..."
        echo -n "$(gtxt 'Installing') $(gtxt 'policykit action')..."
        (print_policy_xml > "${ACTION_OUT}" 2>/dev/null && chmod 0644 "${ACTION_OUT}") || fail
        success
    fi

    echo -n "$(gtxt 'Installing') $(gtxt 'policykit rule')..."
    mkdir -p "${RULE_DIR}"
    (print_rules_javascript > "${RULE_OUT}" 2>/dev/null && chmod 0644 "${RULE_OUT}")  || fail
    success

    exit ${EXIT_SUCCESS}
fi

if [ "$ACTION" = "update" ]
then
    "${BASH_SOURCE[0]}" --tool-user "${TOOL_USER}" uninstall || exit $?
    "${BASH_SOURCE[0]}" --tool-user "${TOOL_USER}" install || exit $?

    exit ${EXIT_SUCCESS}
fi

if [ "$ACTION" = "uninstall" ]
then
    LEG_CFG_OUT="/usr/bin/batteryhealthchargingctl-$TOOL_USER"
    if [ -f "$LEG_CFG_OUT" ]
    then
        # remove legacy "tool" install
        echo -n "$(gtxt 'Uninstalling') $(gtxt 'tool')..."
        rm "${LEG_CFG_OUT}" || fail " - $(gtxt 'cannot remove') ${LEG_CFG_OUT}" && success
    fi

    if [ -f "$ACTION_OUT" ]
    then
        # remove legacy "policykit action" install
        echo -n "$(gtxt 'Uninstalling') $(gtxt 'policykit action')..."
        rm "${ACTION_OUT}" || fail " - $(gtxt 'cannot remove') ${ACTION_OUT}" && success
    fi
    LEG_RULE_OUT="/usr/share/polkit-1/rules.d/10-dem.batteryhealthcharging.setthreshold.rules"
    if [ -f "$LEG_RULE_OUT" ]
    then
        # remove legacy "policykit action" install
        echo -n "$(gtxt 'Uninstalling') $(gtxt 'policykit rule')..."
        rm "${LEG_RULE_OUT}" || fail " - $(gtxt 'cannot remove') ${LEG_RULE_OUT}" && success
    fi

    echo -n "$(gtxt 'Uninstalling') ${TOOL_NAME} $(gtxt 'tool')... "
    if [ -f "${TOOL_OUT}" ]
    then
        rm "${TOOL_OUT}" || fail " - $(gtxt 'cannot remove') ${TOOL_OUT}" && success
    else
        echo "$(gtxt 'tool') $(gtxt 'not installed at') ${TOOL_OUT}"
    fi

    echo -n "$(gtxt 'Uninstalling') $(gtxt 'policykit rule')... "
    if [ -f "${RULE_OUT}" ]
    then
        rm "${RULE_OUT}" || fail " - $(gtxt 'cannot remove') ${RULE_OUT}" && success
    else
        echo "$(gtxt 'policy rule') $(gtxt 'not installed at') ${RULE_OUT}"
    fi

    exit ${EXIT_SUCCESS}
fi

echo "Unknown parameter."
usage
