---
layout: default
title: Apple-M-Series
parent: Device Compatibility
permalink: /device-compatibility/apple-m-series
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

# Apple Macbook M-series chip (Asahi Linux)

{: .note }
Kernel versions Post 6.3.xxx and Pre 6.2.xxx have different capability, hence will be explained seperately.


## Capability
### Post Kernel 6.3.xxx
* 2 preset Full capacity and Maximum Life Span mode set at 100% and 80%.
* Fixed threshold (not customizable).

### Pre Kernel 6.2.xxx
* 3 presets: Full Capacity Mode, Balance Mode, and Maximum Life Span mode.
* Default threshold values of these 3 preset modes are set at 100%, 80%, and 60%.
* Each preset threshold value can be customized between 100-80 %, 85-65 %, and 85-50 % respectively.

## Dependencies
Depends on `asahi linux kernel`.<br>
<https://asahilinux.org/>

{: .note }
`asahi linux kernel` is supported by a third party and this extension/author is not in any way responsible for the kernel module installation, bugs or damages.

## Detection
This extension supports Apple-M laptops by checking the existence of following sysfs paths for charging threshold below.

```
/sys/class/power_supply/macsmc-battery/charge_control_end_threshold
/sys/class/power_supply/macsmc-battery/charge_control_start_threshold
```

## Quick Settings
### Post Kernel 6.3.xxx
<img src="../assets/images/device-compatibility/apple-m/quick-settings-63.png" width="100%">
<div class="outer-container">
    <span class="txt-horizantal-align"><b>Gnome 43 and above</b></span>
    <span class="txt-horizantal-align"><b>Gnome 42</b></span>
</div>

### Pre Kernel 6.2.xxx
<img src="../assets/images/device-compatibility/apple-m/quick-settings-62.png" width="100%">
<div class="outer-container">
    <span class="txt-horizantal-align"><b>Gnome 43 and above</b></span>
    <span class="txt-horizantal-align"><b>Gnome 42</b></span>
</div>

## Extension Preferences
### Post Kernel 6.3.xxx
<img src="../assets/images/device-compatibility/apple-m/settings-63.png" width="100%">

### Pre Kernel 6.2.xxx
<img src="../assets/images/device-compatibility/apple-m/settings-62.png" width="100%">

## Information
The extension applies threshold using `echo` command.<br>
Charging threshold value can be applied by using `echo` command in `terminal`.
Command below are helpful :
* Prior to installing extension, to check compatibility.
* During debugging, to check if threshold can be applied and read using command-line correctly.
* Incase user decides to not use extension and prefer changing via command-line.

<br>
### Post Kernel 6.3.xxx
**For example:**<br>To apply threshold value of `80`, the command would be.

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '80' > /sys/class/power_supply/macsmc-battery/charge_control_end_threshold
```

{: .note }
In kernel 6.3.xxx,  setting threshold value of `charge_control_start_threshold` is not required.<br>The value of `charge_control_start_threshold` is automatically set by the kernel, depending on the value of `charge_control_end_threshold`.

<br>
### Post Kernel 6.2.xxx
**For example:**<br>To apply start threshold value of `55`, end threshold value of `60`, command would be.

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '55' > /sys/class/power_supply/macsmc-battery/charge_control_start_threshold
echo '60' > /sys/class/power_supply/macsmc-battery/charge_control_end_threshold
```

<br>
<br>
The current threshold value can also be read using `cat` command in `terminal`.
```bash
cat /sys/class/power_supply/macsmc-battery/charge_control_end_threshold
```
<br>

{: .important-title }
> Condition for applying threshold
>
> * For Post Kernel 6.3.xxx , accepted values for `charge_control_end_threshold` : 80 or 100
> * For Pre Kernel 6.2.xxx , accepted values for `charge_control_end_threshold` : 1 or 100
> * For Pre Kernel 6.2.xxx , accepted values for `charge_control_start_threshold` : 0 or 99
