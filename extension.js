'use strict';
const Main = imports.ui.main;
const Config = imports.misc.config;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const [major] = Config.PACKAGE_VERSION.split('.');
const shellVersion = Number.parseInt(major);

const Driver = Me.imports.lib.driver;
const PowerIcon = shellVersion > 42 ? Me.imports.lib.powerIcon : Me.imports.lib.powerIcon42;

function init() {
    ExtensionUtils.initTranslations(Me.metadata.uuid);
    return new BatteryHealthCharging();
}

// 1.  _initializeDriver which start thresholdpanel runs only in [user] session-mode. _initializeDriver is destroyed in [unlock-dialog] session-mode
// _initializeDriver initializes and checks hardware compatibility and displays an indicator of current charging mode in system-tray and also provides a
// quicksettings menu in the quicksettings panel.
// all this are required in [user] sessionmode, but not required in [unlock-dialog] mode _initializeDriver hence needs to be destroyed.

// 2. powerIcon runs in [user] and [unlock-dialog] session mode
// When charging-threshold applied, the Gnome's System Battery indicator icon sometimes displays unplugged, even though charger is plugged.
// powerIcon introduces a feature to changes this icon from unplugged to plugged when charger is plugged.
// Since this icon is a Gnome's System Battery indicator which is displayed in lockscreen, powerIcon need to be enabled in [unlock-dialog] session mode.
// powerIcon runs in [user] and [unlock-dialog] session mode to apply correct icon to Gnome System Battery indicator icon in System-tray.

let initializeDriver = null;

class BatteryHealthCharging {
    enable() {
        this._settings = ExtensionUtils.getSettings();

        // create when enabled() is called in [user] and [unlock-dialog] session mode
        this._powerIcon = new PowerIcon.BatteryStatusIndicator(this._settings);

        // Do not create threshold panel if enable is triggered in lockscreen state (due rebased while disabling other extensions)
        if (!Main.sessionMode.isLocked && initializeDriver === null)
            initializeDriver = new Driver.IntializeDriver(this._settings, Me);

        // Destroy _initializeDriver on [unlock-dialog] / create _initializeDriver in [user]
        this._sessionId = Main.sessionMode.connect('updated', session => {
        // enable _initializeDriver when entering from [unlock-dialog] to [user] session-mode.
            if (session.currentMode === 'user' || session.parentMode === 'user') {
                if (initializeDriver === null)
                    initializeDriver = new Driver.IntializeDriver(this._settings, Me);

                // destroy _initializeDriver when entering [unlock-dialog] session mode.
            } else if (session.currentMode === 'unlock-dialog') {
                initializeDriver.destroy();
                initializeDriver = null;
            }
        });
    }

    disable() {
    // Destroy everything if disable() is called regardless of session-mode
        if (this._sessionId) {
            Main.sessionMode.disconnect(this._sessionId);
            this._sessionId = null;
        }
        if (initializeDriver) {
            initializeDriver.destroy();
            initializeDriver = null;
        }
        this._powerIcon.destroy();
        this._powerIcon = null;
        this._settings = null;
    }
}

