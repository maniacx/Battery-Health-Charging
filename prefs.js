'use strict';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import * as DeviceList from './lib/deviceList.js';
import {General} from './preferences/general.js';
import {Apple} from './preferences/apple.js';
import {Dell} from './preferences/dell.js';
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

        window.set_default_size(650, 700);
        window.add(new General(settings, currentDevice));
        if (currentDevice !== null) {
            if (currentDevice.type === 16) // device.type 16 is AppleIntel
                window.add(new Apple(settings));
            if ((currentDevice.type === 22) && settings.get_boolean('detected-cctk')) // device.type 22 is Dell
                window.add(new Dell(settings));
            if (currentDevice.deviceHaveVariableThreshold) // Laptop has customizable threshold
                window.add(new ThresholdPrimary(settings, currentDevice));
            if (currentDevice.deviceHaveDualBattery) // Laptop has dual battery
                window.add(new ThresholdSecondary(settings, currentDevice));
        }
        window.add(new About(window, this));
    }
}
