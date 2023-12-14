---
layout: default
title: Gigabyte
parent: Device Compatibility
permalink: /device-compatibility/gigabyte
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

# Gigabyte (Aero, Aorus)

## Capability
* 3 presets: Full Capacity Mode, Balance Mode, and Maximum Life Span mode.
* Default threshold values of these 3 preset modes are set at 100%, 80%, and 60%.
* Each preset threshold value can be customized between 100-80 %, 85-65 %, and 85-60 % respectively.

## Dependencies
Depends on separate kernel module `gigabyte-laptop-wmi`, that need to be installed.<br>
<https://github.com/tangalbert919/gigabyte-laptop-wmi>

{: .note }
`gigabyte-laptop-wmi` module is supported by a third party and this extension/author is not in any way responsible for the kernel module installation, bugs or damages.

## Testing charging threshold using command-line
After installing `gigabyte-laptop-wmi` below sysfs path will be available and charging threshold/mode can be changed.
Now user will be able to set charging threshold, using commandline and test charging behavior.
Charging mode can be set by using  `echo` command in `terminal`.
<br>
<br>
**For example:**<br>To apply threshold value of `60`, the command would be.

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '1' | pkexec tee /sys/devices/platform/gigabyte_laptop/charge_mode
echo '60' | pkexec tee /sys/devices/platform/gigabyte_laptop/charge_limit
```
<br>
`sudo` also can be used in place of `pkexec` in the above commands as both `sudo` and `pkexec` can be use to run commands in root mode. To make use of polkit rules, the extension uses `pkexec`.

The current threshold value can also be read using `cat` command in `terminal`. For example, the laptops battery name in power supply sysfs is `BAT0`, command would be.
```bash
cat /sys/devices/platform/gigabyte_laptop/charge_limit
```
<br>

{: .important-title }
> Condition for applying threshold
>
> * Accepted values for `charge_mode` : 0 or 1
> * Accepted values for `charge_limit` : 60 - 100

If charging threshold are applied successfully using above commands, the extension is compatible.

## Quick Settings
<br>
<img src="../assets/images/device-compatibility/gigabyte/quick-settings.png" width="100%">
<div class="outer-container">
    <span class="txt-horizantal-align"><b>Gnome 43 and above</b></span>
    <span class="txt-horizantal-align"><b>Gnome 42</b></span>
</div>

## Extension Preferences
<br>
<img src="../assets/images/device-compatibility/gigabyte/settings.png" width="100%">


