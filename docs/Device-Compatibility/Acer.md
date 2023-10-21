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

## Detection
This extension supports Acer laptops by checking the existence of following sysfs path for charging threshold below.

`/sys/bus/wmi/drivers/acer-wmi-battery/health_mode`
<br>

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

## Information
The extension changes mode using `echo` command.<br>
Charging mode can be also set by using  `echo` command in `terminal`.
Command below are helpful :
* Prior to installing extension, to check compatibility.
* During debugging, to check if threshold can be applied and read using command-line correctly.
* Incase user decides to not use extension and prefer changing via command-line.
<br>
<br>

To turn on **Battery Limit charge**

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '1' > /sys/bus/wmi/drivers/acer-wmi-battery/health_mode
```
<br>

To turn off **Battery Limit charge**

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '0' > /sys/bus/wmi/drivers/acer-wmi-battery/health_mode
```
<br>

The current threshold value can also be read using `cat` command in `terminal`.
```bash
cat /sys/bus/wmi/drivers/acer-wmi-battery/health_mode
```
<br>

{: .important-title }
> Condition for applying threshold
>
> * Accepted values for `health_mode` : 0 or 1

