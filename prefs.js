'use strict';
import Gtk from 'gi://Gtk';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import * as DeviceList from './lib/deviceList.js';
import {General} from './preferences/general.js';
import {Apple} from './preferences/apple.js';
import {Asus} from './preferences/asus.js';
import {Chromebook} from './preferences/chromebook.js';
import {Dell} from './preferences/dell.js';
import {Framework} from './preferences/framework.js';
import {Thinkpad} from './preferences/thinkpad.js';
import {ThresholdPrimary} from './preferences/thresholdPrimary.js';
import {ThresholdSecondary} from './preferences/thresholdSecondary.js';
import {About} from './preferences/about.js';

export default class BatteryHealthChargingPrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        let currentDevice = null;
        const settings = this.getSettings();
        const type = settings.get_int('device-type');
        if (type !== 0) {
            const device = new DeviceList.deviceArray[type - 1](settings);
            if (device.type === type)
                currentDevice = device;
        }

        const iconTheme = Gtk.IconTheme.get_for_display(window.get_display());
        const iconsDirectory = this.dir.get_child('icons').get_path();
        iconTheme.add_search_path(iconsDirectory);

        window.set_default_size(650, 700);
        window.add(new General(settings, currentDevice, this.dir));
        if (currentDevice) {
            if (currentDevice.deviceHaveVariableThreshold) // Laptop has customizable threshold
                window.add(new ThresholdPrimary(settings, currentDevice));

            if (currentDevice.deviceHaveDualBattery) // Laptop has dual battery
                window.add(new ThresholdSecondary(settings, currentDevice));

            if (currentDevice.type === 1 || currentDevice.type === 2 || currentDevice.type === 3 || currentDevice.type === 4) // device.type 1,2,3,4 are Asus
                window.add(new Asus(settings));
            else if (currentDevice.type === 16) // device.type 16 is AppleIntel
                window.add(new Apple(settings));
            else if (currentDevice.type === 22 && (settings.get_strv('multiple-configuration-supported').length > 1 ||
                settings.get_string('configuration-mode') === 'cctk')) // device.type 22 is Dell
                window.add(new Dell(settings));
            else if (currentDevice.type === 31 && settings.get_strv('multiple-configuration-supported').length > 1) // device.type 31 is Framework
                window.add(new Framework(settings));
            else if (currentDevice.type === 35 && settings.get_strv('multiple-configuration-supported').length > 1) // device.type 35 is Chromebook
                window.add(new Chromebook(settings));
            else if (currentDevice.type === 20 || currentDevice.type === 21 || currentDevice.type === 19) // device.type 20,21,19 are Thinkpad
                window.add(new Thinkpad(settings, currentDevice.type === 19));
        }
        window.add(new About(this));
    }
}
