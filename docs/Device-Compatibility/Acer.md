---
layout: default
title: Acer
parent: Device Compatibility
permalink: /device-compatibility/acer
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

# Acer

## Capability
* 2 modes: Full Capacity Mode, and Maximum Life Span mode.
* The charging threshold are fixed at value 100% and 80% and are not customizable.
* Full Capacity mode is the what Acer refers to as `Battery Charge Limit` enabled (100%).
* Maximum Life Span mode is the what Acer refers to as `Battery Charge Limit` disabled (80%).

## Dependencies
Depends on separate kernel module `acer-wmi-battery`, that need to be installed.<br>
<https://github.com/frederik-h/acer-wmi-battery>

{: .note }
`acer-wmi-battery` module is supported by a third party and this extension/author is not in any way responsible for the kernel module installation, bugs or damages.

## Testing charging threshold using command-line
After installing `acer-wmi-battery` below sysfs path will be available and charging threshold/mode can be changed.
Now user will be able to set charging threshold, using commandline and test charging behavior.
Charging mode can be set by using  `echo` command in `terminal`.
<br>
<br>

To turn on **Battery Limit charge**

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '1' | pkexec tee /sys/bus/wmi/drivers/acer-wmi-battery/health_mode
```
<br>

To turn off **Battery Limit charge**

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '0' | pkexec tee /sys/bus/wmi/drivers/acer-wmi-battery/health_mode
```
<br>
`sudo` also can be used in place of `pkexec` in the above commands as both `sudo` and `pkexec` can be use to run commands in root mode. To make use of polkit rules, the extension uses `pkexec`.

The current threshold value can also be read using `cat` command in `terminal`.
```bash
cat /sys/bus/wmi/drivers/acer-wmi-battery/health_mode
```
<br>

{: .important-title }
> Condition for applying threshold
>
> * Accepted values for `health_mode` : 0 or 1

If charging threshold are applied successfully using above commands, the extension is compatible.

## Quick Settings
<br>
<img src="../assets/images/device-compatibility/acer/quick-settings.png" width="100%">
<div class="outer-container">
    <span class="txt-horizantal-align"><b>Gnome 43 and above</b></span>
    <span class="txt-horizantal-align"><b>Gnome 42</b></span>
</div>

## Extension Preferences
<br>
<img src="../assets/images/device-compatibility/acer/settings.png" width="100%">



