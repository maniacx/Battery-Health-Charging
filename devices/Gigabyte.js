'use strict';
/* Gigabyte Laptop using dkms https://github.com/tangalbert919/gigabyte-laptop-wmi  */
const {GLib, GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const GIGABYTE_MODE = '/sys/devices/platform/gigabyte_laptop/charge_mode';
const GIGABYTE_LIMIT = '/sys/devices/platform/gigabyte_laptop/charge_limit';

var GigabyteSingleBattery = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_BOOLEAN]}},
}, class GigabyteSingleBattery extends GObject.Object {
    name = 'Gigabyte Laptop';
    type = 28;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = false;
    deviceHaveVariableThreshold = true;
    deviceHaveBalancedMode = true;
    deviceHaveAdaptiveMode = false;
    deviceHaveExpressMode = false;
    deviceUsesModeNotValue = false;
    iconForFullCapMode = '100';
    iconForBalanceMode = '080';
    iconForMaxLifeMode = '060';
    endFullCapacityRangeMax = 100;
    endFullCapacityRangeMin = 80;
    endBalancedRangeMax = 85;
    endBalancedRangeMin = 65;
    endMaxLifeSpanRangeMax = 85;
    endMaxLifeSpanRangeMin = 60;

    isAvailable() {
        if (!fileExists(GIGABYTE_MODE))
            return false;
        if (!fileExists(GIGABYTE_LIMIT))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        this._updateMode = 'true';
        this._status = 0;
        this._endValue = ExtensionUtils.getSettings().get_int(`current-${chargingMode}-end-threshold`);
        if (this._verifyThreshold())
            return this._status;
        this._status = await runCommandCtl('GIGABYTE_THRESHOLD', this._updateMode, `${this._endValue}`, false);
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
        if (readFileInt(GIGABYTE_MODE) === 1)
            this._updateMode = 'false';
        this.endLimitValue = readFileInt(GIGABYTE_LIMIT);
        if (this._endValue === this.endLimitValue) {
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
