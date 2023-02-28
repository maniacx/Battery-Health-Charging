#!/bin/bash

# Change working directory to project folder
cd "${0%/*}"

echo "Packing extension..."
gnome-extensions pack ./ \
    --force \

echo "Disabling extension."
gnome-extensions reset example@maniacx.github.com

echo "Resetting extension."
gsettings --schemadir /home/$USER/.local/share/gnome-shell/extensions/example@maniacx.github.com/schemas reset-recursively org.gnome.shell.extensions.example

echo "Installing extension..."
gnome-extensions install example@maniacx.github.com.shell-extension.zip --force

echo "Extension installed Battery Health Charging succesfully. Restart the shell (or logout) to be able to enable the extension."
echo "Restarting shell"
killall -3 gnome-shell
sleep 4
echo "Restarting enable extension"
gnome-extensions enable example@maniacx.github.com
