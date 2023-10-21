---
layout: default
title: Toshiba
parent: Device Compatibility
permalink: /device-compatibility/toshiba
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

# Toshiba

## Capability
* 2 modes: Full Capacity Mode, and Maximum Life Span mode.
* The charging threshold are fixed at value 100% and 80% and are not customizable.
* Full Capacity mode is the what Toshiba refers to as `Eco Charge Mode` disabled (100%).
* Maximum Life Span mode is the what Toshiba refers to as `Eco Charge Mode` enabled (80%).

{: .note }
To change from Full Capacity to Maximum Life Span mode, the battery level should be below 80%.<br>If the battery level is 80% or above, the embedded controller (EC) refused to set threshold limit to 80%.


## Dependencies
* No dependencies required.
* Toshiba laptop that allows setting charging threshold are supported by mainline linux kernels.

## Detection
This extension supports Toshiba laptops by checking the existence of either one following sysfs paths for charging threshold below.

`/sys/class/power_supply/BAT0/charge_control_end_threshold`

`/sys/class/power_supply/BAT1/charge_control_end_threshold`
<br>

## Quick Settings
<br>
<img src="../assets/images/device-compatibility/toshiba/quick-settings.png" width="100%">
<div class="outer-container">
    <span class="txt-horizantal-align"><b>Gnome 43 and above</b></span>
    <span class="txt-horizantal-align"><b>Gnome 42</b></span>
</div>

## Extension Preferences
<br>
<img src="../assets/images/device-compatibility/toshiba/settings.png" width="100%">

## Information
The extension changes mode using `echo` command.<br>
Charging mode can be also set by using  `echo` command in `terminal`.
Command below are helpful :
* Prior to installing extension, to check compatibility.
* During debugging, to check if threshold can be applied and read using command-line correctly.
* Incase user decides to not use extension and prefer changing via command-line.

<br>

To enable **Eco Charge Mode**

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '80' > /sys/class/power_supply/BAT0/charge_control_end_threshold
```
<br>

To disable **Eco Charge Mode**

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '100' > /sys/class/power_supply/BAT0/charge_control_end_threshold
```
<br>

The current threshold value can also be read using `cat` command in `terminal`.
```bash
cat /sys/class/power_supply/BAT0/charge_control_end_threshold
```
<br>

{: .important-title }
> Condition for applying threshold
>
> * Accepted values for `charge_control_end_threshold` : 80 or 100
> * When switching threshold from 100 to 80, battery level should below 80%

<br>

{: .note }
To change charging threshold from 100% to 80%, the battery level should be below 80%.<br>If the battery level is 80% or above, the embedded controller (EC) refused to set threshold limit to 80%.

