'use strict';
const {Gtk} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const DeviceList = Me.imports.lib.deviceList;

const {General} = Me.imports.preferences.general;
const {Apple} = Me.imports.preferences.apple;
const {Dell} = Me.imports.preferences.dell;
const {Thinkpad} = Me.imports.preferences.thinkpad;
const {ThresholdPrimary} = Me.imports.preferences.thresholdPrimary;
const {ThresholdSecondary} = Me.imports.preferences.thresholdSecondary;
const {About} = Me.imports.preferences.about;

function fillPreferencesWindow(window) {
    let currentDevice = null;
    const settings = ExtensionUtils.getSettings();
    const dir = Me.dir;
    const type = settings.get_int('device-type');
    if (type !== 0) {
        const device = new DeviceList.deviceArray[type - 1](settings);
        if (device.type === type)
            currentDevice = device;
    }

    const iconTheme = Gtk.IconTheme.get_for_display(window.get_display());
    const iconsDirectory = Me.dir.get_child('icons').get_path();
    iconTheme.add_search_path(iconsDirectory);

    window.set_default_size(650, 700);
    window.add(new General(settings, currentDevice, dir));
    if (currentDevice) {
        if (currentDevice.deviceHaveVariableThreshold) // Laptop has customizable threshold
            window.add(new ThresholdPrimary(settings, currentDevice));
        if (currentDevice.deviceHaveDualBattery) // Laptop has dual battery
            window.add(new ThresholdSecondary(settings, currentDevice));
        if (currentDevice.type === 16) // device.type 16 is AppleIntel
            window.add(new Apple(settings));
        if ((currentDevice.type === 22) && settings.get_boolean('detected-cctk')) // device.type 22 is Dell
            window.add(new Dell(settings));
        if (currentDevice.type === 20 || currentDevice.type === 21) // device.type 20|21 is Thinkpad
            window.add(new Thinkpad(settings));
    }
    window.add(new About(Me));
}

function init() {
    ExtensionUtils.initTranslations(Me.metadata.uuid);
}
