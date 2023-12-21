---
layout: default
title: Installation
nav_order: 4
permalink: /installation
---

# Installation

{: .warning }
This extension may conflict with other battery charging threshold control apps, extensions, or local workaround scripts. It's better to disable or remove them before using this extension.

## Gnome Extension Website

[<img src="./assets/images/home/get-it-on-gnome-extension.png" width="45%">](https://extensions.gnome.org/extension/5724/battery-health-charging/)

* The extension is available on the Gnome Extension Website https://extensions.gnome.org/, where it undergoes a review process upon submission.
* Therefore, it's recommended to install this extension from the website.
* This will require installing an Extensions or Extension Manager app to manage the Gnome extension.

 
[<img src="./assets/images/installation/extension.png" width="45%">](https://flathub.org/apps/org.gnome.Extensions)[<img src="./assets/images/installation/extension-manager.png" width="45%" class="float-right">](https://flathub.org/apps/com.mattjakeman.ExtensionManager)

* Either search for the extension by its name, "Battery Health Charging" or use the website link below<br><https://extensions.gnome.org/extension/5724/battery-health-charging/>

## From Github

[<img src="./assets/images/home/view-sources-on-github.png" width="45%">](https://github.com/maniacx/Battery-Health-Charging)

* Installation from sources is not recommended but can be done for debugging or testing new updates not yet submitted to Gnome Extension.
* A prerequisite is that gettext needs to be installed.
* Run `./install.sh` from terminal to install.


## Uninstallation


{: .warning }
Polkit Rules: Uninstalling this extension will not remove polkit rules, so it has to be done manually.<br>If decided to uninstall and not use this extension, before uninstallation, please remove/uninstall polkit rules using Extension Preferences > General Tab.

{: .warning }
Dell Command Configure BIOS Password: If decided to uninstall this extension, users who used a BIOS password to validate changing mode/threshold are recommended to turn off Need BIOS password to change mode/threshold. This action will remove/delete the saved BIOS password in Gnome Keyring.

To uninstall this extension, use the `Extensions`  or `Extension Manager` app.
<br>
<br>
<br>
Although not neccesary, to take a step further and remove all gsettings saved by this extension, you can use the following terminal command:
```bash
gsettings --schemadir /home/$USER/.local/share/gnome-shell/extensions/Battery-Health-Charging@maniacx.github.com/schemas reset-recursively org.gnome.shell.extensions.Battery-Health-Charging
```


