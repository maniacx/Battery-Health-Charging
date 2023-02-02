#!/bin/bash

# Change working directory to project folder
cd "${0%/*}"

echo "Packing extension..."
gnome-extensions pack ./ \
    --extra-source=icons/ \
    --extra-source=resources/ \
    --extra-source=driver.js \
    --extra-source=preference.ui \
    --extra-source=LICENSE.md \
    --force \

echo "Installing extension..."
gnome-extensions install Battery-Health-Charging@maniacx.github.com.shell-extension.zip --force

echo "Extension installed Battery Health Charging Limit succesfully. Restart the shell (or logout) to be able to enable the extension."
