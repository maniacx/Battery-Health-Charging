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

## Testing charging threshold using command-line
Charging mode can be set by using  `echo` command in `terminal`.
<br>
<br>

To enable **Conservative Mode**

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '1' | pkexec tee /sys/bus/platform/drivers/ideapad_acpi/VPC2004:00/conservation_mode
```
<br>

To disable **Conservative Mode**

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '0' | pkexec tee /sys/bus/platform/drivers/ideapad_acpi/VPC2004:00/conservation_mode
```
<br>
`sudo` also can be used in place of `pkexec` in the above commands as both `sudo` and `pkexec` can be use to run commands in root mode. To make use of polkit rules, the extension uses `pkexec`.

The current threshold value can also be read using `cat` command in `terminal`.
```bash
cat /sys/bus/platform/drivers/ideapad_acpi/VPC2004:00/conservation_mode
```

If charging threshold are applied successfully using above commands, the extension is compatible.

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





