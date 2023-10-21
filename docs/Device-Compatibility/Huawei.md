---
layout: default
title: Huawei
parent: Device Compatibility
permalink: /device-compatibility/huawei
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

# Huawei

## Capability
* 3 presets: Full Capacity Mode, Balance Mode, and Maximum Life Span mode.
* Default threshold values of these 3 preset modes are set at 100/95%, 80/75%, and 60/55%.
* Each preset end threshold value can be customized between 100-80 %, 80-65 %, and 85-50 % respectively.
* Each preset start threshold value can be customized between is 98-75 %, 83-60 %, and 83-40 % respectively.
* The difference between end and start threshold cannot be less than 2%.

## Dependencies
* No dependencies required.
* Huawei laptop that allows setting charging threshold are supported by mainline linux kernels.

## Detection
This extension supports Huawei laptops by checking the existence of following sysfs path for charging threshold below.

`/sys/devices/platform/huawei-wmi/charge_thresholds`
<br>

## Quick Settings
<br>
<img src="../assets/images/device-compatibility/huawei/quick-settings.png" width="100%">
<div class="outer-container">
    <span class="txt-horizantal-align"><b>Gnome 43 and above</b></span>
    <span class="txt-horizantal-align"><b>Gnome 42</b></span>
</div>

## Extension Preferences
<br>
<img src="../assets/images/device-compatibility/huawei/settings.png" width="100%">

## Information
The extension changes mode using `echo` command.<br>
Charging threshold value can be applied by using `echo` command in `terminal`.
Command below are helpful :
* Prior to installing extension, to check compatibility.
* During debugging, to check if threshold can be applied and read using command-line correctly.
* Incase user decides to not use extension and prefer changing via command-line.

<br>
**For example:**<br>To apply start threshold value of `55`, end threshold value of `60`, command would be.

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '55 60' > /sys/devices/platform/huawei-wmi/charge_thresholds
```
<br>
The current threshold value can also be read using `cat` command in `terminal`.
```bash
cat /sys/devices/platform/huawei-wmi/charge_thresholds
```
<br>

{: .important-title }
> Condition for applying threshold
>
> * Accepted values for `charge_control_end_threshold` : 1 - 100
> * Accepted values for `charge_control_start_threshold` : 0 - 99

