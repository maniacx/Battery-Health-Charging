---
layout: default
title: Lenovo
parent: Device Compatibility
permalink: /device-compatibility/lenovo
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

# Lenovo (IdeaPad, Legion)

## Capability
* 2 modes: Full Capacity Mode, and Maximum Life Span mode.
* The charging threshold are fixed at value 100% and 80% and are not customizable.
* Full Capacity mode is the what Lenovo refers to as `Conservative Mode` disabled (100%).
* Maximum Life Span mode is the what Lenovo refers to as `Conservative Mode` enabled (60 or 80% depending on model).
* Maximum Life Span mode limits charging to 60% or 80% of battery level depending on the model.

## Dependencies
* No dependencies required.
* Lenovo laptop that allows setting charging threshold are supported by mainline linux kernels.

## Detection
This extension supports Lenovo laptops by checking the existence of following sysfs path for charging threshold below.

`/sys/bus/platform/drivers/ideapad_acpi/VPC2004:00/conservation_mode`
<br>

## Quick Settings
<br>
<img src="../assets/images/device-compatibility/lenovo/quick-settings.png" width="100%">
<div class="outer-container">
    <span class="txt-horizantal-align"><b>Gnome 43 and above</b></span>
    <span class="txt-horizantal-align"><b>Gnome 42</b></span>
</div>

## Extension Preferences
<br>
<img src="../assets/images/device-compatibility/lenovo/settings.png" width="100%">

## Information
The extension changes mode using `echo` command.<br>
Charging mode can be also set by using  `echo` command in `terminal`.
Command below are helpful :
* Prior to installing extension, to check compatibility.
* During debugging, to check if threshold can be applied and read using command-line correctly.
* Incase user decides to not use extension and prefer changing via command-line.

<br>

To enable **Conservative Mode**

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '1' > /sys/bus/platform/drivers/ideapad_acpi/VPC2004:00/conservation_mode
```
<br>

To disable **Conservative Mode**

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '0' > /sys/bus/platform/drivers/ideapad_acpi/VPC2004:00/conservation_mode
```
<br>

The current threshold value can also be read using `cat` command in `terminal`.
```bash
cat /sys/bus/platform/drivers/ideapad_acpi/VPC2004:00/conservation_mode
```



