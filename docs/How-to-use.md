---
layout: default
title: How to use
nav_order: 5
permalink: /how-to-use

---

# How to use
{: .no_toc }

A brief description with pictures / animated images.
<br>
<br>
<details open markdown="block">
  <summary>
    Table of contents
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

---

## Quick Settings: Toggle

<br>
<img src="./assets/images/how-to-use/quick-settings-toggle.gif" width="100%">
* (Left image) For laptops with single battery, toggling quick settings button will cycle through all available modes .
* (Right image) For laptops with dual battery, toggling quick settings button will switch the panel from Battery 1 and Battery 2.

---

##  Quick Settings: Available Modes Or Presets

<br>
<img src="./assets/images/how-to-use/modes.png" width="100%">
* If your laptop's threshold are customizable, you will be able to setup 3 preset.
* If your laptop's threshold are not customizable, you may have two or more charging modes/threshold as provided by your laptop.
* Selecting the mode will send command to change charging mode or threshold.

---

##  Quick Settings: Mode Or Threshold Read From Kernel Or Package

<br>
<img src="./assets/images/how-to-use/read-back.png" width="100%">
The information displays the threshold or mode read from Embedded controller via kernel or packages after the threshold was set. If for some reason the threshold didn't apply, you will see the feedback here.

---

##  Quick Settings: Extension Preferences Shortcut

<br>
<img src="./assets/images/how-to-use/extension-prefs.png" width="100%">
Clicking the **gear** icon on Quick setting panel will take you to extensions preferences page.

---

## Extension Preferences: Choose Icon Style

<br>
<img src="./assets/images/how-to-use/indicator-icon.gif" width="100%">
3 sets of icons available to choose for indicator and quickpanel.

{: .note }
For laptops with customization of threshold, this settings is available only with default threshold mode.
If customize threshold mode is selection, the icons on indicator and quick panel will be set to **symbols only**.

---

## Extension Preferences: Show Notification

<br>
<img src="./assets/images/how-to-use/notification.png" width="100%">
When charging threshold or mode is changed, a notification is displayed with the threshold or mode currently applied. If this notifications are too instrusive you can turn off this settings to disable notification.

{: .note }
Switching this setting OFF, will disable notification only for threshold or mode changes. However, notification related to polkit rules or errors with this extension will still be displayed.

---

## Extension Preferences: Show Preference Button

<br>
<img src="./assets/images/how-to-use/preference-icon.gif" width="100%">
Switching this setting OFF, will remove the extension preferences shortcut (**gear icon**) displayed in quick settings.

---

## Extension Preferences: Display Subtitle With Current Mode On Quick Menu Button

<br>
<img src="./assets/images/how-to-use/quick-setting-subtitles.gif" width="100%">
In Gnome 44, the Quick Settings Toggle-button a subtitle (small text) will display the current preset or mode. Disabling this will remove this subtitle, making it look like toggle-button in Gnome 43.

---

## Extension Preferences: Show System Indicator

<br>
<img src="./assets/images/how-to-use/disable-indicator.gif" width="100%">
Disables the indicator icon for this extension from system tray.

---

## Extension Preferences: Indicator Index

<br>
<img src="./assets/images/how-to-use/indicator-index.gif" width="100%">
Move the position of indicator icon in system tray.

---

## Extension Preferences: Change Battery Indicator Icon Behavior

<br>
<img src="./assets/images/how-to-use/battery-icon.gif" width="100%">
When the **charger is powered and plugged-in** and **the battery level reaches the charging threshold limit** , the UPower system goes into a state called charge-pending. This in general is also known as ***Charging on hold*** state.

**Default Behavior on Gnome Desktop:**

<img src="./assets/images/features/battery-level-80-discharging.png" width="100">
* When system enters ***Charging on hold*** state, default behavior of Gnome Desktop is to display the status of battery.
* So the System battery indicator will display `Battery discharging` icon.
* The drawback here is ,there is no way of knowing if charger is plugged and powered.

**Behavior on Windows Operating System:**

<img src="./assets/images/features/battery-level-80-charging.png" width="100">
* When system enters ***Charging on hold*** state, default behavior on Windows Operating system is show the status of charger. The battery icon on system tray will display a `Battery Charging` icon.
* This way the icon gives us the information if charger is plugged and powered on or not.

Enabling, this option change the behavior of system battery indicator similar to the Windows Operating system way, thereby informing us the status of charger.
Disabling this option revert the behavior of system battery indicator to default Gnome desktop way, thereby informing us the status of battery.

---

## Extension Preferences: Install Privileges to this user

<br>
<img src="./assets/images/how-to-use/polkit-rules-installation.png" width="100%">
* For laptop that need root permission to set charging threshold or modes, polkit rules need to be installed to allow this extension to set threshold or modes.
* By not requesting the root password during changing charging mode threshold, on every power-up, or every login,  this gives an ease to use the extension and thus installation of polkit rules are needed.
* The extension will on ask root permission once during installation, update or removal of polkit rules.

{: .important }
Removing this extension will not remove polkit rules, so has to be done manually.<br>If decision has been made to uninstall and not use this extension, before uninstalling this extension, please remove/uninstall polkit rules using this settings

{: .note }
This settings will not be available for laptops that do not require root permission to set charging threshold or mode.

---

## Extension Preferences: Customize threshold

<br>
<img src="./assets/images/how-to-use/threshold-customization.png" width="100%">
* To set custom preset values of charging threshold, click on **Customize**.
* Enter the custom threshold values, for an click **Apply**.
* (Left Image) Setting available for laptops with on end threshold value (aka Charging Limit).
* (Right Image) Setting available for laptops with start and end threshold value.

{: .note }
This settings will not be available on laptops with fixed threshold.

