'use strict';
/* Panasonic Laptops. */
const {GLib, GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const PANASONIC_PATH = '/sys/devices/platform/panasonic/eco_mode';

var PanasonicSingleBattery = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_BOOLEAN]}},
}, class PanasonicSingleBattery extends GObject.Object {
    name = 'Panasonic';
    type = 23;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = false;
    deviceHaveVariableThreshold = false;
    deviceHaveBalancedMode = false;
    deviceHaveAdaptiveMode = false;
    deviceHaveExpressMode = false;
    deviceUsesModeNotValue = true;

    isAvailable() {
        if (!fileExists(PANASONIC_PATH))
            return false;
        ExtensionUtils.getSettings().set_int('icon-style-type', 0);
        return true;
    }

    async setThresholdLimit(chargingMode) {
        this._status = 0;
        this._chargingMode = chargingMode;
        if (this._chargingMode === 'ful')
            this._ecoMode = 0;
        else if (this._chargingMode === 'max')
            this._ecoMode = 1;
        if (this._verifyThreshold())
            return this._status;
        this._status = await runCommandCtl('PANASONIC', `${this._ecoMode}`, null, false);
        if (this._status === 0) {
            if (this._verifyThreshold())
                return this._status;
        }

        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        delete this._delayReadTimeoutId;
        this._delayReadTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 200, () => {
            this._reVerifyThreshold();
            delete this._delayReadTimeoutId;
            return GLib.SOURCE_REMOVE;
        });
        return this._status;
    }

    _verifyThreshold() {
        if (readFileInt(PANASONIC_PATH) === this._ecoMode) {
            this.mode = this._chargingMode;
            this.emit('threshold-applied', true);
            return true;
        }
        return false;
    }

    _reVerifyThreshold() {
        if (this._status === 0)
            this._verifyThreshold();
        this.emit('threshold-applied', false);
    }

    destroy() {
        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        delete this._delayReadTimeoutId;
    }
});

