'use strict';
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Driver = Me.imports.lib.driver;

const {General} = Me.imports.preferences.general;
const {ThresholdPrimary} = Me.imports.preferences.thresholdPrimary;
const {ThresholdSecondary} = Me.imports.preferences.thresholdSecondary;
const {addMenu} = Me.imports.preferences.menu;

function fillPreferencesWindow(window) {
    const settings = ExtensionUtils.getSettings();

    if (Driver.currentDevice === null)
        Driver.checkCompatibility();

    window.set_default_size(650, 700);

    addMenu(window);

    window.add(new General(settings));

    if (Driver.currentDevice !== null) {
        if (Driver.currentDevice.deviceHaveVariableThreshold) // Laptop has customizable threshold
            window.add(new ThresholdPrimary(settings));

        if (Driver.currentDevice.deviceHaveDualBattery) // Laptop has dual battery
            window.add(new ThresholdSecondary(settings));
    }
}

function init() {
    ExtensionUtils.initTranslations(Me.metadata.uuid);
}
