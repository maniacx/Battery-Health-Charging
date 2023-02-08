![screenshot](https://github.com/maniacx/Battery-Health-Charging/raw/main/.github/Battery-Health-Charging.png)

Battery Health Charging extension for GNOME shell
=================================================
Battery Health Charging extension sets the limit of battery charging to maximize battery health mainly for Asus laptop.
Since users usually keep their AC adapter connected while using their laptop, the battery is often in a state of  high-power(98-100%) for extended length of time which causes a reduction in battery life.
Similar to the MyAsus app on Windows OS, you can set the limit to stop charging at one of the 3 following modes.

**1. Full Capacity Mode:** Battery is charged to its full capacity for longer use on battery power.

**2. Balanced Mode:** Stops charging when power is above 80% and resumes charging when power is below 78%. This mode is recommended when using the Notebook on battery power during meetings or conferences.

**3. Maximum Lifespan Mode:** Stops charging when power is above 60% and resumes charging when power is below 58%. This mode is recommended when the Notebook is always powered by AC adapter.

### Features
3 presets Full Capacity Mode, Balance Mode and Maximum Life Span mode.
For device with end threshold default values of these 3 preset mode are set at 100%, 80% and 60%
For device with end / start threshold default value is 100/98 % , 80/78 % and 60/58 %
The end and start threshold ( if device supports) are customizable.

For Full Capacity mode customized end value can be set from 90% to 100%.
The start threshold for all mode ( if device supports) can be set 2% to 10% lower of respective end threshold value
Similiarly for Balance mode end threshold can be set from  70% to 80%.
And for Maximum Life Span mode can be set from 60% to 50%.

### Compatibilty
Compatible with Asus laptops and probably other laptops end threshold or end/start thresholds.
The extension when enabled will inform you if it is compatible and guide ask you to install service if it is compatable.

Additionally you can simply check if your device is compatible, and have the following node by executing this in terminal.
```bash
ls /sys/class/power_supply/BAT0
```
If you find do not find a node/file named `charge_control_end_threshold` then this extension device is not compatible with your device.
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
Open the po/Battery-Health-Charging.pot file on github. It contains each text displayed in this  extension. Submit the information by raising an issue for this repo on github. You can also compile the translation file yourself and test it on your device.
Tutorial: https://youtu.be/WmWjwE-M4D0

### Bugs/Issue
Raise an issue on github.

### Credits
I am not a developer. I made this extension for my Asus Viwobook. I have look into codes of other extension to create this extension. Credits to them.

Thinkpad Battery Threshold -by marcosdalvarez
https://gitlab.com/marcosdalvarez/thinkpad-battery-threshold-extension

Supergfxctl (Super Graphics Control) - Asus-linux
https://gitlab.com/asus-linux/supergfxctl
Just to mention Supergfxctl is a great extension for laptops with dual GPU's. You can switch off dedicatedGPU when not needed for optimal battery and thermals.

More info about battery life on asus official site
https://www.asus.com/support/FAQ/1032726/
