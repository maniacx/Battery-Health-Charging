'use strict';

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const {General} = Me.imports.preferences.general;
const {Threshold} = Me.imports.preferences.threshold;

function fillPreferencesWindow(window) {
    const settings = ExtensionUtils.getSettings();
    window.add(new General(settings));
    window.add(new Threshold(settings));
}

function init() {
    ExtensionUtils.initTranslations(Me.metadata.uuid);
}
