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
* 3 presets: Full Capacity Mode, Balance Mode, and Maximum Life Span mode.
* 2 additional modes: Express Mode and Adaptive mode.
* Default threshold values of these 3 preset modes are set at 100/95%, 80/75%, and 60/55%.
* Each preset end threshold value can be customized between 100-80 %, 85-65 %, and 85-55 % respectively.
* Each preset start threshold value can be customized between is 95-75 %, 80-60 %, and 80-50 % respectively.
* The difference between end and start threshold cannot be less than 5%.

{: .warning }
Use of `Express` mode may cause battery health to diminish more quickly.

## Dependencies
* There are two available packages for Dell laptop to control charging threshold / mode. **<span style="color:#0e755f">Libsmbios</span>** and **<span style="color:#213c8b">Dell command configure (cctk)</span>**

{: .new-title }
> libsmbios:
>
> * Open source and was the first module developed by open source community for dell laptops.
> * Available with your distro's package manager.
> * The extension will use the `smbios-battery-ctl` module from libsmbios to change threshold/mode.
> * More information check the link below:<br><https://github.com/dell/libsmbios>


{: .note-title }
> Dell command configure:
>
> * Close source and was the later developed by Dell.
> * distributed by Dell and is available at link below:<br><https://www.dell.com/support/kbdoc/en-us/000178000/dell-command-configure>

* For some Dell model, libsmbios works well but Dell command configure doesn't and for others Dell laptops Dell Command Configure works well, but libsmbios doesn't.
* It is entirely up to the user to choose which package to use and test if it works.
* If both package are installed, the extension will detect and give an option to choose the package the extension should use to interact.

## Detection

{: .new-title }
> libsmbios
>
> This Extension will check if the module `smbios-battery-ctl` from **libsmbios** is installed at the default location.<br>`/usr/sbin/smbios-battery-ctl`


{: .note-title }
> Dell Command Configure
>
> This Extension will also check if **Dell Command Center** is installed at the default location.<br>`/opt/dell/dcc/cctk`

* If the extension find any one module installed (`smbios-battery-ctl or cctk`), it will use that module to change mode/threshold
* If the extension finds both `smbios-battery-ctl and cctk` modules installed, it will display an option to choose the package to use for changing threshold/mode as shown below.

<img src="../assets/images/device-compatibility/dell/choose-package.png" width="100%">

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

## Information

{: .new-title }
> libsmbios
>
> Require root privileges
> {: .label .label-yellow .float-right}
> To set mode or threshold, it set using one or two command. It is possible to change mode or threshold using command-line in `terminal`  without the extension.
>
> To set mode to Express mode<br>
> `smbios-battery-ctl --set-charging-mode=express`<br><br>
> To set mode to Adaptive<br>
> `smbios-battery-ctl --set-charging-mode=adaptive`<br><br>
> Two commands are use to set threshold. For example if need to apply, start threshold to 55% and end threshold to 60%, the command would be<br>
> `smbios-battery-ctl --set-charging-mode=custom`<br>
> `smbios-battery-ctl --set-custom-charge-interval=55 60`<br><br>
> Command to read current mode or threshold<br>
> `smbios-battery-ctl --get-charging-cfg`<br><br>


{: .note-title }
> Dell Command Configure
>
> Require root privileges
> {: .label .label-yellow .float-right}
> It is possible to change mode or threshold using command-line in `terminal` without the extension.
>
> To set mode to Express mode<br>
> `/opt/dell/dcc/cctk --PrimaryBattChargeCfg=Express`<br><br>
> To set mode to Adaptive<br>
> `/opt/dell/dcc/cctk --PrimaryBattChargeCfg=Adaptive`<br><br>
> To set threshold to specific value. For example if need to apply, start threshold to 55% and end threshold to 60%, the command would be<br>
> `/opt/dell/dcc/cctk --PrimaryBattChargeCfg=Custom:55-60`<br><br>
> An example of changing mode or threshold with Bios Password Validation<br>
> `/opt/dell/dcc/cctk --ValSetupPwd=PASSWORD --PrimaryBattChargeCfg=Express`<br><br>
> Command to read current mode or threshold<br>
> `/opt/dell/dcc/cctk --PrimaryBattChargeCfg`<br><br>

## Validate using Bios Password (Dell Command Configure Only)

{: .note-title }
> Dell Command Configure
>
> * If changing mode or threshold needs to be validated by using BIOS password, it can be enabled in Extension Preference, Under Dell Tab.<br>
> * When `Need bios password to change mode/threshold` is turned on, and option will appear to enter bios password.<br>
> * Entering the bios password will store it in Gnome Keyring, which will be used by the extension whenever mode or threshold is changed.<br>
> * When `Need bios password to change mode/threshold` is turned off, it will clear/delete the stored bios password from Gnome Keyring.<br>
>
> <img src="../assets/images/device-compatibility/dell/bios-password.png" width="100%">


{: .warning }
If decision has been made to uninstall and not use this extension, users that have used Bios password to validate changing mode / threshold are recommended to turn off `Need bios password to change mode/threshold`. This will remove/delete the saved bios password in Gnome Keyring.




