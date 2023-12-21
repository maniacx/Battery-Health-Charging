#!/usr/bin/env bash

# Change working directory to project folder
cd "${0%/*}"

if ! command -v msgfmt &> /dev/null
then
    echo "Missing gettext!!!"
    echo "Please install gettext and re-run this installer"
    exit 1
fi

echo "Packing extension..."
gnome-extensions pack ./ \
    --extra-source=devices/ \
    --extra-source=icons/ \
    --extra-source=lib/ \
    --extra-source=resources/ \
    --extra-source=preferences/ \
    --extra-source=tool/ \
    --extra-source=ui/ \
    --podir=po \
    --force \

echo "Installing extension..."
gnome-extensions install Battery-Health-Charging@maniacx.github.com.shell-extension.zip --force

echo "Extension installed Battery Health Charging succesfully. Restart the shell (or logout) to be able to enable the extension."
