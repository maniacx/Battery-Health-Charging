---
layout: default
title: Framework
parent: Device Compatibility
permalink: /device-compatibility/framework
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

# Framework

## Capability
* 3 presets: Full Capacity Mode, Balance Mode, and Maximum Life Span mode.
* Default threshold values of these 3 preset modes are set at 100%, 80%, and 60%.
* Each preset threshold value can be customized between 100-80 %, 85-65 %, and 85-50 % respectively.

## Dependencies
Use one of the two dependencies: the framework-laptop-kmod kernel module or the official framework_tool package.
* kernel module: `framework-laptop-kmod`. <br>
<https://github.com/DHowett/framework-laptop-kmod>
* framework_tool package
<https://github.com/FrameworkComputer/framework-system>

{: .note }
`framework-laptop-kmod` and `framework_tool`are supported by a third party and this extension/author is not in any way responsible for the kernel module installation, bugs or damages.

## Testing charging threshold with framework-laptop-kmod installed using command-line
After installing `framework-laptop-kmod` below sysfs path will be available and charging threshold/mode can be changed.
Now user will be able to set charging threshold, using commandline and test charging behavior.
Charging mode can be set by using  `echo` command in `terminal`.
<br>
<br>

**For example:**<br>To apply threshold value of `60`, the command would be.

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '60' | pkexec tee /sys/class/power_supply/BAT1/charge_control_end_threshold
```
<br>
`sudo` also can be used in place of `pkexec` in the above commands as both `sudo` and `pkexec` can be use to run commands in root mode. To make use of polkit rules, the extension uses `pkexec`.

The current threshold value can also be read using `cat` command in `terminal`. For example, the laptops battery name in power supply sysfs is `BAT0`, command would be.
```bash
cat /sys/class/power_supply/BAT1/charge_control_end_threshold
```
<br>

{: .important-title }
> Condition for applying threshold
>
> * Accepted values for `charge_control_end_threshold` : 1 - 100

If charging threshold are applied successfully using above commands, the extension is compatible.

## Testing charging threshold with framework_tool installed using command-line
Require root privileges
{: .label .label-yellow .mt-0}
If drivers use may be `cros_ec` or `portio`, so choose accordingly.
```bash
pkexec /usr/bin/framework_tool --driver portio --charge-limit 60
```

## Quick Settings
<br>
<img src="../assets/images/device-compatibility/framework/quick-settings.png" width="100%">
<div class="outer-container">
    <span class="txt-horizantal-align"><b>Gnome 43 and above</b></span>
    <span class="txt-horizantal-align"><b>Gnome 42</b></span>
</div>

## Extension Preferences
<br>
<img src="../assets/images/device-compatibility/framework/settings.png" width="100%">

