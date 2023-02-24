![Battery-Health-Charging](https://github.com/maniacx/Battery-Health-Charging/blob/main/.github/Battery-Health-Charging.gif)

Battery Health Charging extension for GNOME shell
=================================================
Battery Health Charging extension sets the limit of battery charging to maximize battery health mainly for laptops that support this features.
Since users usually keep their AC adapter connected while using their laptop, the battery is often in a state of  high-power(98-100%) for extended length of time which causes a reduction in battery life. Inititially I made this for my laptop (Asus) but as of **Version 4** , the extension evolve to support several brands. Some laptops have fixed threshold, some laptops threshold can be customised. (See details in laptop supported). This extension detects the hardware and displays option accordingly.

Similar to the MyAsus app on Windows OS, you can set the limit to stop charging at one of the 3 following modes.

**1. Full Capacity Mode:** Battery is charged to its full capacity for longer use on battery power.

**2. Balanced Mode:** Stops charging when power is above 80% and resumes charging when power is below 78%. This mode is recommended when using the Notebook on battery power during meetings or conferences. (Some laptop don't features this option)

**3. Maximum Lifespan Mode:** Stops charging when power is above 60% and resumes charging when power is below 58%. This mode is recommended when the Notebook is always powered by AC adapter.

## Features
##### Asus, AppleSMC
* 3 presets Full Capacity Mode, Balance Mode and Maximum Life Span mode.
* Default threshold values of these 3 preset mode are set at 100%, 80% and 60%.
* Each preset values can be customised default value is 100-90 % , 80/70 % and 60/50 %.

##### Thinkpad Single /Dual Battery,  Huwaei
* 3 presets Full Capacity Mode, Balance Mode and Maximum Life Span mode.
* Default end/start threshold values of these 3 preset mode are set at 100/98%, 80/78% and 60/58%.
* Each preset values can be customised default value is 100-90 % , 80/70 % and 60/50 %.
* The start threshold for all mode can be set 2% to 10% lower of respective end threshold value

##### Lenovo
* 2 preset Full capacity and Maximum Life Span mode set at 100% and 60%. Fixed threshold (not customizable).

##### Samsung, LG, Toshiba, Acer
* 2 preset Full capacity and Maximum Life Span mode set at 100% and 80%. Fixed threshold (not customizable).

##### Sony
* 3 preset Full capacity and Maximum Life Span mode set at 100%, 80% and 50%. Fixed threshold (not customizable).

As of **Version 4** if your device needs **privileged access** (root) to change the threshold, this extension will prompt to install polkit script. This way the extension can change the threshold on users input and also restore it on system restarts.

## Usage
![Battery-Health-Charging](https://github.com/maniacx/Battery-Health-Charging/blob/main/.github/Usage.png)

## Compatibilty
Conflicts with other battery charging threshold controls apps / extensions / local workarounds scripts, so better to disable or remove before using this extension.
Devices which have one or more the below paths are compatible.
If your device has ability to change threshold using command line and is not listed or supported please raise an [issue](https://github.com/maniacx/Battery-Health-Charging/issues)
```bash
#Asus
'/sys/class/power_supply/BAT0/charge_control_end_threshold'
'/sys/class/power_supply/BAT1/charge_control_end_threshold'
'/sys/class/power_supply/BATC/charge_control_end_threshold'
'/sys/class/power_supply/BATT/charge_control_end_threshold'

# Thinkpad
'/sys/class/power_supply/BAT0/charge_control_end_threshold'
'/sys/class/power_supply/BAT0/charge_control_start_threshold'
'/sys/class/power_supply/BAT1/charge_control_end_threshold'
'/sys/class/power_supply/BAT1/charge_control_start_threshold'
'/sys/devices/platform/smapi/BAT0/stop_charge_thresh'
'/sys/devices/platform/smapi/BAT0/start_charge_thresh'
'/sys/devices/platform/smapi/BAT1/stop_charge_thresh'
'/sys/devices/platform/smapi/BAT1/start_charge_thresh'

# LG
'/sys/devices/platform/lg-laptop/battery_care_limit'

# Lenovo
'/sys/bus/platform/drivers/ideapad_acpi/VPC2004:00/conservation_mode'

# Sony
'/sys/devices/platform/sony-laptop/battery_care_limiter'

# Huwaei
'/sys/devices/platform/huawei-wmi/charge_thresholds'

# Samsung
'/sys/devices/platform/samsung/battery_life_extender'

# Acer
'/sys/bus/wmi/drivers/acer-wmi-battery/health_mode'

# Toshiba
'/sys/class/power_supply/BAT1/charge_control_end_threshold'

#AppleSMC
'/sys/class/power_supply/BAT0/charge_control_end_threshold'
```
## Installation from git
```bash
    git clone https://github.com/maniacx/Battery-Health-Charging
    cd Battery-Health-Charging
    ./install.sh
```
Restart GNOME Shell by `Alt+F2`, `r`, `Enter` for Xorg or `Logout/Login` for Wayland.
Enable the extension through gnome-extension-manager.
If no privileged access (root) is not needed to change threshold, you can start using the extension.

If root is needed, this extension will prompt to install polkit script. After installation it will prompt you to logout.
Logout re-login, and you can start using the extension.
***Note: Remember to uninstall this polkit script before uninstalling this extension by clicking on "Remove" under installation.***

## Polkit Installation / Deprecated Systemd Service from Version 3.
**PolKit Installation:** The extension will automatically detect if device needs privileged permission (root) to change threshold/mode.
If device require privileged permission (root), it will notify user to install polkit from extension settings.
If device doesn't require privileged permission (root) there will no prompt and option to install polkit.
Installing polkit will require privileged (root) access and will need to logout and re-login.

**Removal of Deprecated Systemd Service from Version 3:** In Version 3 or earlier, this extension required users to install systemd service to set threshold using privileged permission (root).
But as of version 4 and above this extension doesn't use systemd service (deprecated) and uses polkit instead for controlling threshold using privileged permission (root).

For users who installed this extension earlier than version 4, you will get a notiifed to remove the deprecated systemd service files.
To remove this service file click remove (privileged (root) access needed) and reboot the system.
Or if you rather remove it manually you can do so in command line. And rebooting the system
```bash
sudo rm -f /etc/systemd/system/multi-user.target.wants/mani-battery-health-charging.service
sudo rm -f /etc/systemd/system/mani-battery-health-charging.service
```
## Translation
Open the po/Battery-Health-Charging.pot file on github. It contains each text displayed in this  extension. You can use "poedit" app for adding your translation. Submit the information by raising an issue for this repo on github. You can also compile the translation file yourself and test it on your device.
Tutorial: https://youtu.be/WmWjwE-M4D0

## Bugs/Issue/Request feature
Raise an [issue](https://github.com/maniacx/Battery-Health-Charging/issues) on github.
I am also looking for to support Dell laptop (or other brands which can control threshold in linux) but need more info from users and volunteers to test.

## Credits and Reference
I am not a developer. I made this extension for my Asus Viwobook. I have look into codes of other extension to create this extension. Credits to them.

Thinkpad Battery Threshold -by marcosdalvarez
https://gitlab.com/marcosdalvarez/thinkpad-battery-threshold-extension

Supergfxctl (Super Graphics Control) - Asus-linux
https://gitlab.com/asus-linux/supergfxctl
Just to mention Supergfxctl is a great extension for laptops with dual GPU's. You can switch off dedicatedGPU when not needed for optimal battery and thermals.

Shutdown Timer - by Deminder
https://github.com/Deminder/ShutdownTimer
For polkit resources.

BlurMyshell - by Aunetx
https://github.com/aunetx/blur-my-shell

Dash-to-Dock - by micheleg
https://github.com/micheleg/dash-to-dock

More info about battery life on asus official site
https://www.asus.com/support/FAQ/1032726/

TLP - by linrunner
https://github.com/linrunner/TLP
For lot of resources about battery threshold.

Gnome guides
https://gjs.guide/extensions/development/creating.html

Just Perfection Videos and examples
https://gitlab.com/justperfection.channel/how-to-create-a-gnome-extension-documentation/-/tree/master/Examples
