---
layout: default
title: Thinkpad
parent: Device Compatibility
permalink: /device-compatibility/thinkpad
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

# Thinkpad (Single battery)

## Capability
* 3 presets: Full Capacity Mode, Balance Mode, and Maximum Life Span mode.
* Default threshold values of these 3 preset modes are set at 100/95%, 80/75%, and 60/55%.
* Each preset end threshold value can be customized between 100-80 %, 80-65 %, and 85-50 % respectively.
* Each preset start threshold value can be customized between is 98-75 %, 83-60 %, and 83-40 % respectively.
* The difference between end and start threshold cannot be less than 2%.

## Dependencies
* No dependencies required.
* Thinkpad laptop that allows setting charging threshold are supported by mainline linux kernels.

## Detection
This extension supports Thinkpad laptops by checking the existence of either one of the pairs of sysfs paths for charging threshold below.

```
/sys/class/power_supply/BAT0/charge_control_start_threshold
/sys/class/power_supply/BAT0/charge_control_end_threshold
```
```
/sys/class/power_supply/BAT0/charge_control_start_threshold
/sys/class/power_supply/BAT0/charge_control_end_threshold
```
Additionally it will also check the existence of sysfs path for wmi.

`/sys/devices/platform/thinkpad_acpi`

## Quick Settings
<br>
<img src="../assets/images/device-compatibility/thinkpad-single-battery/quick-settings.png" width="100%">
<div class="outer-container">
    <span class="txt-horizantal-align"><b>Gnome 43 and above</b></span>
    <span class="txt-horizantal-align"><b>Gnome 42</b></span>
</div>

## Extension Preferences
<br>
<img src="../assets/images/device-compatibility/thinkpad-single-battery/settings.png" width="100%">
<br>

## Information
The extension changes mode using `echo` command.<br>
Without the extension,  threshold value can be applied using `echo` command in `terminal`.
<br>
<br>
**For example:**<br>If power supply sysfs name is  `BAT0`, to apply start threshold value of `55`, end threshold value of `60`, command would be.

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '55' > /sys/class/power_supply/BAT0/charge_control_start_threshold
echo '60' > /sys/class/power_supply/BAT0/charge_control_end_threshold
```
<br>

The current threshold value can also be read using `cat` command in `terminal`.
```bash
cat /sys/class/power_supply/BAT0/charge_control_start_threshold
cat /sys/class/power_supply/BAT0/charge_control_end_threshold
```



