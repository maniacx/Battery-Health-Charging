---
layout: default
title: Features
nav_order: 2
permalink: /features
---

# Features

### **Automatic Detection of Laptop Type Model**
This extension detects the laptop model type and displays options for applying charging thresholds accordingly. Depending on the manufacturer, some laptop models have fixed thresholds, while others allow customization. Additionally, some laptops may have additional modes such as high-speed charging or adaptive modes.

---

### **Persistence on Reboot**
The charging mode/limit/threshold persists on reboot. Notably, the charging threshold is applied as soon as the extension is enabled. Extensions are only enabled when the user logs in. Therefore, from the time the laptop is powered ON and initialized until the user logs in, the charging threshold won't be applied as the extension is disabled. When the user logs in, the extension will be enabled, and the threshold will be applied.

---

### **System Battery Indicator Behavior (System Tray) When Threshold Is Applied**
When the charger is powered and plugged, and the battery level reaches the threshold value, the charger will only supply power to the system and not charge the battery. This state is referred to as **"Charging on Hold."**

**Default Behavior on Gnome Desktop:**

<img src="./assets/images/features/battery-level-80-discharging.png" width="100">
* When the system enters the **"Charging on Hold"** state, the default behavior of the Gnome Desktop is to display the battery status.
* Therefore, the system battery indicator will display the `Battery discharging` icon.
* The drawback here is the absence of a way to determine if the charger is plugged in and powered.

**Behavior on Windows Operating System:**

<img src="./assets/images/features/battery-level-80-charging.png" width="100">
* When the system enters the **"Charging on Hold"** state, the default behavior on the Windows Operating system is to show the charger's status. The battery icon on the system tray will display a `Battery Charging` icon.
* This provides information about whether the charger is plugged in and powered on or not.

This extension provides an option to change the behavior of the system battery indicator to mimic that of the Windows Operating system, thereby informing users about the charger's status.

---

### **Root Privileges**
To change the threshold, this extension requires root privileged access (root permissions) and will prompt you to install polkit rules. These rules allow the extension to apply thresholds with root privileges. This way, the extension can set the charging threshold without asking for passwords and also restore the charging threshold on system reboots.

---

### **Customization of Threshold**
For laptops that support custom thresholds, users can assign three presets of custom thresholds and change the presets in the quick settings panel.

---

### **User Interfaces**
1. Extension Preferences icon in the quick settings menu. An added option in preferences allows for the removal of this icon from quick settings.

2. Option to choose three sets of icons for the indicator and quick settings in Extension Preferences.

3. Shows an icon indicating the current mode. An option in preferences allows changing the index or to disabling the icon display.

4. Displays a notification when the threshold/mode is changed. An option in preferences allows for disabling notification updates.

5. Displays current mode subtitles in the quick setting toggle (Gnome 44 and above). An option in preferences is available to remove this subtitle.

---

### **Device Related**
For additional device-related features, check [Device Compatibility](./device-compatibility).

