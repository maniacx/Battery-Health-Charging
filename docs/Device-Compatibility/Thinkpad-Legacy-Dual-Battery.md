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
* Thinkpad legacy depend on a kernel modules `tp_smapi`.
* `tp_smapi` may be available as a package by your distro's package-manager
* Addition information about `tp_smapi` is available here: <https://github.com/linux-thinkpad/tp_smapi>

{: .note }
`tp_smapi` module is supported by a third party and this extension/author is not in any way responsible for the kernel module installation, bugs or damages.

## Testing charging threshold using command-line
After installing `tp_smapi` below sysfs path will be available and charging threshold/mode can be changed.
Now user will be able to set charging threshold, using commandline and test charging behavior.
Charging mode can be set by using  `echo` command in `terminal`.
<br>
<br>

**For example:**<br>To apply threshold on secondary battery (BAT1) with start threshold value of `55`, end threshold value of `60`, command would be.

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '55' | pkexec tee /sys/devices/platform/smapi/BAT1/start_charge_thresh
echo '60' | pkexec tee /sys/devices/platform/smapi/BAT1/stop_charge_thresh
```
<br>
`sudo` also can be used in place of `pkexec` in the above commands as both `sudo` and `pkexec` can be use to run commands in root mode. To make use of polkit rules, the extension uses `pkexec`.

The current threshold value can also be read using `cat` command in `terminal`.
```bash
cat /sys/devices/platform/smapi/BAT0/start_charge_thresh
cat /sys/devices/platform/smapi/BAT0/stop_charge_thresh
```
<br>
If charging threshold are applied successfully using above commands, the extension is compatible.


{: .important-title }
> Condition for applying threshold
>
> * Accepted values for `stop_charge_thresh` : 6 - 100
> * Accepted values for `start_charge_thresh` : 2 - 96
> * `stop_charge_thresh > start_charge_thresh`
> * `stop_charge_thresh - start_charge_thresh = 4`

<br>

{: .note }
> The sequence of applying threshold in command-line matters, as in whether to set `stop_charge_thresh` first or the apply `stop_charge_thresh` first.<br><br>
> The condition `stop_charge_thresh > start_charge_thresh` must be fulfilled in order for charging threshold to apply. Threshold values will not be accepted if `start_charge_thresh` is less than `stop_charge_thresh`<br>
>
>**For example 1: Increase threshold**
>> Laptops current threshold value is:<br>`start_charge_thresh = 75`<br>`stop_charge_thresh = 80`
>
>> User want to apply new threshold value of:<br>`start_charge_thresh = 95`<br>`stop_charge_thresh = 100`
>
>>**Incorrect sequence**<br>
>> ```bash
echo '95' | pkexec tee /sys/class/power_supply/BAT0/start_charge_thresh
echo '100' | pkexec tee /sys/class/power_supply/BAT0/stop_charge_thresh
```
>> Since start_threshold is applied first `stop_charge_thresh (80)` is less than `start_charge_thresh (95)`, so the condition `stop_charge_thresh > start_charge_thresh` is not fulfilled, hence `start_charge_thresh` wont be updated.
>
>>**Correct sequence**<br>
>> ```bash
echo '100' | pkexec tee /sys/class/power_supply/BAT0/stop_charge_thresh
echo '95' | pkexec tee /sys/class/power_supply/BAT0/start_charge_thresh
```
>> Since end_threshold is applied first, `stop_charge_thresh (100)` is greater than `start_charge_thresh (75)`, so the condition `stop_charge_thresh > start_charge_thresh` is fulfilled.
>
>**For example 2: Decrease threshold**
>> Laptops current threshold value is:<br>`start_charge_thresh = 75`<br>`stop_charge_thresh = 80`
>
>> User want to apply new threshold value of:<br>`start_charge_thresh = 55`<br>`stop_charge_thresh = 60`
>
>>**Incorrect sequence**<br>
>> ```bash
echo '60' | pkexec tee /sys/class/power_supply/BAT0/stop_charge_thresh
echo '55' | pkexec tee /sys/class/power_supply/BAT0/start_charge_thresh
```
>> Since end_threshold is applied first, `stop_charge_thresh (60)` is less than `start_charge_thresh (75)`, hence the condition `stop_charge_thresh > start_charge_thresh` is not fulfilled. So `stop_charge_thresh` wont be updated.
>
>>**Correct sequence**<br>
>> ```bash
echo '55' | pkexec tee /sys/class/power_supply/BAT0/start_charge_thresh
echo '60' | pkexec tee /sys/class/power_supply/BAT0/stop_charge_thresh
```
>> Since start_threshold is applied first, `stop_charge_thresh (80)` is greater than `start_charge_thresh (55)`, so the condition `stop_charge_thresh > start_charge_thresh` is fulfilled.

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


