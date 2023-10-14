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
<https://github.com/tuxedocomputers/tuxedo-keyboard>

{: .note }
`tuxedo-keyboard` module is supported by a third party and this extension/author is not in any way responsible for the kernel module installation, bugs or damages.

## Detection
This extension supports Tuxedo laptops by checking the existence of either one following sysfs paths for charging threshold below.

```
/sys/devices/platform/tuxedo_keyboard/charging_profile/charging_profiles_available
/sys/devices/platform/tuxedo_keyboard/charging_profile/charging_profile
```

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

## Information
The extension changes mode using `echo` command.<br>
Without the extension,  mode can be changed by using `echo` command in `terminal`.
<br>
<br>

To set mode to  **High Capacity**

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo 'high_capacity' > /sys/devices/platform/tuxedo_keyboard/charging_profile/charging_profile
```
<br>

To set mode to  **Balanced**

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo 'balanced' > /sys/devices/platform/tuxedo_keyboard/charging_profile/charging_profile
```
<br>

To set mode to  **Stationary**

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo 'stationary' > /sys/devices/platform/tuxedo_keyboard/charging_profile/charging_profile
```
<br>

The current threshold value can also be read using `cat` command in `terminal`.
```bash
cat /sys/devices/platform/tuxedo_keyboard/charging_profile/charging_profile
```


