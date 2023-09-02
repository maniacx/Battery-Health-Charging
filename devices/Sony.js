'use strict';
/* Sony Laptops */
const {GLib, GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const SONY_PATH = '/sys/devices/platform/sony-laptop/battery_care_limiter';

var SonySingleBattery = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_BOOLEAN]}},
}, class SonySingleBattery extends GObject.Object {
    name = 'Sony';
    type = 7;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = false;
    deviceHaveVariableThreshold = false;
    deviceHaveBalancedMode = true;
    deviceHaveAdaptiveMode = false;
    deviceHaveExpressMode = false;
    deviceUsesModeNotValue = false;
    iconForFullCapMode = '100';
    iconForBalanceMode = '080';
    iconForMaxLifeMode = '050';

    isAvailable() {
        if (!fileExists(SONY_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        this._status = 0;
        this._chargingMode = chargingMode;
        if (this._chargingMode === 'ful')
            this._batteryCareLimiter = 0;
        else if (this._chargingMode === 'bal')
            this._batteryCareLimiter = 80;
        else if (this._chargingMode === 'max')
            this._batteryCareLimiter = 50;
        if (this._verifyThreshold())
            return this._status;
        this._status = await runCommandCtl('SONY', `${this._batteryCareLimiter}`, null, false);
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
        const endLimitValue = readFileInt(SONY_PATH);
        if (this._batteryCareLimiter === endLimitValue) {
            this.endLimitValue = endLimitValue === 0 ? 100 : endLimitValue;
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


