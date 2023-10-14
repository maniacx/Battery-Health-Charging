---
layout: default
title: Sony
parent: Device Compatibility
permalink: /device-compatibility/sony
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

# Sony

## Capability
* 3 modes: Full Capacity Mode, and Maximum Life Span mode.
* The charging threshold are fixed at value 100%, 80% and 50% and are not customizable.
* Full Capacity mode is the what Sony refers to as `Battery care function` disabled.
* Balanced Span mode is the what Sony refers to as `Battery care function 80%`.
* Maximum Life Span mode is the what Sony refers to as `Battery care function 50%`.
* Sony laptop that support `High Speed Charging` will get an addition option as Express mode for fast charging of battery.

{: .warning }
Use of `Express mode` may cause battery health to diminish more quickly.

## Dependencies
* No dependencies required.
* Sony laptop that allows setting charging threshold are supported by mainline linux kernels.

## Detection
This extension supports Sony laptops by checking the existence of following sysfs path for charging threshold below.

`/sys/devices/platform/sony-laptop/battery_care_limiter`<br><br>

## Quick Settings
<br>
<img src="../assets/images/device-compatibility/sony/quick-settings.png" width="100%">
<div class="outer-container">
    <span class="txt-horizantal-align"><b>Gnome 43 and above</b></span>
    <span class="txt-horizantal-align"><b>Gnome 42</b></span>
</div>

## Extension Preferences
<br>
<img src="../assets/images/device-compatibility/sony/settings.png" width="100%">

## Information
The extension changes mode using `echo` command.<br>
Without the extension,  mode can be changed by using `echo` command in `terminal`.
<br>
<br>

To turn off **Battery care function**

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '100' > /sys/devices/platform/sony-laptop/battery_care_limiter
```
<br>

To set **Battery care function 80%**

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '80' > /sys/devices/platform/sony-laptop/battery_care_limiter
```
<br>

To set **Battery care function 50%**

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '50' > /sys/devices/platform/sony-laptop/battery_care_limiter
```
<br>

The current threshold value can also be read using `cat` command in `terminal`.
```bash
cat /sys/devices/platform/sony-laptop/battery_care_limiter
```
<br>

To enable **High Speed Charging mode**

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '1' > /sys/devices/platform/sony-laptop/battery_highspeed_charging
```
<br>

To disable **High Speed Charging mode**

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '0' > /sys/devices/platform/sony-laptop/battery_highspeed_charging
```


