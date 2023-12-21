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

<img src="./assets/images/how-to-use/quick-settings-toggle.gif" width="100%">
* **Left image** For laptops with a single battery, toggling the quick settings button will cycle through all available modes.
* **Right image** For laptops with dual batteries, toggling the quick settings button will switch the panel between Battery 1 and Battery 2.

---

## Quick Settings: Available Modes or Presets

<img src="./assets/images/how-to-use/modes.png" width="100%">
* If your laptop's thresholds are customizable, you can set up 3 presets.
* If your laptop's thresholds are not customizable, you may have two or more charging modes/thresholds as provided by your laptop.
* Selecting a mode will send a command to change the charging mode or threshold.

---

## Quick Settings: Mode or Threshold Read from Kernel or Package

<img src="./assets/images/how-to-use/read-back.png" width="100%">
This display shows the threshold or mode read from the embedded controller via kernel or packages after the threshold was set. If the threshold didn't apply for some reason, you will see the feedback here.

---

## Quick Settings: Extension Preferences Shortcut

<img src="./assets/images/how-to-use/extension-prefs.png" width="100%">
Clicking the **gear** icon on the Quick Settings panel will take you to the extension's preferences page.

---

## Extension Preferences: Choose Icon Style

<img src="./assets/images/how-to-use/indicator-icon.gif" width="100%">
Three sets of icons are available to choose for the indicator and quick panel.

{: .note }
For laptops with customization of threshold, this setting is available only with the default threshold mode.
If the customized threshold mode is selected, the icons on the indicator and quick panel will be set to **symbols only**.

---

## Extension Preferences: Show Notification

<img src="./assets/images/how-to-use/notification.png" width="100%">
When the charging threshold or mode is changed, a notification is displayed with the currently applied threshold or mode. If these notifications are too intrusive, you can turn off this setting to disable the notifications.

{: .note }
Switching this setting OFF will disable notifications only for threshold or mode changes. However, notifications related to polkit rules or errors with this extension will still be displayed.

---

## Extension Preferences: Show Preference Button

<img src="./assets/images/how-to-use/preference-icon.gif" width="100%">
Switching this setting OFF will remove the extension preferences shortcut (**gear icon**) displayed in quick settings.

---

## Extension Preferences: Display Subtitle With Current Mode On Quick Menu Button

<img src="./assets/images/how-to-use/quick-setting-subtitles.gif" width="100%">
In Gnome 44, the Quick Settings Toggle-button with a subtitle (small text) will display the current preset or mode. Disabling this will remove this subtitle, making it look like the toggle-button in Gnome 43.

---

## Extension Preferences: Show System Indicator

<img src="./assets/images/how-to-use/disable-indicator.gif" width="100%">
Disables the indicator icon for this extension from the system tray.

---

## Extension Preferences: Indicator Index

<img src="./assets/images/how-to-use/indicator-index.gif" width="100%">
Move the position of the indicator icon in the system tray.

---

## Extension Preferences: Change Battery Indicator Icon Behavior

<img src="./assets/images/how-to-use/battery-icon.gif" width="100%">
When the **charger is powered and plugged in** and **the battery level reaches the charging threshold limit**, the UPower system enters a state called charge-pending, also known as the ***Charging on Hold*** state.

**Default Behavior on Gnome Desktop:**

<img src="./assets/images/features/battery-level-80-discharging.png" width="100">
* When the system enters the ***Charging on Hold*** state, the default behavior of the Gnome Desktop is to display the battery status.
* The System battery indicator will display the `Battery discharging` icon.
* The drawback here is, there is no way of knowing if the charger is plugged and powered.

**Behavior on Windows Operating System:**

<img src="./assets/images/features/battery-level-80-charging.png" width="100">
* When the system enters the ***Charging on Hold*** state, the default behavior on Windows Operating System is to show the status of the charger. The battery icon on the system tray will display a `Battery Charging` icon.
* This way, the icon informs us if the charger is plugged in and powered on or not.

Enabling this option will change the behavior of the system battery indicator to be similar to the Windows Operating System, thereby informing us of the charger's status.
Disabling this option will revert the behavior of the system battery indicator to the default Gnome Desktop way, thereby informing us of the battery status.

---

## Extension Preferences: Install Privileges to This User

<img src="./assets/images/how-to-use/polkit-rules-installation.png" width="100%">
* For laptops that need root permission to set charging thresholds or modes, polkit rules need to be installed to allow this extension to set thresholds or modes.
* By not requesting the root password during the changing of the charging mode threshold on every power-up or login, this provides ease of use for the extension, thus necessitating the installation of polkit rules.
* The extension will only ask for root permission once during the installation, update, or removal of polkit rules.

{: .important }
Removing this extension will not remove the polkit rules, so this must be done manually. If you decide to uninstall and not use this extension, please remove/uninstall the polkit rules using this setting before uninstalling the extension.

{: .note }
This setting will not be available for laptops that do not require root permission to set charging thresholds or modes.

---

## Extension Preferences: Customize Threshold

<img src="./assets/images/how-to-use/threshold-customization.png" width="100%">
* To set custom preset values for the charging threshold, click on **Customize**.
* Enter the custom threshold values and click **Apply**.
* (Left Image) Setting available for laptops with an end threshold value (aka Charging Limit).
* (Right Image) Setting available for laptops with start and end threshold values.

{: .note }
This setting will not be available on laptops with fixed thresholds.


