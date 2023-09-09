'use strict';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import * as DeviceList from './lib/deviceList.js';
import {General} from './preferences/general.js';
import {ThresholdPrimary} from './preferences/thresholdPrimary.js';
import {ThresholdSecondary} from './preferences/thresholdSecondary.js';
import {addMenu} from './preferences/menu.js';

export default class BatteryHealthCharging extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        let currentDevice = null;
        const settings = this.getSettings();
        const type = settings.get_int('device-type');
        if (type !== 0) {
            const device = new DeviceList.deviceArray[type - 1](settings);
            if (device.type === type) {
                if (device.isAvailable())
                    currentDevice = device;
            }
        }

        window.set_default_size(650, 700);
        addMenu(window, this.path);
        window.add(new General(settings, currentDevice));
        if (currentDevice !== null) {
            if (currentDevice.deviceHaveVariableThreshold) // Laptop has customizable threshold
                window.add(new ThresholdPrimary(settings, currentDevice));
            if (currentDevice.deviceHaveDualBattery) // Laptop has dual battery
                window.add(new ThresholdSecondary(settings, currentDevice));
        }
    }
}
