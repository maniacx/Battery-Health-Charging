---
layout: default
title: Thinkpad Legacy (Dual)
parent: Device Compatibility
permalink: /device-compatibility/thinkpad-legacy-dual
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

# Thinkpad (Dual battery)

## Capability
* 3 presets: Full Capacity Mode, Balance Mode, and Maximum Life Span mode.
* Default threshold values of these 3 preset modes are set at 100/95%, 80/75%, and 60/55%.
* Each preset end threshold value can be customized between 100-80 %, 80-65 %, and 85-50 % respectively.
* Each preset start threshold value can be customized between is 95-75 %, 85-60 %, and 85-40 % respectively.
* The difference between end and start threshold cannot be less than 5%.

## Dependencies
* Thinkpad legacy depend on a kernel modules `tpsmapi`.
* `tpsmapi` may be available as a package by your distro's package-manager
* Addition information about `tpsmapi` is available here: <https://github.com/linux-thinkpad/tp_smapi>

{: .note }
`tpsmapi` module is supported by a third party and this extension/author is not in any way responsible for the kernel module installation, bugs or damages.

## Detection
This extension supports Thinkpad laptops by checking the existence of following sysfs paths for charging threshold below.

```
/sys/devices/platform/smapi/BAT0/stop_charge_thresh
/sys/devices/platform/smapi/BAT0/start_charge_thresh
/sys/devices/platform/smapi/BAT1/stop_charge_thresh
/sys/devices/platform/smapi/BAT1/start_charge_thresh
```

## Quick Settings
<br>
<img src="../assets/images/device-compatibility/thinkpad-legacy-dual-battery/quick-settings.gif" width="100%">
<div class="outer-container">
    <span class="txt-horizantal-align"><b>Gnome 43 and above</b></span>
    <span class="txt-horizantal-align"><b>Gnome 42</b></span>
</div>
## Extension Preferences
<br>
<img src="../assets/images/device-compatibility/thinkpad-legacy-dual-battery/settings.gif" width="100%">
<br>

## Information
The extension changes mode using `echo` command.<br>
Without the extension,  threshold value can be applied using `echo` command in `terminal`.
<br>
<br>
**For example:**<br>To apply threshold on secondary battery (BAT1) with start threshold value of `55`, end threshold value of `60`, command would be.

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '55' > /sys/devices/platform/smapi/BAT1/start_charge_thresh
echo '60' > /sys/devices/platform/smapi/BAT1/stop_charge_thresh
```
<br>

The current threshold value can also be read using `cat` command in `terminal`.
```bash
cat /sys/devices/platform/smapi/BAT0/start_charge_thresh
cat /sys/devices/platform/smapi/BAT0/stop_charge_thresh
```



