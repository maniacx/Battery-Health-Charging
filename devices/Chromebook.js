'use strict';
/* Framework Laptops using dkms  https://github.com/DHowett/framework-laptop-kmod */
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import * as Helper from '../lib/helper.js';

const {dmiVendor, exitCode, fileExists, findValidProgramInPath, readFileInt, runCommandCtl} = Helper;

const BAT0_END_PATH = '/sys/class/power_supply/BAT0/charge_control_end_threshold';
const BAT0_START_PATH = '/sys/class/power_supply/BAT0/charge_control_start_threshold';
const BAT1_END_PATH = '/sys/class/power_supply/BAT1/charge_control_end_threshold';
const BAT1_START_PATH = '/sys/class/power_supply/BAT1/charge_control_start_threshold';

export const ChromebookSingleBattery = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_STRING]}},
}, class ChromebookSingleBattery extends GObject.Object {
    constructor(settings) {
        super();
        this.name = 'Chromebook';
        this.type = 35;
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
        this.endMaxLifeSpanRangeMin = 55;
        this.startFullCapacityRangeMax = 95;
        this.startFullCapacityRangeMin = 75;
        this.startBalancedRangeMax = 80;
        this.startBalancedRangeMin = 60;
        this.startMaxLifeSpanRangeMax = 80;
        this.startMaxLifeSpanRangeMin = 50;
        this.minDiffLimit = 2;
        this.incrementsStep = 1;
        this.incrementsPage = 5;

        this._settings = settings;
        this.ctlPath = null;
        this.endLimitValue = -1;
        this.startLimitValue = -1;
    }

    isAvailable() {
        if (!dmiVendor()?.includes('Google'))
            return false;

        this._supportedConfiguration = [];

        const usesBAT0 = fileExists(BAT0_END_PATH) && fileExists(BAT0_START_PATH);
        const usesBAT1 = fileExists(BAT1_END_PATH) && fileExists(BAT1_START_PATH);

        if (usesBAT0 || usesBAT1) {
            this._supportedConfiguration.push('sysfs');
            this._endPath = usesBAT0 ? BAT0_END_PATH : BAT1_END_PATH;
            this._startPath = usesBAT0 ? BAT0_START_PATH : BAT1_START_PATH;
            this._chromebookEndStartCmd = usesBAT0 ? 'BAT0_END_START' : 'BAT1_END_START';
            this._chromebookStartEndCmd = usesBAT0 ? 'BAT0_START_END' : 'BAT1_START_END';
        }

        this._ecToolPath = findValidProgramInPath('ectool');
        if (this._ecToolPath)
            this._supportedConfiguration.push('ectool');

        if (this._supportedConfiguration.length <= 0)
            return false;

        this._settings.set_strv('multiple-configuration-supported', this._supportedConfiguration);
        if (this._supportedConfiguration.length === 1)
            this._settings.set_string('configuration-mode', this._supportedConfiguration[0]);
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let status;
        this._chargingMode = chargingMode;
        if (this._chargingMode !== 'adv' && this._chargingMode !== 'exp') {
            this._endValue = this._settings.get_int(`current-${chargingMode}-end-threshold`);
            this._startValue = this._settings.get_int(`current-${chargingMode}-start-threshold`);
            if (this._endValue - this._startValue < 5)
                this._startValue = this._endValue - 5;
        }

        if (this._supportedConfiguration.length === 1) {
            const config = this._supportedConfiguration[0];
            status = await this._executeThresholdFunction(config);
        } else if (this._supportedConfiguration.length > 1) {
            const mode = this._settings.get_string('configuration-mode');
            if (this._supportedConfiguration.includes(mode)) {
                status = await this._executeThresholdFunction(mode);
            } else {
                const fallbackConfig = this._supportedConfiguration[0];
                this._settings.set_string('configuration-mode', fallbackConfig);
                status = await this._executeThresholdFunction(fallbackConfig);
            }
        }
        return status;
    }

    async _executeThresholdFunction(config) {
        let status;
        if (config === 'sysfs')
            status = await this._setThresholdLimitSysFs();
        else if (config === 'ectool')
            status = await this._setThresholdEctool();
        return status;
    }

    _emitThresholdError(status) {
        if (status === exitCode.ERROR)
            this.emit('threshold-applied', 'error');
        else if (status === exitCode.TIMEOUT)
            this.emit('threshold-applied', 'timeout');
    }

    // sysfs
    async _setThresholdLimitSysFs() {
        if (this._verifySysFsThreshold())
            return exitCode.SUCCESS;

        // Some device wont update end threshold if start threshold > end threshold
        const cmd = this._startValue >= this.endLimitValue ? this._chromebookEndStartCmd : this._chromebookStartEndCmd;
        const [status] = await runCommandCtl(this.ctlPath, cmd, `${this._endValue}`, `${this._startValue}`);
        if (status !== exitCode.SUCCESS) {
            this._emitThresholdError(status);
            return exitCode.ERROR;
        }

        if (this._verifySysFsThreshold())
            return exitCode.SUCCESS;

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

        if (this._verifySysFsThreshold())
            return exitCode.SUCCESS;

        this.emit('threshold-applied', 'not-updated');
        return exitCode.ERROR;
    }

    _verifySysFsThreshold() {
        this.endLimitValue = readFileInt(this._endPath);
        this.startLimitValue = readFileInt(this._startPath);
        if (this.endLimitValue === this._endValue && this.startLimitValue === this._startValue) {
            this.emit('threshold-applied', 'success');
            return true;
        }
        return false;
    }

    async _setThresholdEctool() {
        let verified = await this._verifyEctoolThreshold();
        if (verified)
            return exitCode.SUCCESS;

        const [status] = await runCommandCtl(this.ctlPath, 'ECTOOL_THRESHOLD_WRITE', this._ecToolPath, `${this._startValue}`, `${this._endValue}`);
        if (status !== exitCode.SUCCESS) {
            this._emitThresholdError(status);
            return exitCode.ERROR;
        }

        verified = await this._verifyEctoolThreshold();
        if (verified)
            return exitCode.SUCCESS;

        this.emit('threshold-applied', 'not-updated');
        return exitCode.ERROR;
    }

    async _verifyEctoolThreshold() {
        const [status, output] = await runCommandCtl(this.ctlPath, 'ECTOOL_THRESHOLD_READ', this._ecToolPath);
        if (status !== exitCode.SUCCESS) {
            this._emitThresholdError(status);
            return false;
        }

        const matchOutput = output?.match(/Battery sustainer = on \((\d+)% ~ (\d+)%\)/);
        if (matchOutput && this._endValue === parseInt(matchOutput[2]) && this._startValue === parseInt(matchOutput[1])) {
            this.endLimitValue = this._endValue;
            this.startLimitValue = this._startValue;
            this.emit('threshold-applied', 'success');
            return true;
        }
        return false;
    }

    destroy() {
        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        this._delayReadTimeoutId = null;
    }
});

