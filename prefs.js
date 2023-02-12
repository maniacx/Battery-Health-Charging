'use strict';

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const {General} = Me.imports.preferences.general;
const {ThresholdPrimary} = Me.imports.preferences.thresholdPrimary;
const {ThresholdSecondary} = Me.imports.preferences.thresholdSecondary;

function fillPreferencesWindow(window) {
    const settings = ExtensionUtils.getSettings();
    window.add(new General(settings));
        window.add(new ThresholdPrimary(settings));
        window.add(new ThresholdSecondary(settings));
}

function init() {
    ExtensionUtils.initTranslations(Me.metadata.uuid);
}
