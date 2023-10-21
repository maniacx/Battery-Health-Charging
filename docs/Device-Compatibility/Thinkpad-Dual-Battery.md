---
layout: default
title: Thinkpad (Dual)
parent: Device Compatibility
permalink: /device-compatibility/thinkpad-dual
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
* Each preset start threshold value can be customized between is 98-75 %, 83-60 %, and 83-40 % respectively.
* The difference between end and start threshold cannot be less than 2%.

## Dependencies
* No dependencies required.
* Thinkpad laptop that allows setting charging threshold are supported by mainline linux kernels.

## Detection
This extension supports Thinkpad laptops by checking the existence of following sysfs paths for charging threshold below.

```
/sys/class/power_supply/BAT0/charge_control_start_threshold
/sys/class/power_supply/BAT0/charge_control_end_threshold
/sys/class/power_supply/BAT0/charge_control_start_threshold
/sys/class/power_supply/BAT0/charge_control_end_threshold
```
Additionally it will also check the existence of sysfs path for wmi.

`/sys/devices/platform/thinkpad_acpi`

## Quick Settings
<br>
<img src="../assets/images/device-compatibility/thinkpad-dual-battery/quick-settings.gif" width="100%">
<div class="outer-container">
    <span class="txt-horizantal-align"><b>Gnome 43 and above</b></span>
    <span class="txt-horizantal-align"><b>Gnome 42</b></span>
</div>

## Extension Preferences
<br>
<img src="../assets/images/device-compatibility/thinkpad-dual-battery/settings.gif" width="100%">
<br>

## Information
The extension changes mode using `echo` command.<br>
Charging threshold value can be applied by using `echo` command in `terminal`.
Command below are helpful :
* Prior to installing extension, to check compatibility.
* During debugging, to check if threshold can be applied and read using command-line correctly.
* Incase user decides to not use extension and prefer changing via command-line.

<br>

**For example:**<br>To apply threshold on secondary battery (BAT1) with start threshold value of `55`, end threshold value of `60`, command would be.

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '55' > /sys/class/power_supply/BAT1/charge_control_start_threshold
echo '60' > /sys/class/power_supply/BAT1/charge_control_end_threshold
```
<br>

The current threshold value can also be read using `cat` command in `terminal`.
```bash
cat /sys/class/power_supply/BAT1/charge_control_start_threshold
cat /sys/class/power_supply/BAT1/charge_control_end_threshold
```
<br>

{: .important-title }
> Condition for applying threshold
>
> * Accepted values for `charge_control_end_threshold` : 1 - 100
> * Accepted values for `charge_control_start_threshold` : 0 - 99
> * `charge_control_end_threshold` > `charge_control_start_threshold`

<br>

{: .note }
> The sequence of applying threshold in command-line matters, as in whether to set `charge_control_end_threshold` first or the apply `charge_control_end_threshold` first.<br><br>
> The condition `charge_control_end_threshold > charge_control_start_threshold` must be fulfilled in order for charging threshold to apply. Threshold values will not be accepted if `charge_control_start_threshold` is less than `charge_control_end_threshold`<br>
>
>**For example 1: Increase threshold**
>> Laptops current threshold value is:<br>`charge_control_start_threshold = 75`<br>`charge_control_end_threshold = 80`
>
>> User want to apply new threshold value of:<br>`charge_control_start_threshold = 95`<br>`charge_control_end_threshold = 100`
>
>>**Incorrect sequence**<br>
>> ```bash
echo '95' > /sys/class/power_supply/BAT0/charge_control_start_threshold
echo '100' > /sys/class/power_supply/BAT0/charge_control_end_threshold
```
>> Since start_threshold is applied first `charge_control_end_threshold (80)` is less than `charge_control_start_threshold (95)`, so the condition `charge_control_end_threshold > charge_control_start_threshold` is not fulfilled, hence `charge_control_start_threshold` wont be updated.
>
>>**Correct sequence**<br>
>> ```bash
echo '100' > /sys/class/power_supply/BAT0/charge_control_end_threshold
echo '95' > /sys/class/power_supply/BAT0/charge_control_start_threshold
```
>> Since end_threshold is applied first, `charge_control_end_threshold (100)` is greater than `charge_control_start_threshold (75)`, so the condition `charge_control_end_threshold > charge_control_start_threshold` is fulfilled.
>
>**For example 2: Decrease threshold**
>> Laptops current threshold value is:<br>`charge_control_start_threshold = 75`<br>`charge_control_end_threshold = 80`
>
>> User want to apply new threshold value of:<br>`charge_control_start_threshold = 55`<br>`charge_control_end_threshold = 60`
>
>>**Incorrect sequence**<br>
>> ```bash
echo '60' > /sys/class/power_supply/BAT0/charge_control_end_threshold
echo '55' > /sys/class/power_supply/BAT0/charge_control_start_threshold
```
>> Since end_threshold is applied first, `charge_control_end_threshold (60)` is less than `charge_control_start_threshold (75)`, hence the condition `charge_control_end_threshold > charge_control_start_threshold` is not fulfilled. So `charge_control_end_threshold` wont be updated.
>
>>**Correct sequence**<br>
>> ```bash
echo '55' > /sys/class/power_supply/BAT0/charge_control_start_threshold
echo '60' > /sys/class/power_supply/BAT0/charge_control_end_threshold
```
>> Since start_threshold is applied first, `charge_control_end_threshold (80)` is greater than `charge_control_start_threshold (55)`, so the condition `charge_control_end_threshold > charge_control_start_threshold` is fulfilled.

