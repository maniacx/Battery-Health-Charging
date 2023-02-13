'use strict';

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const {General} = Me.imports.preferences.general;
const {ThresholdPrimary} = Me.imports.preferences.thresholdPrimary;
const {ThresholdSecondary} = Me.imports.preferences.thresholdSecondary;
const Driver = Me.imports.lib.driver;

function fillPreferencesWindow(window) {
    const settings = ExtensionUtils.getSettings();
    let type = settings.get_int('device-type');

    window.add(new General(settings));

    if (Driver.deviceInfo[type][2] === '1')
        window.add(new ThresholdPrimary(settings));

    if (Driver.deviceInfo[type][1] === '1')
        window.add(new ThresholdSecondary(settings));
}

function init() {
    ExtensionUtils.initTranslations(Me.metadata.uuid);
}
