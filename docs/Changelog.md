---
layout: default
title: Changelogs
nav_order: 8
permalink: /changelogs
---

# Changelogs
{: .important-title }
> GN-45_Version 34 &emsp;&emsp; Oct 15, 2023 
> * Added support for Dell to validate system(bios) password using Gnome keyring, for changing charging mode/threshold
> * Remove polkit command for Razer as it doesn't need roo
> * Redesigned `About` UI in extension preferences
> * Added charging LED control for Apple Intel.

{: .note-title }
> GN-44_Version 33 &emsp;&emsp; Oct 15, 2023
> * Added support for Dell to validate system(bios) password using Gnome keyring, for changing charging mode/threshold
> * Remove polkit command for Razer as it doesn't need roo
> * Redesigned `About` UI in extension preferences
> * Added charging LED control for Apple Intel.

{: .important-title }
> GN-45_Version 32 &emsp;&emsp; Sep 25, 2023 
> * Razer doesn't need root privileges for razer-cli so they do no need to install polkit rules. No Installation setting or notifications regarding polkit rules will be available for Razer devices
> * Add missing properties for thinkpad

{: .note-title }
> GN-44_Version 31 &emsp;&emsp; Sep 25, 2023
> * Razer doesn't need root privileges for razer-cli so they do no need to install polkit rules. No Installation setting or notifications regarding polkit rules will be available for Razer devices
> * Add missing properties for thinkpad

{: .important-title }
> GN-45_Version 30 &emsp;&emsp; Sep 23, 2023
> * Add support for Razer Laptop
> * Add support for Sony High Speed Charging
> * Added "About" tab/page in Preferences. (Removed the icon and popup menu that provided same functionality).

{: .note-title }
> GN-44_Version 29 &emsp;&emsp; Sep 23, 2023
> * Add support for Razer Laptop
> * Add support for Sony High Speed Charging
> * Added "About" tab/page in Preferences. (Removed the icon and popup menu that provided same functionality).

{: .important-title }
> GN-45_Version 28 &emsp;&emsp; Sep 09, 2023
> * Removed unused imports

{: .important-title }
> GN-45_Version 27 &emsp;&emsp; Sep 09, 2023
> * Ported to Gnome 45

{: .note-title }
> GN-44_Version 26 &emsp;&emsp; Sep 08, 2023
> * Fixed battery2 customize threshold not rejecting values entered out of limit
> * Rewrote extension for better portability of upcoming gnome release

{: .important-title }
> Version 25 &emsp;&emsp; Sep 06, 2023
> * Fix for devices which doesn't immediately update threshold after writing. Added re-verification by reading threshold after 200ms if threshold fails verification the first time.
> * Fix error for thinkpad legacy when disabling extension

{: .important-title }
> Version 24 &emsp;&emsp; Jul 05, 2023
> * Dell: Fixed unsupported device for dell libsmbios on debian

{: .important-title }
> Version 23  &emsp;&emsp; Jun 10, 2023
> * translation updates
> * Toshiba: used upower to get battery level which is used to show/hide threshold options
> * Asahi-linux: Support new implementation of charging threshold on 6.3 kernels 

{: .important-title }
> Version 22  &emsp;&emsp; May 31, 2023
> * Italian translation contribution (Thanks dalz)
> * Added additional check for detection of laptop, as dells libsmbios can be installed as dependencies on non-dell laptops (Thanks hensnenenej for debugging and report it)
> * Added a settings option to choose betweem libsmbios and dell command center if both packages are installed on dell device.
> * Added battery removal detection for dual battery thinkpads (untested).
> * Fix threshold setting on full-capacity mode for sony laptops.
> * Added a notification message if threshold fails to update.
> * Added detected device name on error notifications (Helps debugging incase extension detect as wrong device)
> * Removed verify threshold by readback after setting threshold as reading charging threshold is buggy on toshiba
> * Remove option to change charging threshold to 80% if battery level is more than 80% on toshiba.

{: .important-title }
> Version 21  &emsp;&emsp; May 22, 2023
> * German translation contribution (Thanks olebole)
> * Fix for some thinkpad mode conditions where start threshold should be less than end threshold. (Thanks olebole)
> * Adjusted allowed custom valueLegacy thinkpad (tpsmapi) as allowed values for end endthreshold > startthreshold + 5

{: .important-title }
> Version 20  &emsp;&emsp; May 18, 2023
> * Turkish translation contribution (Thanks sabriunal)
> * Used CHECK Icons (Same as wifi) for displaying selected mode, instead of ugly CHECK ornament unicode.
> * Removed threshold value displayed on panel/notification for lenovo ideapad/legion. When charging limit is enabled (conservation mode), Some models sets threshold to 60% and some models set threhsold to 80%, and the kernel doesnt report what is the current threshold value is, but only informs that charging limit is enabled or disabled. Now it will report only the current mode. conservation mode enabled displays max lifespan mode. conservation mode disable display full capacity mode.
> * Removed threshold value displayed on panel/notification for Samsung laptop. When charging limit is enabled (battery_life_extender), Some models sets threshold to 60% and some models set threhsold to 80%, and the kernel doesnt report what is the current threshold value is, but only informs that charging limit is enabled or disabled. Now it will report only the current mode. battery_life_extender mode enabled, displays max lifespan mode. battery_life_extender mode disable, display full capacity mode.
> * Same goes for panasonic

{: .important-title }
> Version 19  &emsp;&emsp; May 12, 2023
> * Dutch translation contribution (Thanks Vistaus)

{: .important-title }
> Version 18  &emsp;&emsp; May 12, 2023
> * Strings correction and translation contribution (google translate)
> * Partial Polland and Ukrainian translation (Thanks viksok) 

