---
layout: default
title: Razer
parent: Device Compatibility
permalink: /device-compatibility/razer
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

# Razer

## Capability
* 3 presets: Full Capacity Mode, Balance Mode, and Maximum Life Span mode.
* Full Capacity mode threshold value is not customizable (Fixed at 100%).
* Balanced Mode and Maximum Life Span mode threshold value can be customized between , 80-65 %, and 80-50 % respectively.
* Default threshold values of these 3 preset modes are set at 100%, 80%, and 60%.
* Razer laptop do not need root permission to change threshold, so installation settings for polkit rules will not be available.

## Dependencies
Depends on separate package `razer-cli`, that need to be installed.<br>
<https://github.com/Razer-Linux/razer-laptop-control-no-dkms>

{: .note }
`razer-cli` package is supported by a third party and this extension/author is not in any way responsible for the kernel module installation, bugs or damages.

## Detection
This extension supports Razer laptops by checking for the razer-cli installation at default path.

`/usr/bin/razer-cli`<br>

## Quick Settings
<br>
<img src="../assets/images/device-compatibility/razer/quick-settings.png" width="100%">
<div class="outer-container">
    <span class="txt-horizantal-align"><b>Gnome 43 and above</b></span>
    <span class="txt-horizantal-align"><b>Gnome 42</b></span>
</div>

## Extension Preferences
<br>
<img src="../assets/images/device-compatibility/razer/settings.png" width="100%">

## Information
It is possible to set charging mode or threshold using `razer-cli` command in `terminal`.
Command below are helpful :
* Prior to installing extension, to check compatibility.
* During debugging, to check if threshold can be applied and read using command-line correctly.
* Incase user decides to not use extension and prefer changing via command-line.

<br>

**For example**

To turn off **battery health optimization** mode (equivalent to setting threshold at 100%), the command would be
```
razer-cli write bho off
```
<br>

To turn on **battery health optimization** and apply threshold value of `60`, the command would be.
```
razer-cli write bho on 60
```
<br>

To read current threshold value.
```
razer-cli read bho
```
<br>

{: .important-title }
> Condition for applying threshold
>
> * Accepted values for `bho` : 50 - 80

