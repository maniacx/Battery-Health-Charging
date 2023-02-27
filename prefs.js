'use strict';
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const {General} = Me.imports.preferences.general;
const {ThresholdPrimary} = Me.imports.preferences.thresholdPrimary;
const {ThresholdSecondary} = Me.imports.preferences.thresholdSecondary;
const {addMenu} = Me.imports.preferences.menu;
const Driver = Me.imports.lib.driver;

function fillPreferencesWindow(window) {
    const settings = ExtensionUtils.getSettings();

    if (settings.get_int('device-type') === 0)
        Driver.checkDeviceType();

    const type = settings.get_int('device-type');

    window.set_default_size(650, 675);

    addMenu(window);

    window.add(new General(settings));

    if (Driver.deviceInfo[type][2] === '1') // Laptop has customizable threshold
        window.add(new ThresholdPrimary(settings));

    if (Driver.deviceInfo[type][1] === '1') // Laptop has dual battery
        window.add(new ThresholdSecondary(settings));
}

function init() {
    ExtensionUtils.initTranslations(Me.metadata.uuid);
}
