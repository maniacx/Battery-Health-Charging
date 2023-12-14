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

## Testing charging threshold using command-line
Charging mode can be set by using  `echo` command in `terminal`.
<br>
<br>

To turn off **Battery care function**

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '100' | pkexec tee //sys/devices/platform/sony-laptop/battery_care_limiter
```
<br>

To set **Battery care function 80%**

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '80' | pkexec tee /sys/devices/platform/sony-laptop/battery_care_limiter
```
<br>

To set **Battery care function 50%**

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '50' | pkexec tee /sys/devices/platform/sony-laptop/battery_care_limiter
```
<br>
`sudo` also can be used in place of `pkexec` in the above commands as both `sudo` and `pkexec` can be use to run commands in root mode. To make use of polkit rules, the extension uses `pkexec`.

The current threshold value can also be read using `cat` command in `terminal`.
```bash
cat /sys/devices/platform/sony-laptop/battery_care_limiter
```

If charging threshold are applied successfully using above commands, the extension is compatible.
<br>
<br>

To enable **High Speed Charging mode**

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '1' | pkexec tee /sys/devices/platform/sony-laptop/battery_highspeed_charging
```
<br>

To disable **High Speed Charging mode**

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '0' | pkexec tee sys/devices/platform/sony-laptop/battery_highspeed_charging
```
<br>

{: .important-title }
> Condition for applying threshold
>
> * Accepted values for `battery_care_limiter`: 50, 80, or 100
> * Accepted values for `battery_highspeed_charging`: 0 or 1

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







