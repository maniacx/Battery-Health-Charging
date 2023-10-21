---
layout: default
title: Features
nav_order: 2
permalink: /features
---

# Features

1. Automatic detection of laptop. This extension detects the laptop and displays the option accordingly. Depending on manufacturer, Some laptop models have fixed threshold, while some laptop model threshold can be customized.
<br>
2. The charging mode persists on reboot.
<br>
3. If your device needs privileged access (root permissions) to change the threshold, this extension will prompt you to install polkit rules. This way the extension can change the threshold on users input and also restore it on system restarts.
<br>
4. Customize threshold (only for laptop that support custom threshold)
<br>
5. Extension Preferences icon in quick settings menu. And added option in preference to remove this icon from quick setting.
<br>
6. Option to choose 3 set of icons for indicator and quick setting in Extension Preferences.
<br>
7. Shows an icon indicating current mode. And added option in preference to change index and also to disable showing icon
<br>
8. Displays notification when threshold/mode is changed. And added option in preference to disable notification update
<br>
9. Display current mode subtitles in quicksetting toggle (Gnome 44 and above). And added an option in preference to remove this subtitle.
<br>
10. Option to change behavior of systems battery indicator. When charging threshold is set and battery level reaches threshold, the default behavior in gnome is system battery indicator will display `Battery discharging` icon and there is no way of knowing if charger is plugged and powered. Upon enabling this option, system battery indicator will display `charging` icon.

{: .note }
If option to change behavior of systems battery indicator feature, is not working for your laptop, kindly raise an issue with your and post the results of power supply name with the following command in terminal `ls -l /sys/class/power_supply`

{: .warning }
Conflicts with other battery charging threshold controls apps / extensions / local workarounds scripts, so better to disable or remove before using this extension.

