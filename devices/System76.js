'use strict';
/* System76 Laptops */
const {GLib, GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const VENDOR_SYSTEM76 = '/sys/module/system76_acpi';
const BAT0_END_PATH = '/sys/class/power_supply/BAT0/charge_control_end_threshold';
const BAT0_START_PATH = '/sys/class/power_supply/BAT0/charge_control_start_threshold';

var System76SingleBattery = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_BOOLEAN]}},
}, class System76SingleBattery extends GObject.Object {
    name = 'System76';
    type = 11;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = true;
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
    endMaxLifeSpanRangeMin = 50;
    startFullCapacityRangeMax = 98;
    startFullCapacityRangeMin = 75;
    startBalancedRangeMax = 83;
    startBalancedRangeMin = 60;
    startMaxLifeSpanRangeMax = 83;
    startMaxLifeSpanRangeMin = 40;
    minDiffLimit = 2;

    isAvailable() {
        if (!fileExists(VENDOR_SYSTEM76))
            return false;
        if (!fileExists(BAT0_START_PATH))
            return false;
        if (!fileExists(BAT0_END_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        this._status = 0;
        this._endValue = ExtensionUtils.getSettings().get_int(`current-${chargingMode}-end-threshold`);
        this._startValue = ExtensionUtils.getSettings().get_int(`current-${chargingMode}-start-threshold`);
        if (this._verifyThreshold())
            return this._status;
        // Some device wont update end threshold if start threshold > end threshold
        if (this._startValue >= this._oldEndValue)
            this._status = await runCommandCtl('BAT0_END_START', `${this._endValue}`, `${this._startValue}`, false);
        else
            this._status = await runCommandCtl('BAT0_START_END', `${this._endValue}`, `${this._startValue}`, false);

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
        this._oldEndValue = readFileInt(BAT0_END_PATH);
        this._oldStartValue = readFileInt(BAT0_START_PATH);
        if ((this._oldEndValue === this._endValue) && (this._oldStartValue === this._startValue)) {
            this.endLimitValue = this._endValue;
            this.startLimitValue = this._startValue;
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

