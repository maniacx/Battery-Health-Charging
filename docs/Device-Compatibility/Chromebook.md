---
layout: default
title: Chromebook
parent: Device Compatibility
permalink: /device-compatibility/chromebook
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

# Chromebook

## Capability
* 3 Presets**: Full Capacity, Balance, and Maximum Life Span.
* Thresholds**: Preset modes have default threshold values set at 100/98%, 80/78%, and 60/58%. Customization options are available for each preset:
* End threshold values can be set between 100-80%, 85-65%, and 85-55%.
* Start threshold values can be set between 95-75%, 80-60%, and 80-50%.
* Note: The difference between end and start threshold values must be at least 2%.

## Dependencies
* No dependencies required for kernel 6.11.XX and newer.
* Older kernel are required to install package`ectool`.
https://github.com/MrChromebox/chrome-ec

## Testing charging threshold using command-line

{: .note-title }
> Sysfs (kernel 6.11.XX and newer)
>
> Require root privileges
> {: .label .label-yellow .float-right}
> Use `sudo` or `pkexec` to run command as root<br>
> It is possible to set charging mode or threshold using commands in `terminal`.
> **For example:**<br>If the battery power supply name is  `BAT0`, to apply threshold value of `60`, the command would be.
>
> Change end threshold<br>
> `echo '60' | pkexec tee /sys/class/power_supply/BAT0/charge_control_end_threshold`<br>
> Change start threshold<br>
> `echo '55' | pkexec tee /sys/class/power_supply/BAT0/charge_control_start_threshold`<br>

{: .new-title }
> ectool
>
> Require root privileges
> {: .label .label-yellow .float-right}
> Use `sudo` or `pkexec` to run command as root<br>
> It is possible to set charging mode or threshold using commands in `terminal`.
>
> Set custom threshold.<br>Example below shows setting start threshold to 55% and end threshold to 60%<br>
> `pkexec ectool chargecontrol normal 55 60`<br><br>
> Read current charging mode or threshold the laptop is using<br>
> `pkexec ectool chargecontrol`<br><br>

<br>

{: .important-title }
> Condition for applying threshold
>
> * Accepted end threshold values : 55 or 100
> * Accepted start threshold values : 50 or 95
> * end threshold values > start threshold values + 2

## Quick Settings
<br>
<img src="../assets/images/device-compatibility/dell/quick-settings.png" width="100%">
<div class="outer-container">
    <span class="txt-horizantal-align"><b>Gnome 43 and above</b></span>
    <span class="txt-horizantal-align"><b>Gnome 42</b></span>
</div>

## Extension Preferences
<br>
<img src="../assets/images/device-compatibility/dell/quick-settings.png" width="100%">
<br>




