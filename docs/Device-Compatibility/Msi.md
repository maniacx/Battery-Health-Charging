---
layout: default
title: MSI
parent: Device Compatibility
permalink: /device-compatibility/msi
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

# MSI

## Capability
* 3 presets: Full Capacity Mode, Balance Mode, and Maximum Life Span mode.
* Default threshold values of these 3 preset modes are set at 100%, 80%, and 60%.
* Each preset threshold value can be customized between 100-80 %, 85-65 %, and 85-50 % respectively.
* Full capacity mode is equivalent to what MSI refers to as `Best for Mobility`
* Balanced mode is equivalent to what MSI refers to as `Balance`
* Maximum Life Span mode is equivalent to what MSI refers to as `Best for Battery`


## Dependencies

{: .note }
Not required on newer kernel, as the msi-ec is already included in native linux kernels.
[https://github.com/torvalds/linux/commit/392cacf2aa10de005e58b68a58012c0c81a100c0](https://github.com/torvalds/linux/commit/392cacf2aa10de005e58b68a58012c0c81a100c0)<br>For system running older kernel, may require this dependencies.

Depends on separate kernel module `msi-ec`, that need to be installed.<br>
<https://github.com/BeardOverflow/msi-ec>

{: .note }
`msi-ec` module is supported by a third party and this extension/author is not in any way responsible for the kernel module installation, bugs or damages.

## Testing charging threshold using command-line
For MSI laptops the battery powersupply name could be `BAT0` or `BAT1`. Hence charging threshold path could be one of the following and can be check using `ls` command.<br>
`ls -l /sys/class/power_supply/BAT0/charge_control_end_threshold`<br>
`ls -l /sys/class/power_supply/BAT1/charge_control_end_threshold`<br>
If not available, probably kernel use still doesnt support charging threshold, so installation of `msi-ec` module might be necessary. After installation of `msi-ec`, check if sysfs path available using `ls` command. 

Charging mode can be set by using  `echo` command in `terminal`.
<br>
<br>

**For example:**<br>If battery power supply name is  `BAT0`, to apply threshold value of `60`, the command would be.

Require root privileges
{: .label .label-yellow .mt-0}
```bash
echo '60' | pkexec tee /sys/class/power_supply/BAT0/charge_control_end_threshold
```
<br>
`sudo` also can be used in place of `pkexec` in the above commands as both `sudo` and `pkexec` can be use to run commands in root mode. To make use of polkit rules, the extension uses `pkexec`.

{: .note }
Although MSI have sysfs path for `charge_control_start_threshold` , setting `charge_control_start_threshold` is not required.<br><br>The value of `charge_control_start_threshold` is automatically set by the kernel, 10% below `charge_control_end_threshold`.<br><br>`charge_control_start_threshold = charge_control_end_threshold - 10`

<br>
The current threshold value can also be read using `cat` command in `terminal`. For example, the laptops battery name in power supply sysfs is `BAT0`, command would be.
```bash
cat /sys/class/power_supply/BAT0/charge_control_end_threshold
```
<br>

{: .important-title }
> Condition for applying threshold
>
> * Accepted values for `charge_control_end_threshold` : 10 - 100
> * Accepted values for `charge_control_start_threshold` : 0 - 90
> * `charge_control_end_threshold - charge_control_start_threshold = 10`

If charging threshold are applied successfully using above commands, the extension is compatible.

## Quick Settings
<br>
<img src="../assets/images/device-compatibility/msi/quick-settings.png" width="100%">
<div class="outer-container">
    <span class="txt-horizantal-align"><b>Gnome 43 and above</b></span>
    <span class="txt-horizantal-align"><b>Gnome 42</b></span>
</div>

## Extension Preferences
<br>
<img src="../assets/images/device-compatibility/msi/settings.png" width="100%">


