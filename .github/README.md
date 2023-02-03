![screenshot](https://github.com/maniacx/Battery-Health-Charging/raw/main/.github/Battery-Health-Charging.png)

Battery Health Charging extension for GNOME shell
=================================================
Battery Health Charging extension sets the limit of battery charging to maximize battery health mainly for Asus laptop.
Similar to the MyAsus app on Windows OS, you can set the limit to stop charging at 60% or 80% to improve your battery life.

### Compatibilty
Compatible with Asus laptops and probably other which has only `charging stop threshold` and doesn't have `charging start threshhold`.
You can simply check if your device is compatible, and have the following node by executing this in terminal.
```bash
ls /sys/class/power_supply/BAT0
```
If you find a node name `charge_control_end_threshold` and do not find node named `charge_control_start_threshold` then this extension is compatible with your device.

### Installation from git

    git clone https://github.com/maniacx/Battery-Health-Charging
    cd Battery-Health-Charging
    ./install.sh
    
Restart GNOME Shell by `Alt+F2`, `r`, `Enter` for Xorg or `Logout/Login` for Wayland.
Enable the extension through gnome-extension-manager.
Go to Battery Health Charging Settings to install service
Install service from my clicking "Install" under Installation. Logout and Enjoy!

Note: Remember to uninstall this service before uninstalling this extension by clicking on "Remove" under installation.

The service installed is a simple systemd service which on every boot changes the permission of "charge_control_end_threshold" so that users can edit it without root privileged.

### Credits
I am not a developer. I made this extension for my Asus Viwobook. I have look into codes of other extension to create this extension. Credits to them.

Thinkpad Battery Threshold -by marcosdalvarez
https://gitlab.com/marcosdalvarez/thinkpad-battery-threshold-extension

Supergfxctl (Super Graphics Control) - Asus-linux
https://gitlab.com/asus-linux/supergfxctl

Just to mention Supergfxctl is a great extension for laptops with dual GPU's. You can switch off dedicatedGPU when not needed for optimal battery and thermals.
