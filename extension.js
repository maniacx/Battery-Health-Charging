'use strict';

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Panel = Me.imports.lib.thresholdPanel;

var thresholdPanel = null;

function init() {
    ExtensionUtils.initTranslations(Me.metadata.uuid);
}

function enable() {
    thresholdPanel = new Panel.ThresholdPanel();
}

function disable() {
    thresholdPanel.destroy();
    thresholdPanel = null;
}