{: .important-title }
> Version 17  &emsp;&emsp; May 08, 2023
> * Strings correction
> * Used suggested crowdin translations for incomplete translation
> * Few asus device do not restore threshold on resume after suspend. Fixed. (Thanks AbrarSL)
> * Used session-mode.

{: .important-title }
> Version 16  &emsp;&emsp; May 01, 2023
> * Hungarian translation contribution (Thanks ViBE-HU)
> * Extension only writes new threshold if new mode/threshold is different than the current mode/threshold. 
> * Added support for Dell laptop using cctk
> * Added support for Tuxedo laptops using tuxedo-keyboard (Thanks r_wraith)
> * Added support for few gigabyte aero/aorus module (Thanks tangalbert919)

{: .important-title }
> Version 15  &emsp;&emsp; Apr 27, 2023
> * Added support to Apple Macbook M processora running Asahi Linux (teohhanhui)

{: .important-title }
> Version 14  &emsp;&emsp; Apr 25, 2023
> * Gnome43/44: changed ornament from DOT to CHECK to match the power-profile quicktogglemenu ornament. (Thanks ai)

{: .important-title }
> Version 13  &emsp;&emsp; Apr 24, 2023
> * Fix for Gnome43 which broke with version 12

{: .important-title }
> Version 12  &emsp;&emsp; Apr 23, 2023
> * Added support for Gnome42 (Thanks ViBE-HU)
> * For Single Battery Devices, Click on quick toggle will change mode. (Full Capacity Mode = default color. Other modes = highlighed color) (Thanks f_cristobal)
> * For Dual Battery Devices, Click on quick toggle will switch battery panel mode. (Same as earlier version)

{: .important-title }
> Version 11  &emsp;&emsp; Apr 2, 2023
> * Added option to change behavior of system battery indicator
> * In current threshold the text "currently active" will be displayed indicating the current mode


{: .important-title }
> Version 10  &emsp;&emsp; Mar 28, 2023
> * Add option to change index of system indicator in general prefs
> * Re-add vendor checks for thinkpad with correct path as it conflicts with huawei which also uses the same sysfs path.
> * Fix for Huawei. Used correct sysfs path.
> * Added support for Panasonic devices and Intel QC71 devices
>
> (Thanks to mascherm for raising issue and testing for Huawei laptop)


{: .important-title }
> Version 9  &emsp;&emsp; Mar 18, 2023
> * Remove vendor checks for thinkpad.
>
> (Thanks to kir-93 for raising issue and testing for thinkpad laptop)


{: .important-title }
> Version 8  &emsp;&emsp; Mar 17, 2023
> * Added dell, msi and sys76 
> * Seperated devices in different class
> * Removed delay timer and update UI with signal on completion of writing and reading threshold value
> * Changed/widen the range for end and start threshold for custom device
>
> (Thanks to monethass for the testing and support for dell devices)
> (Thanks to asant and anzigo for the testing and support for acer laptop)


{: .important-title }
> Version 7  &emsp;&emsp; Mar 3, 2023
> * Do not detroy popupmenu during UIupdates instead. Instead just change/update the text and icon. Instead of updating everything, update only specific items that requires updates.
> * Fixed Binding
> * Added extension pref button in quicksettings
> * Added option in Prefs to remove extension pref button from quicksettings
> * Fixes for Gnome44
> * Show mode in text quicksetting toggle subtitle (Gnome 44 only)
> * Added option in Prefs to remove mode mode showing in quicksetting toggle subtitle
> * Fixed initializing of pref if pref is open before enabling extension for the first time
> * Destroy notification of this extension on extension disable
> * Destroy notification on when new notification recieved.
> * Added icon on popup menu showing current threshold read
> * Spanish translation contribution (Thanks: Valeria)


{: .important-title }
> Version 6  &emsp;&emsp; Feb 25, 2023
> * Log only during installation and uninstalltion of polkit script


{: .important-title }
> Version 5  &emsp;&emsp; Feb 20, 2023
> * Remove Glib timer on disable
> * Fix notifcation


{: .important-title }
> Version 4  &emsp;&emsp; Feb 20, 2023
> * Removed usage of systemd service to change permision of sysfs charge_control_end_threshold.
> * Use Polkit for a way to write to sysfs threshold using root permission. (Ported from Deminder Shutdown timer)
> * Pref UI changes
> * Added option to disable notification
> * Quick Setting UI changes
> * Polkit: Fixed serveral issue, and issue checking of version of polkit and ctl
> * Polkit: clean up and remove unneeded code
> * Added support for more device. Thinkpad, acer, lenovo, huawei, sony, samsung, lg.
> * Added notification to remove older systemd service files if detected.
> * Added delay timer to delay updating panel and indicator UI so that threshold are written and read back from sysfs 
> * Added more icon for different devices
(Thanks to yukina3230 for the testing and support for polkit)


{: .important-title }
> Version 3  &emsp;&emsp; Feb 8, 2023
> * Added support for devices with start threshold as well
> * Added notification during update
> * Added a subtitle in pref showing acceptable range of customizable value


{: .important-title }
> Version 2  &emsp;&emsp; Feb 4, 2023
> * Added Extension prefs button to notifcation prompt for installation
> * Added notifcation upon sucessfull removal of systemd service file
 
 
{: .important-title }
> Version 1  &emsp;&emsp; Feb 3, 2023
> * Initial Release.
> * Works on asus device
> * Uses systemd service to change permision of sysfs charge_control_end_threshold.
> * Feature enable/disable system indicator, change icons, install systemd service, customizable threshold, notifications for installation, removal and error


