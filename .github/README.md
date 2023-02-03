![screenshot](https://github.com/maniacx/Battery-Health-Charging/raw/main/.github/Battery-Health-Charging.png)

Battery Health Charging extension for GNOME shell
=================================================
Battery Health Charging extension sets the limit of battery charging to maximize battery health mainly for Asus laptop.
Since users usually keep their AC adapter connected while using their laptop, the battery is often in a state of  high-power(98-100%) for extended length of time which causes a reduction in battery life.
Similar to the MyAsus app on Windows OS, you can set the limit to stop charging at one of the 3 following modes.

**1. Full Capacity Mode (100%):** Battery is charged to its full capacity for longer use on battery power.

**2. Balanced Mode (80%):** Stops charging when power is above 80% and resumes charging when power is below 78%. This mode is recommended when using the Notebook on battery power during meetings or conferences.

**3. Maximum Lifespan Mode (60%):** Stops charging when power is above 60% and resumes charging when power is below 58%. This mode is recommended when the Notebook is always powered by AC adapter.

### Compatibilty
Compatible with Asus laptops and probably other which has only `charging stop threshold` and doesn't have `charging start threshhold`.
You can simply check if your device is compatible, and have the following node by executing this in terminal.
```bash
ls /sys/class/power_supply/BAT0
```
If you find a node name `charge_control_end_threshold` and do not find node named `charge_control_start_threshold` then this extension is compatible with your device.
### Installation from git
```bash
    git clone https://github.com/maniacx/Battery-Health-Charging
    cd Battery-Health-Charging
    ./install.sh
```
Restart GNOME Shell by `Alt+F2`, `r`, `Enter` for Xorg or `Logout/Login` for Wayland.
Enable the extension through gnome-extension-manager.
Go to Battery Health Charging Settings to install service
Install service from my clicking "Install" under Installation. Logout and Enjoy!

Note: Remember to uninstall this service before uninstalling this extension by clicking on "Remove" under installation.

The service installed is a simple systemd service which on every boot changes the permission of "charge_control_end_threshold" so that users can edit it without root privileged.

### Translation
Open the po/main.pot file on github. It contains each text displayed in this  extension. Submit the information by raising an issue for this repo on github. You can also compile the translation file yourself and test it on your device.
Tutorial: https://youtu.be/WmWjwE-M4D0

### Credits
I am not a developer. I made this extension for my Asus Viwobook. I have look into codes of other extension to create this extension. Credits to them.

Thinkpad Battery Threshold -by marcosdalvarez
https://gitlab.com/marcosdalvarez/thinkpad-battery-threshold-extension

Supergfxctl (Super Graphics Control) - Asus-linux
https://gitlab.com/asus-linux/supergfxctl
Just to mention Supergfxctl is a great extension for laptops with dual GPU's. You can switch off dedicatedGPU when not needed for optimal battery and thermals.

More info about battery life on asus official site
https://www.asus.com/support/FAQ/1032726/
