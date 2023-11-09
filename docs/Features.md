---
layout: default
title: Features
nav_order: 2
permalink: /features
---

# Features

### **Automatic detection of laptop type model**
This extension detects laptop model type and displays the options for applying charging thresholds accordingly. Depending on manufacturer, some laptop models have fixed threshold, while some laptop model threshold can be customized.
Also some laptop may have additional modes such as high speed charging or adaptive.

---
### **Persist on reboot**
The charging mode/limit/threshold persists on reboot. One thing to note, the charging threshold is applied as soon as extension is enabled. And extensions are only enabled when user logs in. From the time when the laptop is powered ON and initialized, till the time when user logs in, charging threshold wont be applied as the extension is disabled. When the user logs in the extension will be enabled and the threshold will be applied.

---
### **Systems battery indicator behavior (system tray) when threshold is applied.**
When charger is powered and plugged, charging threshold is set and battery level reaches the threshold value, the charger will only supply power to the system and not charge the battery. This is called ***Charging on hold*** state.

**Default Behavior on Gnome Desktop:**

<img src="./assets/images/features/battery-level-80-discharging.png" width="100">
* When system enters ***Charging on hold*** state, default behavior of Gnome Desktop is to display the status of battery.
* So the System battery indicator will display `Battery discharging` icon.
* The drawback here is ,there is no way of knowing if charger is plugged and powered.

**Behavior on Windows Operating System:**

<img src="./assets/images/features/battery-level-80-charging.png" width="100">
* When system enters ***Charging on hold*** state, default behavior on Windows Operating system is show the status of charger. The battery icon on system tray will display a `Battery Charging` icon.
* This gives us the information if charger is plugged and powered on or not.

This extension gives option to change the behavior of system battery indicator to the Windows Operating system way, thereby informing us the status of charger.

---
### **Root privileges**
Root privileged access (root permissions) to change the threshold, this extension will prompt you to install polkit rules. These polkit rules allows the extension to apply threshold with root privileges. This way the extension can apply charging threshold without asking for passwords and also restore charging threshold on system reboots.

---
### **Customization of threshold**
Option to customize threshold for laptops that support custom threshold. User can assign 3 presets of custom threshold and change the presets in quick settings panel

---
### **User interfaces**
1. Extension Preferences icon in quick settings menu. And added option in preference to remove this icon from quick setting.

2. Option to choose 3 set of icons for indicator and quick setting in Extension Preferences.

3. Shows an icon indicating current mode. And added option in preference to change index and also to disable showing icon

4. Displays notification when threshold/mode is changed. And added option in preference to disable notification update

5. Display current mode subtitles in quicksetting toggle (Gnome 44 and above). And added an option in preference to remove this subtitle.

---
### **Device related**
For additional device related feature check [Device Compatibility](./device-compatibility)


