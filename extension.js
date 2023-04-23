'use strict';
const Main = imports.ui.main;
const Config = imports.misc.config;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const [major] = Config.PACKAGE_VERSION.split('.');
const shellVersion = Number.parseInt(major);

const Panel = shellVersion > 43 ? Me.imports.lib.thresholdPanel : Me.imports.lib.thresholdPanel42;
const PowerIcon = shellVersion > 43 ? Me.imports.lib.powerIcon : Me.imports.lib.powerIcon42;

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
