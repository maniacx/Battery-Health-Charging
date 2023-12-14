---
layout: default
title: Apple-Intel-Series
parent: Device Compatibility
permalink: /device-compatibility/apple-intel-series
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

# Apple Macbook Intel-series chip

## Capability
* 3 presets: Full Capacity Mode, Balance Mode, and Maximum Life Span mode.
* Default threshold values of these 3 preset modes are set at 100%, 80%, and 60%.
* Each preset threshold value can be customized between 100-80 %, 85-65 %, and 85-50 % respectively.

## Dependencies
Depends on separate kernel module `applesmc-next`, that need to be installed.<br>
<https://github.com/c---/applesmc-next>

{: .note }
`applesmc-next` module is supported by a third party and this extension/author is not in any way responsible for the kernel module installation, bugs or damages.

## Testing charging threshold using command-line
After installing `applesmc-next` below sysfs path will be available and charging threshold/mode can be changed.
Now user will be able to set charging threshold, using commandline and test charging behavior.
Charging mode can be set by using  `echo` command in `terminal`.
<br>
<br>

**For example:**<br>To apply threshold value of `60`, the command would be.

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '60' | pkexec tee /sys/class/power_supply/BAT0/charge_control_end_threshold
```
<br>
`sudo` also can be used in place of `pkexec` in the above commands as both `sudo` and `pkexec` can be use to run commands in root mode. To make use of polkit rules, the extension uses `pkexec`.

The current threshold value can also be read using `cat` command in `terminal`. For example, the laptops battery name in power supply sysfs is `BAT0`, command would be.
```bash
cat /sys/class/power_supply/BAT0/charge_control_end_threshold
```
<br>

{: .important-title }
> Condition for applying threshold
>
> * Accepted values for `charge_control_end_threshold` : 10 - 100
> * Accepted values for `charge_control_start_threshold` : none (not writable)

If charging threshold are applied successfully using above commands, the extension is compatible.

## Quick Settings
<br>
<img src="../assets/images/device-compatibility/apple-intel/quick-settings.png" width="100%">
<div class="outer-container">
    <span class="txt-horizantal-align"><b>Gnome 43 and above</b></span>
    <span class="txt-horizantal-align"><b>Gnome 42</b></span>
</div>

## Extension Preferences
<br>
<img src="../assets/images/device-compatibility/apple-intel/settings.png" width="100%">

## Charging Indicator Light Behavior Settings
<br>
This the default system behavior from apple laptops regarding **charging indicator light** (LED).
* The charging indicator light glows <span style="color: #b38600  ">amber</span> when battery is either charging or battery level has reach charging threshold value (charging on hold).
* The charging indicator light glows <span style="color: #b38600  ">amber</span> when threshold limit has reached (charging on hold).
* The charging indicator light glows <span style="color: green  ">green</span> when battery is fully charged.
<br>
<br>

[applesmc-next](https://github.com/c---/applesmc-next) module provides addition functionality to change **charging indicator light** (LED) behavior by changing values at `charge_control_full_threshold`.
```bash
echo '58' | pkexec tee /sys/class/power_supply/BAT0/charge_control_full_threshold
```
* The charging indicator light glows <span style="color: #b38600">amber</span> when battery is charging.
* The charging indicator light glows <span style="color: green">green</span> when battery level has reach charging threshold value (charging on hold).
<br>
<br>

This extension provides a setting in preferences to change the behavior as explained above.
* With setting **enabled**, the charging indicator light glows <span style="color: green">green</span> when battery level has reach charging threshold value **(charging on hold)**.
* With setting **disabled**, will revert back to system default behavior where in, the charging indicator light glows <span style="color: green">green</span> when battery level is above 95% **(battery is fully charged)**.

<br>
<img src="../assets/images/device-compatibility/apple-intel/led-settings.png" width="100%">


