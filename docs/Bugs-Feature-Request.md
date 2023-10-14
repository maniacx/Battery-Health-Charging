---
layout: default
title: Bugs / Feature Request
nav_order: 6
permalink: /bugs-feature-request
---


# Bugs and Debugging

If for some reason you face issue's with this extension. Do the following.

1. Check if your laptop is supported under `Device Compatibility`.
2. Check if any dependencies required. You will find it under `Device Compatibility > [Make/Model] > Dependencies`
3. Disable the extension, and set mode or threshold using command line. You will find it under `Device Compatibility > [Make/Model] >  Information`
4. Reset gsetting for this extension. To do this first disable the extension using `Extensions` or `Extension Manager` app. To reset gsettings for Battery Health Charging extension, in `terminal` use the command below:<br>
```bash
gsettings --schemadir /home/$USER/.local/share/gnome-shell/extensions/Battery-Health-Charging@maniacx.github.com/schemas reset-recursively org.gnome.shell.extensions.Battery-Health-Charging
```
5. check the extension by enabling it again in `Extensions` or `Extension Manager` app.
6. If issue still persist, [Raise an issue on Github](https://github.com/maniacx/Battery-Health-Charging/issues){: .btn .btn-purple .v-align-bottom .fs-2}
7. Mention your problem with the details below.
   * Gnome Version (you will find it in `about` section in your desktop Settings (Gnome Control Center))
   * Operating system (e.g. Ubuntu 22.04)
   * Laptop Make and Model (e.g. Asus Viwobook)
   
Although there are no logs included in this extension, you can still check and monitor, if there are any error showing in the log by using the command in `terminal`

Gnome Shell - logs related to extension 
```bash
journalctl -f -o cat /usr/bin/gnome-shell
```

GJS - logs related to extension preferences
```bash
journalctl -f -o cat /usr/bin/gjs
```

# Feature Request

### New feature
For new feature request or new laptop support [Raise an issue on Github](https://github.com/maniacx/Battery-Health-Charging/issues){: .btn .btn-purple .v-align-bottom .fs-2}


### Support new model

{: .note } 
Charging threshold is hardware feature and is controlled by laptop's hardware `Embedded Controller` which controls the charging limits even when laptop is powered off. It is not a software feature.

For request to support new laptop model
 1. Verify the laptop has hardware capability to change charging limit/threshold. Usually you will see charging threshold settings in system BIOS or/and Software apps provided by OEM.
 2. Verify the laptop can change charging limit/threshold in linux.
 3. [Raise an issue on Github](https://github.com/maniacx/Battery-Health-Charging/issues){: .btn .btn-purple .v-align-bottom .fs-2} with the detail description on command used to change threshold.
 
 

