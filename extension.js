'use strict';
const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Panel = Me.imports.lib.thresholdPanel;
const PowerIcon = Me.imports.lib.powerIcon;

var thresholdPanel = null;
var powerIcon = null;

function init() {
    ExtensionUtils.initTranslations(Me.metadata.uuid);
}

function enable() {
    thresholdPanel = new Panel.ThresholdPanel();
    if (powerIcon === null)
        powerIcon = new PowerIcon.BatteryStatusIndicator();
}

function disable() {
    thresholdPanel.destroy();
    thresholdPanel = null;

    // Battery indicator icon in System-tray is also used in lockscreen
    // Do not disable powerIcon in lockscreen
    if (!Main.sessionMode.isLocked) {
        powerIcon.disable();
        powerIcon = null;
    }
}
