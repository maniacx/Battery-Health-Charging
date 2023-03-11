'use strict';
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Config = imports.misc.config;
const Driver = Me.imports.lib.driver;

const {General} = Me.imports.preferences.general;
const {ThresholdPrimary} = Me.imports.preferences.thresholdPrimary;
const {ThresholdSecondary} = Me.imports.preferences.thresholdSecondary;
const {addMenu} = Me.imports.preferences.menu;

const [major] = Config.PACKAGE_VERSION.split('.');

function fillPreferencesWindow(window) {
    const settings = ExtensionUtils.getSettings();

    if (Driver.currentDevice === null)
        Driver.checkCompatibility();

    const windowHeight = Number.parseInt(major) === 43 ? 700 : 775;
    window.set_default_size(650, windowHeight);

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
