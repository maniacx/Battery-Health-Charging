![Battery-Health-Charging](https://github.com/maniacx/Battery-Health-Charging/blob/main/.github/Battery-Health-Charging.gif)

Battery Health Charging extension for GNOME shell
=================================================
Battery Health Charging extension sets the limit of battery charging to maximize battery health mainly for laptops that support these features.
Since users usually keep their AC adapter connected while using their laptop, the battery is often in a state of high-power (98-100%) for an extended length of time which causes a reduction in battery life. Initially, I made this for my laptop (Asus) but as of **Version 4** , the extension evolve to support several brands. Some laptops have fixed threshold, while some laptop's threshold can be customized. (See details in laptop supported). This extension detects the hardware and displays the option accordingly.

**1. Full Capacity Mode:** Battery is charged to its full capacity for longer use on battery power.(Threshold are customizable on some laptop.)

**2. Balanced Mode:** Stops charging when power is above 80% and resumes charging when power is below 75%. This mode is recommended when using the Notebook on battery power during meetings or conferences. (Threshold are customizable on some laptop. Some laptop don't feature this option.)

**3. Maximum Lifespan Mode:** Stops charging when power is above 60% and resumes charging when power is below 55%. This mode is recommended when the Notebook is always powered by AC adapter.(Threshold are customizable on some laptop.)

## Features and Compatibility
* Conflicts with other battery charging threshold controls apps / extensions / local workarounds scripts, so better to disable or remove before using this extension.
* The charging mode persists on reboot. As of **Version 4** if your device needs **privileged access** (root) to change the threshold, this extension will prompt you to install polkit script. This way the extension can change the threshold on users input and also restore it on system restarts.

### Asus
* 3 presets Full Capacity Mode, Balance Mode, and Maximum Life Span mode.
* Default threshold values of these 3 preset modes are set at 100%, 80%, and 60%.
* Each preset threshold value can be customized between 100-80 %, 85-65 %, and 65-50 % respectively.
* This Extension supports Asus Laptop having one of the below paths.
```bash
'/sys/class/power_supply/BAT0/charge_control_end_threshold'
'/sys/class/power_supply/BAT1/charge_control_end_threshold'
'/sys/class/power_supply/BATC/charge_control_end_threshold'
'/sys/class/power_supply/BATT/charge_control_end_threshold'
```
### LG
* 2 preset Full capacity and Maximum Life Span mode set at 100% and 80%. Fixed threshold (not customizable).
* This Extension supports LG laptops having the below path.
```bash
'/sys/devices/platform/lg-laptop/battery_care_limit'
```
### Samsung
* 2 preset Full capacity and Maximum Life Span mode set at 100% and 80%. Fixed threshold (not customizable).
* Maximum Life Span mode is the what Samsung refers to as **smart charging mode**
* This Extension supports Samsung laptops having the below path.
```bash
'/sys/devices/platform/samsung/battery_life_extender'
```
### Sony
* 3 preset Full capacity, Balanced and Maximum Life Span mode set at 100%, 80% and 50%. Fixed threshold (not customizable).
* Balanced mode is what Sony refers to as **Battery care function 80%**
* Maximum Life Span mode is what Sony refers to as **Battery care function 50%**
* This Extension supports Sony laptops having the below path.
```bash
'/sys/devices/platform/sony-laptop/battery_care_limiter'
```
### Huawei
* 3 presets Full Capacity Mode, Balance Mode, and Maximum Life Span mode.
* Default end/start threshold values of these 3 preset modes are set at 100/95%, 80/75%, and 60/55%.
* Each preset end threshold value can be customized between 100-80 %, 80-65 %, and 65-50 % respectively.
* Each preset start threshold value can be customized between is 98-75 %, 83-60 %, and 63-40 % respectively.
* The differnce between end and start threshold cannot be less than 2%.
* This Extension supports Huawei laptops having the below path.
```bash
'/sys/devices/platform/huawei-wmi/charge_thresholds'
```
### Toshiba
* 2 preset Full capacity and Maximum Life Span mode set at 100% and 80%. Fixed threshold (not customizable).
* Maximum Life Span mode is what Toshiba refers to as **eco charging mode**
* This Extension supports Toshiba laptops having one of the below paths.
```bash
'/sys/class/power_supply/BAT0/charge_control_end_threshold'
'/sys/class/power_supply/BAT1/charge_control_end_threshold'
```
### System76
* 3 presets Full Capacity Mode, Balance Mode, and Maximum Life Span mode.
* Default end/start threshold values of these 3 preset modes are set at 100/95%, 80/75%, and 60/55%.
* Each preset end threshold value can be customized between 100-80 %, 80-65 %, and 65-50 % respectively.
* Each preset start threshold value can be customized between is 98-75 %, 83-60 %, and 63-40 % respectively.
* The differnce between end and start threshold cannot be less than 2%.
* This Extension supports System76 laptops having the below path.
```bash
'/sys/class/power_supply/BAT0/charge_control_end_threshold'
'/sys/class/power_supply/BAT0/charge_control_start_threshold'
```
### Lenovo
* 2 preset Full capacity and Maximum Life Span mode set at 100% and 60%. Fixed threshold (not customizable).
* Maximum Life Span mode is what Lenovo refers to as **conservative mode**
* This Extension supports Lenovo Ideapad Laptop having the below path
```bash
'/sys/bus/platform/drivers/ideapad_acpi/VPC2004:00/conservation_mode'
```
### Thinkpad Single /Dual Battery
* 3 presets Full Capacity Mode, Balance Mode, and Maximum Life Span mode.
* Default end/start threshold values of these 3 preset modes are set at 100/95%, 80/75%, and 60/55%.
* Each preset end threshold value can be customized between 100-80 %, 80-65 %, and 65-50 % respectively.
* Each preset start threshold value can be customized between is 98-75 %, 83-60 %, and 63-40 % respectively.
* The differnce between end and start threshold cannot be less than 2%.
* This Extension supports Thinkpad laptops that have pair of below paths.
```bash
'/sys/class/power_supply/BAT0/charge_control_end_threshold'
'/sys/class/power_supply/BAT0/charge_control_start_threshold'

'/sys/class/power_supply/BAT1/charge_control_end_threshold'
'/sys/class/power_supply/BAT1/charge_control_start_threshold'

'/sys/devices/platform/smapi/BAT0/stop_charge_thresh'
'/sys/devices/platform/smapi/BAT0/start_charge_thresh'

'/sys/devices/platform/smapi/BAT1/stop_charge_thresh'
'/sys/devices/platform/smapi/BAT1/start_charge_thresh'
```
### Apple Mac book (intel)
* 3 presets Full Capacity Mode, Balance Mode, and Maximum Life Span mode.
* Default threshold values of these 3 preset modes are set at 100%, 80%, and 60%.
* Each preset threshold value can be customized between 100-80 %, 85-65 %, and 65-50 % respectively.
* Depends on separate kernel module installation https://github.com/c---/applesmc-next
(This kernel module is supported by a third party and I am not in any way not responsible for the kernel module installation, bugs, or damages)
* This Extension supports Apple laptops having one of the below paths.
```bash
'/sys/class/power_supply/BAT0/charge_control_end_threshold'
```
### Acer
* 2 preset Full capacity and Maximum Life Span modes set at 100% and 80%. Fixed threshold (not customizable).
* Maximum Life Span mode is the what Samsung refers to as **smart charging mode**
* Depends on separate kernel module installation https://github.com/frederik-h/acer-wmi-battery
(This kernel module is supported by a third party and I am not in any way not responsible for the kernel module installation, bugs or damages)
* This Extension supports Acer laptops having the below path.
```bash
'/sys/bus/wmi/drivers/acer-wmi-battery/health_mode'
```
### Dell
* 5 presets Express, Adaptive, Full Capacity Mode, Balance Mode, and Maximum Life Span mode.
* Express and Adaptive are fixed mode. You can find the description of Express charge mode and adaptive mode on dell website.
* Full Capacity Mode, Balance Mode, and Maximum Life Span mode are **custom mode** with end/start threshold values set to 100/95%, 80/75%, and 60/55%.
* Each custom mode preset end threshold value can customize between 100-80 %, 80-65 %, and 65-55 % respectively.
* Each custom mode preset start threshold value can customize between 95-75 %, 80-60 %, and 60-50 % respectively.
* The differnce between end and start threshold cannot be less than 5%.
* Depends on executable package **smbios-battery-ctl** which is provided by **smbios-utils** https://github.com/dell/libsmbios
* This Extension supports dell through smbios-utils package smbios-battery-ctl
(smbios-utils is third-party package and I am not in any way not responsible for installation, bugs, or damages)
### MSI
* 3 presets Full Capacity Mode, Balance Mode, and Maximum Life Span mode.
* Default threshold values of these 3 preset modes are set at 100%, 80%, and 60%.
* Each preset threshold value can be customized between 100-80 %, 85-65 %, and 65-50 % respectively.
* Full capacity mode is equivalent to what Msi refers to as **Best for Mobility**
* Balanced mode is equivalent to what Msi refers to as **Balance**
* Maximum Life Span mode is equivalent to what Msi refers to as **Best for Battery**
* Depends on separate kernel module installation https://github.com/BeardOverflow/msi-ec
(This kernel module is supported by a third party and I am not in any way not responsible for the kernel module installation, bugs, or damages)
Although the module has been submitted lately into the mainline kernel so may not be needed.
* This Extension supports MSI laptops having one of the below paths.
```bash
'/sys/class/power_supply/BAT0/charge_control_end_threshold'
```
## Usage
![Battery-Health-Charging](https://github.com/maniacx/Battery-Health-Charging/blob/main/.github/Usage.png)

## Installation from git
```bash
git clone https://github.com/maniacx/Battery-Health-Charging
cd Battery-Health-Charging
./install.sh
```
Restart GNOME Shell by `Alt+F2`, `r`, `Enter` for Xorg or `Logout/Login` for Wayland.
Enable the extension through gnome-extension-manager.
If no privileged access (root) is not needed to change the threshold, you can start using the extension.

If root is needed, this extension will prompt to install polkit script. After installation it will prompt you to logout.
Logout re-login, and you can start using the extension.
***Note: Remember to uninstall this polkit script before uninstalling this extension by clicking on "Remove" under installation.***

## Polkit Installation / Deprecated Systemd Service from Version 3.
**PolKit Installation:** The extension will automatically detect if the device needs privileged permission (root) to change threshold/mode.
If the device requires privileged permission (root), it will notify the user to install polkit from extension settings.
If the device doesn't require privileged permission (root) there will no prompt and option to install polkit.
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
Open the po/Battery-Health-Charging.pot file on github. It contains each text displayed in this extension. You can use "poedit" app for adding your translation. Submit the information by raising an issue for this repo on github. You can also compile the translation file yourself and test it on your device.
Tutorial: https://youtu.be/WmWjwE-M4D0

## Bugs/Issue/Request feature
Please raise an [issue](https://github.com/maniacx/Battery-Health-Charging/issues) on github.

## Changelog
See [changelogs](https://github.com/maniacx/Battery-Health-Charging/blob/main/.github/CHANGELOG.md)

## Ratings
If the extension is working well for you, Please take the time to submit a review mentioning the brand/model of your laptop.
https://extensions.gnome.org/extension/5724/battery-health-charging/

## Credits and Reference
I made this extension for my Asus Viwobook. I have looked into codes of other extensions to create this extension. Credits to them.

Thinkpad Battery Threshold -by marcosdalvarez
https://gitlab.com/marcosdalvarez/thinkpad-battery-threshold-extension

Supergfxctl (Super Graphics Control) - Asus-linux
https://gitlab.com/asus-linux/supergfxctl

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

