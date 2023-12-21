---
layout: default
title: Bugs / Feature Request
nav_order: 6
permalink: /bugs-feature-request
---


# Bugs and Debugging

If you encounter issues with this extension, please follow these steps:

1. Check if your laptop is supported under `Device Compatibility`.
2. Check for any required dependencies. You will find them listed under `Device Compatibility > [Make/Model] > Dependencies`.
3. Disable the extension, and set the mode or threshold using the command line. Instructions can be found under `Device Compatibility > [Make/Model] > Testing charging threshold using command-line`.
4. Reset the `gsettings` for this extension. First, disable the extension using the `Extensions` or `Extension Manager` app. To reset `gsettings` for the Battery Health Charging extension, use the command below in the `terminal`:
```bash
gsettings --schemadir /home/$USER/.local/share/gnome-shell/extensions/Battery-Health-Charging@maniacx.github.com/schemas reset-recursively org.gnome.shell.extensions.Battery-Health-Charging
```
5. Check the extension by enabling it again in the `Extensions` or `Extension Manager` app.
6. If the issue still persists, [Raise an issue on Github](https://github.com/maniacx/Battery-Health-Charging/issues){: .btn .btn-purple .v-align-bottom .fs-2}.
7. When reporting the issue, include the following details:
   * Gnome Version (found in the `about` section of your desktop settings (Gnome Control Center))
   * Operating system (e.g., Ubuntu 22.04)
   * Laptop Make and Model (e.g., Asus Vivobook)
   
Although there are no logs included in this extension, you can still monitor for any errors in the log by using the following commands in the `terminal`:

For Gnome Shell - logs related to the extension:
```bash
journalctl -f -o cat /usr/bin/gnome-shell
```

For GJS - logs related to extension preferences:
```bash
journalctl -f -o cat /usr/bin/gjs
```

# Feature Request

### New Feature
For new feature requests or support for new laptop models, [Raise an issue on Github](https://github.com/maniacx/Battery-Health-Charging/issues){: .btn .btn-purple .v-align-bottom .fs-2}.

### Support New Model

{: .note } 
The charging threshold is a hardware feature controlled by the laptop's `Embedded Controller`, which sets the charging limits even when the laptop is powered off. It is not a software feature.

To request support for a new laptop model:
 1. Verify that the laptop has the hardware capability to change the charging limit/threshold. This is usually evident in the system BIOS or software apps provided by the OEM.
 2. Confirm that the laptop can change the charging limit/threshold in Linux.
3. [Raise an issue on Github](https://github.com/maniacx/Battery-Health-Charging/issues){: .btn .btn-purple .v-align-bottom .fs-2} with a detailed description of the commands or procedure used to change the threshold.

