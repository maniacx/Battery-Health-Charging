---
layout: default
title: Panasonic
parent: Device Compatibility
permalink: /device-compatibility/panasonic
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

# Panasonic

## Capability
* 2 modes: Full Capacity Mode, and Maximum Life Span mode.
* The charging threshold are fixed at value 100% and 80%(75% in some model) and are not customizable.
* Full Capacity mode is the what Panasonic refers to as `Echo Mode` disabled (100%).
* Maximum Life Span mode is the what Panasonic refers to as `Echo Mode` enabled (80% or 75% depending on the model).
* Maximum Life Span mode limits charging to 80% or 75% of battery level depending on the model.

## Dependencies
* No dependencies required.
* Panasonic laptop that allows setting charging threshold are supported by mainline linux kernels.

## Testing charging threshold using command-line
Charging mode can be set by using  `echo` command in `terminal`.
<br>
<br>

To enable **Echo Mode**

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '1' | pkexec tee /sys/devices/platform/panasonic/eco_mode
```
<br>

To disable **Echo Mode**

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '0' | pkexec tee /sys/devices/platform/panasonic/eco_mode
```
<br>
`sudo` also can be used in place of `pkexec` in the above commands as both `sudo` and `pkexec` can be use to run commands in root mode. To make use of polkit rules, the extension uses `pkexec`.

The current threshold value can also be read using `cat` command in `terminal`.
```bash
cat /sys/devices/platform/panasonic/eco_mode
```
<br>

{: .important-title }
> Condition for applying threshold
>
> * Accepted values for `eco_mode` : 0 or 1
`/sys/devices/platform/panasonic/eco_mode`
<br>

If charging threshold are applied successfully using above commands, the extension is compatible.

## Quick Settings
<br>
<img src="../assets/images/device-compatibility/panasonic/quick-settings.png" width="100%">
<div class="outer-container">
    <span class="txt-horizantal-align"><b>Gnome 43 and above</b></span>
    <span class="txt-horizantal-align"><b>Gnome 42</b></span>
</div>

## Extension Preferences
<br>
<img src="../assets/images/device-compatibility/panasonic/settings.png" width="100%">