export const ChromebookSingleBatteryV2 = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_STRING]}},
}, class ChromebookSingleBatteryV2 extends GObject.Object {
    constructor(settings) {
        super();
        this.name = 'ChromebookV2';
        this.type = 37;
        this.deviceNeedRootPermission = true;
        this.deviceHaveDualBattery = false;
        this.deviceHaveStartThreshold = false;
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
        this.incrementsStep = 1;
        this.incrementsPage = 5;

        this._settings = settings;
        this.ctlPath = null;
    }

    isAvailable() {
        if (!dmiVendor()?.includes('Google'))
            return false;

        const usesBAT0 = fileExists(BAT0_END_PATH);
        const usesBAT1 = fileExists(BAT1_END_PATH);

        if (usesBAT0 || usesBAT1) {
            this._endPath = usesBAT0 ? BAT0_END_PATH : BAT1_END_PATH;
            this._chromebookEndCmd = usesBAT0 ? 'BAT0_END' : 'BAT1_END';
            return true;
        } else {
            return false;
        }
    }

    async setThresholdLimit(chargingMode) {
        this._endValue = this._settings.get_int(`current-${chargingMode}-end-threshold`);

        if (this._verifyThreshold())
            return exitCode.SUCCESS;

        const [status] = await runCommandCtl(this.ctlPath, this._chromebookEndCmd, `${this._endValue}`);
        if (status === exitCode.ERROR) {
            this.emit('threshold-applied', 'error');
            return exitCode.ERROR;
        } else if (status === exitCode.TIMEOUT) {
            this.emit('threshold-applied', 'timeout');
            return exitCode.ERROR;
        }

        if (this._verifyThreshold())
            return exitCode.SUCCESS;

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

        if (this._verifyThreshold())
            return exitCode.SUCCESS;

        this.emit('threshold-applied', 'not-updated');
        return exitCode.ERROR;
    }

    _verifyThreshold() {
        this.endLimitValue = readFileInt(this._endPath);
        if (this._endValue === this.endLimitValue) {
            this.emit('threshold-applied', 'success');
            return true;
        }
        return false;
    }


    destroy() {
        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        this._delayReadTimeoutId = null;
    }
});


