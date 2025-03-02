'use strict';
/* Toshiba Laptops */
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import * as Helper from '../lib/helper.js';

const {exitCode, fileExists, readFileInt, runCommandCtl} = Helper;

const VENDOR_TOSHIBA = '/sys/module/toshiba_acpi';
const BAT0_END_PATH = '/sys/class/power_supply/BAT0/charge_control_end_threshold';
const BAT1_END_PATH = '/sys/class/power_supply/BAT1/charge_control_end_threshold';
const BAT0_CAPACITY_PATH = '/sys/class/power_supply/BAT0/capacity';
const BAT1_CAPACITY_PATH = '/sys/class/power_supply/BAT1/capacity';

export const ToshibaSingleBatteryBAT0 = GObject.registerClass({
    Signals: {
        'threshold-applied': {param_types: [GObject.TYPE_STRING]},
    },
}, class ToshibaSingleBatteryBAT0 extends GObject.Object {
    constructor(settings) {
        super();
        this.name = 'Toshiba BAT0';
        this.type = 9;
        this.deviceNeedRootPermission = true;
        this.deviceHaveDualBattery = false;
        this.deviceHaveStartThreshold = false;
        this.deviceHaveVariableThreshold = false;
        this.deviceHaveBalancedMode = false;
        this.deviceHaveAdaptiveMode = false;
        this.deviceHaveExpressMode = false;
        this.deviceUsesModeNotValue = false;
        this.iconForFullCapMode = '100';
        this.iconForMaxLifeMode = '080';

        this._settings = settings;
        this.ctlPath = null;
    }

    isAvailable() {
        if (!fileExists(VENDOR_TOSHIBA))
            return false;
        if (!fileExists(BAT0_END_PATH))
            return false;

        this.endLimitValue = readFileInt(this._endPath);
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let endValue;
        if (chargingMode === 'ful')
            endValue = 100;
        else if (chargingMode === 'max')
            endValue = 80;
        const [status] = await runCommandCtl(this.ctlPath, 'BAT0_END', `${endValue}`);
        if (status === exitCode.ERROR) {
            this.emit('threshold-applied', 'error');
            return exitCode.ERROR;
        } else if (status === exitCode.TIMEOUT) {
            this.emit('threshold-applied', 'timeout');
            return exitCode.ERROR;
        }

        this.endLimitValue = readFileInt(BAT0_END_PATH);
        if (endValue === this.endLimitValue) {
            this.emit('threshold-applied', 'success');
            return exitCode.SUCCESS;
        }

        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        this._delayReadTimeoutId = null;

        await new Promise(resolve => {
            this._delayReadTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 200, () => {
                resolve();
                this._delayReadTimeoutId = null;
                return GLib.SOURCE_REMOVE;
            });
        });

        this.endLimitValue = readFileInt(BAT0_END_PATH);
        if (endValue === this.endLimitValue) {
            this.emit('threshold-applied', 'success');
            return exitCode.SUCCESS;
        } else if (endValue === 80 && readFileInt(BAT0_CAPACITY_PATH) > 75) {
            this.endLimitValue = 100;
            this.emit('threshold-applied', 'discharge-battery');
            return exitCode.SUCCESS;
        }
        this.emit('threshold-applied', 'not-updated');
        return exitCode.ERROR;
    }

    destroy() {
        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        this._delayReadTimeoutId = null;
    }
});

export const ToshibaSingleBatteryBAT1 = GObject.registerClass({
    Signals: {
        'threshold-applied': {param_types: [GObject.TYPE_STRING]},
    },
}, class ToshibaSingleBatteryBAT1 extends GObject.Object {
    constructor(settings) {
        super();
        this.name = 'Toshiba BAT1';
        this.type = 10;
        this.deviceNeedRootPermission = true;
        this.deviceHaveDualBattery = false;
        this.deviceHaveStartThreshold = false;
        this.deviceHaveVariableThreshold = false;
        this.deviceHaveBalancedMode = false;
        this.deviceHaveAdaptiveMode = false;
        this.deviceHaveExpressMode = false;
        this.deviceUsesModeNotValue = false;
        this.iconForFullCapMode = '100';
        this.iconForMaxLifeMode = '080';

        this._settings = settings;
        this.ctlPath = null;
    }

    isAvailable() {
        if (!fileExists(VENDOR_TOSHIBA))
            return false;
        if (!fileExists(BAT1_END_PATH))
            return false;

        this.endLimitValue = readFileInt(BAT1_END_PATH);
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let endValue;
        if (chargingMode === 'ful')
            endValue = 100;
        else if (chargingMode === 'max')
            endValue = 80;
        const [status] = await runCommandCtl(this.ctlPath, 'BAT1_END', `${endValue}`);
        if (status === exitCode.ERROR) {
            this.emit('threshold-applied', 'error');
            return exitCode.ERROR;
        } else if (status === exitCode.TIMEOUT) {
            this.emit('threshold-applied', 'timeout');
            return exitCode.ERROR;
        }

        this.endLimitValue = readFileInt(BAT1_END_PATH);
        if (endValue === this.endLimitValue) {
            this.emit('threshold-applied', 'success');
            return exitCode.SUCCESS;
        }

        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        this._delayReadTimeoutId = null;

        await new Promise(resolve => {
            this._delayReadTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 200, () => {
                resolve();
                this._delayReadTimeoutId = null;
                return GLib.SOURCE_REMOVE;
            });
        });

        this.endLimitValue = readFileInt(BAT1_END_PATH);
        if (endValue === this.endLimitValue) {
            this.emit('threshold-applied', 'success');
            return exitCode.SUCCESS;
        } else if (endValue === 80 && readFileInt(BAT1_CAPACITY_PATH) > 75) {
            this.endLimitValue = 100;
            this.emit('threshold-applied', 'discharge-battery');
            return exitCode.SUCCESS;
        }
        this.emit('threshold-applied', 'not-updated');
        return exitCode.ERROR;
    }

    destroy() {
        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        this._delayReadTimeoutId = null;
    }
});


