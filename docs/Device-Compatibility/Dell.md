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
* 3 Presets**: Full Capacity, Balance, and Maximum Life Span.
* 2 Additional Modes**: Express and Adaptive.
* Thresholds**: Preset modes have default threshold values set at 100/95%, 80/75%, and 60/55%. Customization options are available for each preset:
* End threshold values can be set between 100-80%, 85-65%, and 85-55%.
* Start threshold values can be set between 95-75%, 80-60%, and 80-50%.
* Note: The difference between end and start threshold values must be at least 5%.

{: .warning }
Using `Express` mode may accelerate battery wear.

## Dependencies
* There are two available packages for Dell laptop to control charging threshold / mode. **<span style="color:#0e755f">Libsmbios</span>** and **<span style="color:#213c8b">Dell command configure (cctk)</span>**

{: .new-title }
> libsmbios:
>
> * An open-source module developed for Dell laptops. available in most distro's package managers. 
> * Available with your distro's package manager.
> * The extension will use the `smbios-battery-ctl` module from libsmbios to change threshold/mode.
> * More information check the link below:<br><https://github.com/dell/libsmbios>


{: .note-title }
> Dell command configure:
>
> * A closed-source tool developed later by Dell.
> * distributed by Dell and is available at link below:<br><https://www.dell.com/support/kbdoc/en-us/000178000/dell-command-configure>

* Some Dell models work better with libsmbios, while others with Dell Command Configure.
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

## Testing charging threshold using command-line

{: .new-title }
> libsmbios
>
> Require root privileges
> {: .label .label-yellow .float-right}
> Use `sudo` or `pkexec` to run command as root<br>
> It is possible to set charging mode or threshold using comands in `terminal`.
>
> Set mode to Express mode<br>
> `pkexec smbios-battery-ctl --set-charging-mode=express`<br><br>
> Set to Adaptive<br>
> `pkexec smbios-battery-ctl --set-charging-mode=adaptive`<br><br>
> Set custom threshold.<br>Example below shows setting start threshold to 55% and end threshold to 60%<br>
> `pkexec smbios-battery-ctl --set-charging-mode=custom`<br>
> `pkexec smbios-battery-ctl --set-custom-charge-interval=55 60`<br><br>
> Read current charging mode or threshold the laptop is using<br>
> `pkexec smbios-battery-ctl --get-charging-cfg`<br><br>


{: .note-title }
> Dell Command Configure
>
> Require root privileges
> {: .label .label-yellow .float-right}
> Use `sudo` or `pkexec` to run command as root<br>
> It is possible to set charging mode or threshold using one or two command in `terminal`.
>
> Set mode to Express mode<br>
> `pkexec /opt/dell/dcc/cctk --PrimaryBattChargeCfg=Express`<br><br>
> Set to Adaptive<br>
> `pkexec /opt/dell/dcc/cctk --PrimaryBattChargeCfg=Adaptive`<br><br>
> Set custom threshold.<br>Example below shows setting start threshold to 55% and end threshold to 60%<br>
> `pkexec /opt/dell/dcc/cctk --PrimaryBattChargeCfg=Custom:55-60`<br><br>
> An example of changing mode or threshold with Bios Password Validation by adding `--ValSetupPwd=` followed by the bios password and the command to set mode or threshold<br>
> `pkexec /opt/dell/dcc/cctk --ValSetupPwd=PASSWORD --PrimaryBattChargeCfg=Express`<br><br>
> Read current charging mode or threshold the laptop is using<br>
> `pkexec /opt/dell/dcc/cctk --PrimaryBattChargeCfg`<br><br>

<br>

{: .important-title }
> Condition for applying threshold
>
> * Accepted end threshold values : 55 or 100
> * Accepted start threshold values : 50 or 95
> * end threshold values > start threshold values + 5

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


## Validate using Bios Password (Dell Command Configure Only)

{: .note-title }
> Dell Command Configure
>
> * Enable BIOS password validation in the Extension Preferences under the Device tab.
> * When `Need bios password to change mode/threshold` is enabled, and option will presented to enter bios password, which is then stored securely in Gnome Keyring.<br>
> * Disabling the feature removes the stored BIOS password from Gnome keyring.
>
> <img src="../assets/images/device-compatibility/dell/bios-password.png" width="100%">


{: .warning }
If you decide to uninstall this extension, it's recommended to disable the BIOS password feature to remove the stored password from Gnome Keyring.




