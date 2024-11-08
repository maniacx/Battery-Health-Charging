---
layout: default
title: Dell
parent: Device Compatibility
permalink: /device-compatibility/dell
---
<style>
.outer-container {
   display: table;
   width: 100%;
}
.txt-horizantal-align {
   width: 50%;
   display: table-cell;
   text-align: center;
}
</style>

# Dell

## Capability
* **3 Presets**: Full Capacity, Balance, and Maximum Life Span.
* **2 Additional Modes**: Express and Adaptive.
* **Thresholds**: Preset modes have default threshold values set at 100/95%, 80/75%, and 60/55%. Customization options are available for each preset:
* End threshold values can be set between 100-80%, 85-65%, and 85-55%.
* Start threshold values can be set between 95-75%, 80-60%, and 80-50%.
* Note: The difference between end and start threshold values must be at least 5%.

{: .warning }
Using `Express` mode may accelerate battery wear.

## Dependencies
* No dependencies are required for kernel 6.12.XX and newer.
* Two available packages for Dell laptops to control charging thresholds/modes are **<span style="color:#0e755f">Libsmbios</span>** and **<span style="color:#213c8b">Dell Command Configure (cctk)</span>**.

{: .new-title }
> libsmbios:
>
> * An open-source module developed for Dell laptops, available in most distribution package managers.
> * The extension uses the `smbios-battery-ctl` module from libsmbios to change threshold/mode.
> * For more information, check the link below:<br><https://github.com/dell/libsmbios>

{: .note-title }
> Dell Command Configure:
>
> * A closed-source tool developed by Dell.
> * Distributed by Dell and available at the link below:<br><https://www.dell.com/support/kbdoc/en-us/000178000/dell-command-configure>

* Some Dell models work better with libsmbios, while others perform better with Dell Command Configure.
* Users should choose and test the package that works best for their model.
* If both packages are installed, the extension will prompt the user to select the preferred package.

## Detection Mechanism

{: .new-title }
> libsmbios
>
> The extension checks if `smbios-battery-ctl` from **libsmbios** is installed at <br>`/usr/sbin/smbios-battery-ctl`.

{: .note-title }
> Dell Command Configure
>
> The extension checks for the installation of **Dell Command Center** at <br>`/opt/dell/dcc/cctk`.

* If both `smbios-battery-ctl` and `cctk` are found, an option to choose the preferred package is presented.

<img src="../assets/images/device-compatibility/dell/choose-package.png" width="100%">

## Testing Charging Thresholds Using the Command Line

{: .note-title }
> Sysfs (kernel 6.12.XX and newer)
>
> Requires root privileges
> {: .label .label-yellow .float-right}
> Use `sudo` or `pkexec` to run commands as root.<br>
> It is possible to set the charging mode or threshold using terminal commands.<br>
> **For example:**<br>If the battery power supply name is `BAT0`, to apply a threshold value of `55-60`, the command would be:
>
> First, change the mode<br>
> `echo 'Custom' | pkexec tee /sys/class/power_supply/BAT0/charge_types`<br>
> Change end threshold<br>
> `echo '60' | pkexec tee /sys/class/power_supply/BAT0/charge_control_end_threshold`<br>
> Change start threshold<br>
> `echo '55' | pkexec tee /sys/class/power_supply/BAT0/charge_control_start_threshold`<br>

{: .new-title }
> libsmbios
>
> Requires root privileges
> {: .label .label-yellow .float-right}
> Use `sudo` or `pkexec` to run commands as root.<br>
> It is possible to set the charging mode or threshold using terminal commands.
>
> Set mode to Express mode<br>
> `pkexec smbios-battery-ctl --set-charging-mode=express`<br><br>
> Set to Adaptive mode<br>
> `pkexec smbios-battery-ctl --set-charging-mode=adaptive`<br><br>
> Set custom threshold.<br>Example below shows setting the start threshold to 55% and end threshold to 60%<br>
> `pkexec smbios-battery-ctl --set-charging-mode=custom`<br>
> `pkexec smbios-battery-ctl --set-custom-charge-interval=55 60`<br><br>
> Read the current charging mode or threshold in use<br>
> `pkexec smbios-battery-ctl --get-charging-cfg`<br><br>

{: .note-title }
> Dell Command Configure
>
> Requires root privileges
> {: .label .label-yellow .float-right}
> Use `sudo` or `pkexec` to run commands as root.<br>
> It is possible to set the charging mode or threshold using one or two commands in the terminal.
>
> Set mode to Express mode<br>
> `pkexec /opt/dell/dcc/cctk --PrimaryBattChargeCfg=Express`<br><br>
> Set to Adaptive mode<br>
> `pkexec /opt/dell/dcc/cctk --PrimaryBattChargeCfg=Adaptive`<br><br>
> Set custom threshold.<br>Example below shows setting the start threshold to 55% and end threshold to 60%<br>
> `pkexec /opt/dell/dcc/cctk --PrimaryBattChargeCfg=Custom:55-60`<br><br>
> Example of changing mode or threshold with BIOS password validation by adding `--ValSetupPwd=` followed by the BIOS password and the command to set mode or threshold<br>
> `pkexec /opt/dell/dcc/cctk --ValSetupPwd=PASSWORD --PrimaryBattChargeCfg=Express`<br><br>
> Read the current charging mode or threshold in use<br>
> `pkexec /opt/dell/dcc/cctk --PrimaryBattChargeCfg`<br><br>

<br>

{: .important-title }
> Condition for Applying Threshold
>
> * Accepted end threshold values: 55 or 100
> * Accepted start threshold values: 50 or 95
> * End threshold values > start threshold values + 5

## Quick Settings
<br>
<img src="../assets/images/device-compatibility/dell/quick-settings.png" width="100%">
<div class="outer-container">
    <span class="txt-horizantal-align"><b>Gnome 43 and above</b></span>
    <span class="txt-horizantal-align"><b>Gnome 42</b></span>
</div>

## Extension Preferences
<br>
<img src="../assets/images/device-compatibility/dell/quick-settings.png" width="100%">
<br>

## Validate Using BIOS Password (Dell Command Configure Only)

{: .note-title }
> Dell Command Configure
>
> * Enable BIOS password validation in the Extension Preferences under the Device tab.
> * When `Need BIOS password to change mode/threshold` is enabled, an option to enter the BIOS password will be presented, which is then stored securely in the GNOME Keyring.<br>
> * Disabling the feature removes the stored BIOS password from the GNOME Keyring.
>
> <img src="../assets/images/device-compatibility/dell/bios-password.png" width="100%">

{: .warning }
If you decide to uninstall this extension, it is recommended to disable the BIOS password feature to remove the stored password from the GNOME Keyring.


