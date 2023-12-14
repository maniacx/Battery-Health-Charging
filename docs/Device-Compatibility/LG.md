---
layout: default
title: LG
parent: Device Compatibility
permalink: /device-compatibility/lg
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

# LG

## Capability
* 2 modes: Full Capacity Mode, and Maximum Life Span mode.
* The charging threshold are fixed at value 100% and 80% and are not customizable.
* Full Capacity mode is the what LG refers to as `Extend Battery Life Mode` disabled (100%).
* Maximum Life Span mode is the what LG refers to as `Extend Battery Life Mode` enabled (80%).
* Maximum Life Span mode limits charging to 80% of battery level.

## Dependencies
* No dependencies required.
* LG laptop that allows setting charging threshold are supported by mainline linux kernels.

## Testing charging threshold using command-line
Charging mode can be set by using  `echo` command in `terminal`.
<br>
<br>

To enable **Extend Battery Life Mode**

Require root privileges
{: .label .label-yellow .mt-0}

```bash
echo '80' | pkexec tee /sys/devices/platform/lg-laptop/battery_care_limit
```
<br>

To disable **Extend Battery Life Mode**

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '100' | pkexec tee /sys/devices/platform/lg-laptop/battery_care_limit
```
<br>
`sudo` also can be used in place of `pkexec` in the above commands as both `sudo` and `pkexec` can be use to run commands in root mode. To make use of polkit rules, the extension uses `pkexec`.

The current threshold value can also be read using `cat` command in `terminal`.
```bash
cat /sys/devices/platform/lg-laptop/battery_care_limit
```
<br>

{: .important-title }
> Condition for applying threshold
>
> * Accepted values for `battery_care_limit` : 80 or 100

If charging threshold are applied successfully using above commands, the extension is compatible.

## Quick Settings
<br>
<img src="../assets/images/device-compatibility/lg/quick-settings.png" width="100%">
<div class="outer-container">
    <span class="txt-horizantal-align"><b>Gnome 43 and above</b></span>
    <span class="txt-horizantal-align"><b>Gnome 42</b></span>
</div>

## Extension Preferences
<br>
<img src="../assets/images/device-compatibility/lg/settings.png" width="100%">



