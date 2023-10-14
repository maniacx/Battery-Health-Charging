'use strict';
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const DeviceList = Me.imports.lib.deviceList;

const {General} = Me.imports.preferences.general;
const {Apple} = Me.imports.preferences.apple;
const {Dell} = Me.imports.preferences.dell;
const {ThresholdPrimary} = Me.imports.preferences.thresholdPrimary;
const {ThresholdSecondary} = Me.imports.preferences.thresholdSecondary;
const {About} = Me.imports.preferences.about;

function fillPreferencesWindow(window) {
    let currentDevice = null;
    const settings = ExtensionUtils.getSettings();
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
    window.add(new About(window));
}

function init() {
    ExtensionUtils.initTranslations(Me.metadata.uuid);
}
