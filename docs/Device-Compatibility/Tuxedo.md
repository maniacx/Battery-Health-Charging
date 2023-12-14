---
layout: default
title: Tuxedo
parent: Device Compatibility
permalink: /device-compatibility/tuxedo
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

# Tuxedo

## Capability
* 3 modes: Full Capacity Mode, and Maximum Life Span mode.
* The charging threshold are fixed at value 100%, 90% and 80% and are not customizable.
* Full Capacity mode is the what Tuxedo refers to as `High Capacity` (100%).
* Balanced mode is the what Tuxedo refers to as `Balanced` (90%).
* Maximum Life Span mode is the what Tuxedo refers to as `Stationary` (80%).

## Dependencies
Depends on separate kernel module `tuxedo-keyboard` (dkms) installation, that need to be installed.<br>
<https://gitlab.com/tuxedocomputers/development/packages/tuxedo-drivers>

{: .note }
`tuxedo-keyboard` module is supported by a third party and this extension/author is not in any way responsible for the kernel module installation, bugs or damages.

## Testing charging threshold using command-line
After installing `tuxedo-keyboard` below sysfs path will be available and charging threshold/mode can be changed.
Now user will be able to set charging threshold, using commandline and test charging behavior.
Charging mode can be set by using  `echo` command in `terminal`.
<br>
<br>

To set mode to  **High Capacity**

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo 'high_capacity' | pkexec tee /sys/devices/platform/tuxedo_keyboard/charging_profile/charging_profile
```
<br>

To set mode to  **Balanced**

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo 'balanced' | pkexec tee /sys/devices/platform/tuxedo_keyboard/charging_profile/charging_profile
```
<br>

To set mode to  **Stationary**

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo 'stationary' | pkexec tee /sys/devices/platform/tuxedo_keyboard/charging_profile/charging_profile
```
<br>
`sudo` also can be used in place of `pkexec` in the above commands as both `sudo` and `pkexec` can be use to run commands in root mode. To make use of polkit rules, the extension uses `pkexec`.

The current threshold value can also be read using `cat` command in `terminal`.
```bash
cat /sys/devices/platform/tuxedo_keyboard/charging_profile/charging_profile
```
<br>

{: .important-title }
> Condition for applying threshold
>
> * Accepted values for `charging_profile` : high_capacity, balanced,  or stationary

If charging threshold are applied successfully using above commands, the extension is compatible.

## Quick Settings
<br>
<img src="../assets/images/device-compatibility/tuxedo/quick-settings.png" width="100%">
<div class="outer-container">
    <span class="txt-horizantal-align"><b>Gnome 43 and above</b></span>
    <span class="txt-horizantal-align"><b>Gnome 42</b></span>
</div>

## Extension Preferences
<br>
<img src="../assets/images/device-compatibility/tuxedo/settings.png" width="100%">




