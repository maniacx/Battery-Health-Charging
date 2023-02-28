#!/bin/bash

# Change working directory to project folder
cd "${0%/*}"

echo "Disabling extension."
gnome-extensions reset Battery-Health-Charging@maniacx.github.com

echo "Resetting extension."
gsettings --schemadir /home/$USER/.local/share/gnome-shell/extensions/Battery-Health-Charging@maniacx.github.com/schemas reset-recursively org.gnome.shell.extensions.Battery-Health-Charging

echo "Restarting shell"
killall -3 gnome-shell
sleep 4
echo "Restarting enable extension"
gnome-extensions enable Battery-Health-Charging@maniacx.github.com
