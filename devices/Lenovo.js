'use strict';
/* Lenovo Ideapad Laptops */
const {GLib, GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const LENOVO_PATH = '/sys/bus/platform/drivers/ideapad_acpi/VPC2004:00/conservation_mode';

var LenovoSingleBattery = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_BOOLEAN]}},
}, class LenovoSingleBattery extends GObject.Object {
    name = 'Lenovo non-thinkpad';
    type = 12;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = false;
    deviceHaveVariableThreshold = false;
    deviceHaveBalancedMode = false;
    deviceHaveAdaptiveMode = false;
    deviceHaveExpressMode = false;
    deviceUsesModeNotValue = true;

    isAvailable() {
        if (!fileExists(LENOVO_PATH))
            return false;
        ExtensionUtils.getSettings().set_int('icon-style-type', 0);
        return true;
    }

    async setThresholdLimit(chargingMode) {
        this._status = 0;
        this._chargingMode = chargingMode;
        if (this._chargingMode === 'ful')
            this._conservationMode = 0;
        else if (this._chargingMode === 'max')
            this._conservationMode = 1;
        if (this._verifyThreshold())
            return this._status;
        this._status = await runCommandCtl('LENOVO', `${this._conservationMode}`, null, false);
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
        if (readFileInt(LENOVO_PATH) === this._conservationMode) {
            this.mode = this._chargingMode;
            this.emit('threshold-applied', true);
            return true;
        }
        return false;
    }

    _reVerifyThreshold() {
        if (this._status === 0) {
            if (this._verifyThreshold())
                return;
        }
        this.emit('threshold-applied', false);
    }

    destroy() {
        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        delete this._delayReadTimeoutId;
    }
});

