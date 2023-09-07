'use strict';
/* LG Laptops */
const {GLib, GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const LG_PATH = '/sys/devices/platform/lg-laptop/battery_care_limit';

var LgSingleBattery = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_BOOLEAN]}},
}, class LgSingleBattery extends GObject.Object {
    name = 'LG';
    type = 5;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = false;
    deviceHaveVariableThreshold = false;
    deviceHaveBalancedMode = false;
    deviceHaveAdaptiveMode = false;
    deviceHaveExpressMode = false;
    deviceUsesModeNotValue = false;
    iconForFullCapMode = '100';
    iconForMaxLifeMode = '080';

    isAvailable() {
        if (!fileExists(LG_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        this._status = 0;
        if (chargingMode === 'ful')
            this._batteryCareLimit = 100;
        else if (chargingMode === 'max')
            this._batteryCareLimit = 80;
        if (this._verifyThreshold())
            return this._status;
        this._status = await runCommandCtl('LG', `${this._batteryCareLimit}`, null, false);
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
        this.endLimitValue = readFileInt(LG_PATH);
        if (this._batteryCareLimit === this.endLimitValue) {
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


