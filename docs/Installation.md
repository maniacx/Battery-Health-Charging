---
layout: default
title: Installation
nav_order: 4
permalink: /installation
---

# Installation

## Gnome Extension Website

[<img src="./assets/images/home/get-it-on-gnome-extension.png" width="45%">](https://extensions.gnome.org/extension/5724/battery-health-charging/)

* This extension is available on Gnome extension Website <https://extensions.gnome.org/>, which goes under a process of review during submission.
* Hence, it is recommended to install this extension from the website.
* This will require to install an `Extensions` or `Extension Manager` app to manage gnome extension.

 
[<img src="./assets/images/installation/extension.png" width="45%">](https://flathub.org/apps/org.gnome.Extensions)[<img src="./assets/images/installation/extension-manager.png" width="45%" class="float-right">](https://flathub.org/apps/com.mattjakeman.ExtensionManager)

* Either search the name the extension "Battery Health Charging" or use the website link below<br><https://extensions.gnome.org/extension/5724/battery-health-charging/>

## From Github

[<img src="./assets/images/home/view-sources-on-github.png" width="45%">](https://github.com/maniacx/Battery-Health-Charging)

* Installation from sources is not recommended, but can be installed for debugging or testing new updates that are not yet submitted to Gnome Extension.
* A prerequisite is that `gettext` need to be installed.
* Run `./install.sh` from terminal to install.


## Uninstallation


{: .warning }
Polkit Rules: Uninstalling this extension will not remove polkit rules, so has to be done manually.<br>If decision has been made to uninstall and not use this extension, before uninstalling this extension, please remove/uninstall polkit rules using Extension Preferences > General Tab.

{: .warning }
Dell Command Configure Bios Password: If decision has been made to uninstall and not use this extension, User that have used Bios password to validate changing mode / threshold are recommended to turn off `Need bios password to change mode/threshold`. This will remove/delete the saved bios password in Gnome Keyring.

To uninstall this extension, use `Extensions`  or `Extension Manager` app.
<br>
<br>
<br>
Although not neccesary, but to take a step further and remove all gsettings save by this extension, can be done in terminal by the following command below:
```bash
gsettings --schemadir /home/$USER/.local/share/gnome-shell/extensions/Battery-Health-Charging@maniacx.github.com/schemas reset-recursively org.gnome.shell.extensions.Battery-Health-Charging
```


