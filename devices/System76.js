'use strict';
/* System76 Laptops */
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import * as Helper from '../lib/helper.js';

const {fileExists, readFileInt, runCommandCtl} = Helper;

const VENDOR_SYSTEM76 = '/sys/module/system76_acpi';
const BAT0_END_PATH = '/sys/class/power_supply/BAT0/charge_control_end_threshold';
const BAT0_START_PATH = '/sys/class/power_supply/BAT0/charge_control_start_threshold';

export const System76SingleBattery = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_BOOLEAN]}},
}, class System76SingleBattery extends GObject.Object {
    constructor(settings) {
        super();
        this.name = 'System76';
        this.type = 11;
        this.deviceNeedRootPermission = true;
        this.deviceHaveDualBattery = false;
        this.deviceHaveStartThreshold = true;
        this.deviceHaveVariableThreshold = true;
        this.deviceHaveBalancedMode = true;
        this.deviceHaveAdaptiveMode = false;
        this.deviceHaveExpressMode = false;
        this.deviceUsesModeNotValue = false;
        this.iconForFullCapMode = '100';
        this.iconForBalanceMode = '080';
        this.iconForMaxLifeMode = '060';
        this.endFullCapacityRangeMax = 100;
        this.endFullCapacityRangeMin = 80;
        this.endBalancedRangeMax = 85;
        this.endBalancedRangeMin = 65;
        this.endMaxLifeSpanRangeMax = 85;
        this.endMaxLifeSpanRangeMin = 50;
        this.startFullCapacityRangeMax = 98;
        this.startFullCapacityRangeMin = 75;
        this.startBalancedRangeMax = 83;
        this.startBalancedRangeMin = 60;
        this.startMaxLifeSpanRangeMax = 83;
        this.startMaxLifeSpanRangeMin = 40;
        this.minDiffLimit = 2;
        this.incrementsStep = 1;
        this.incrementsPage = 5;

        this._settings = settings;
    }

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
        const ctlPath = this._settings.get_string('ctl-path');
        this._endValue = this._settings.get_int(`current-${chargingMode}-end-threshold`);
        this._startValue = this._settings.get_int(`current-${chargingMode}-start-threshold`);
        if (this._verifyThreshold())
            return this._status;
        // Some device wont update end threshold if start threshold > end threshold
        if (this._startValue >= this._oldEndValue)
            this._status = await runCommandCtl('BAT0_END_START', `${this._endValue}`, `${this._startValue}`, ctlPath, false);
        else
            this._status = await runCommandCtl('BAT0_START_END', `${this._endValue}`, `${this._startValue}`, ctlPath, false);

        if (this._status === 0) {
            if (this._verifyThreshold())
                return this._status;
        }

        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        this._delayReadTimeoutId = null;

        this._delayReadTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 200, () => {
            this._reVerifyThreshold();
            this._delayReadTimeoutId = null;
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
        this._delayReadTimeoutId = null;
    }
});

