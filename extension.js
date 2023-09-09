'use strict';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import * as Driver from './lib/driver.js';
import * as PowerIcon from './lib/powerIcon.js';

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

export default class BatteryHealthCharging extends Extension {
    enable() {
        this._settings = this.getSettings();

        // create when enabled() is called in [user] and [unlock-dialog] session mode
        this._powerIcon = new PowerIcon.BatteryStatusIndicator(this._settings);

        // Do not create threshold panel if enable is triggered in lockscreen state (due rebased while disabling other extensions)
        if (!Main.sessionMode.isLocked && initializeDriver === null)
            initializeDriver = new Driver.IntializeDriver(this._settings, this);

        // Destroy _initializeDriver on [unlock-dialog] / create _initializeDriver in [user]
        this._sessionId = Main.sessionMode.connect('updated', session => {
        // enable _initializeDriver when entering from [unlock-dialog] to [user] session-mode.
            if (session.currentMode === 'user' || session.parentMode === 'user') {
                if (initializeDriver === null)
                    initializeDriver = new Driver.IntializeDriver(this._settings, this);

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

