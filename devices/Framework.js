'use strict';
/* Framework Laptops using dkms  https://github.com/DHowett/framework-laptop-kmod */
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import * as Helper from '../lib/helper.js';

const {dmiVendor, exitCode, fileExists, findValidProgramInPath, readFileInt, runCommandCtl} = Helper;

const BAT1_END_PATH = '/sys/class/power_supply/BAT1/charge_control_end_threshold';
const BAT1_START_PATH = '/sys/class/power_supply/BAT1/charge_control_start_threshold';
const FRAMEWORK_TOOL_PATH = '/usr/bin/framework_tool';
const CROS_EC_PATH = '/dev/cros_ec';

export const FrameworkSingleBatteryBAT1 = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_STRING]}},
}, class FrameworkSingleBatteryBAT1 extends GObject.Object {
    constructor(settings) {
        super();
        this.name = 'Framework';
        this.type = 31;
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
        this.endLimitValue = -1;
    }

    isAvailable() {
        if (!dmiVendor()?.includes('Framework'))
            return false;

        if (fileExists(BAT1_START_PATH)) // Prefer FrameworkSingleBatteryEndStartBAT1
            return false;

        this._supportedConfiguration = [];

        const hasSysfsNode = fileExists(BAT1_END_PATH);
        if (hasSysfsNode)
            this._supportedConfiguration.push('sysfs');

        this._frameworkToolPath = findValidProgramInPath('framework_tool');
        if (this._frameworkToolPath === null)
            this._frameworkToolPath = fileExists(FRAMEWORK_TOOL_PATH) ? FRAMEWORK_TOOL_PATH : null;
        if (this._frameworkToolPath)
            this._supportedConfiguration.push('framework-tool');

        if (this._supportedConfiguration.length <= 0)
            return false;

        this._settings.set_strv('multiple-configuration-supported', this._supportedConfiguration);
        if (this._supportedConfiguration.length === 1)
            this._settings.set_string('configuration-mode', this._supportedConfiguration[0]);
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let status;
        this._endValue = this._settings.get_int(`current-${chargingMode}-end-threshold`);

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
        else if (config === 'framework-tool')
            status = await this._setThresholdFrameworkTool();
        return status;
    }

    _emitThresholdError(status) {
        if (status === exitCode.ERROR)
            this.emit('threshold-applied', 'error');
        else if (status === exitCode.TIMEOUT)
            this.emit('threshold-applied', 'timeout');
    }

    async _setThresholdLimitSysFs() {
        if (this._verifySysFsThreshold())
            return exitCode.SUCCESS;

        const [status] = await runCommandCtl(this.ctlPath, 'BAT1_END', `${this._endValue}`);
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
        this.endLimitValue = readFileInt(BAT1_END_PATH);
        if (this._endValue === this.endLimitValue) {
            this.emit('threshold-applied', 'success');
            return true;
        }
        return false;
    }

    async _setThresholdFrameworkTool() {
        const frameworkToolDriver = fileExists(CROS_EC_PATH) ? 'cros-ec' : 'portio';
        let [status, output] = await runCommandCtl(this.ctlPath, 'FRAMEWORK_TOOL_THRESHOLD_READ', this._frameworkToolPath, frameworkToolDriver);
        if (status !== exitCode.SUCCESS) {
            this._emitThresholdError(status);
            return exitCode.ERROR;
        }

        if (this._verifyFrameworkToolThreshold(output))
            return exitCode.SUCCESS;

        [status, output] = await runCommandCtl(this.ctlPath, 'FRAMEWORK_TOOL_THRESHOLD_WRITE', this._frameworkToolPath, frameworkToolDriver, `${this._endValue}`);
        if (status !== exitCode.SUCCESS) {
            this._emitThresholdError(status);
            return exitCode.ERROR;
        }

        if (this._verifyFrameworkToolThreshold(output))
            return exitCode.SUCCESS;

        this.emit('threshold-applied', 'not-updated');
        return exitCode.ERROR;
    }

    _verifyFrameworkToolThreshold(output) {
        const matchOutput = output?.match(/Minimum 0%, Maximum (\d+)%/);
        if (matchOutput && this._endValue === parseInt(matchOutput[1])) {
            this.endLimitValue = this._endValue;
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

export const FrameworkSingleBatteryEndStartBAT1 = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_STRING]}},
}, class FrameworkSingleBatteryEndStartBAT1 extends GObject.Object {
    constructor(settings) {
        super();
        this.name = 'FrameworkEndStartLimit';
        this.type = 36;
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
        this.startFullCapacityRangeMax = 99;
        this.startFullCapacityRangeMin = 75;
        this.startBalancedRangeMax = 84;
        this.startBalancedRangeMin = 60;
        this.startMaxLifeSpanRangeMax = 84;
        this.startMaxLifeSpanRangeMin = 50;
        this.minDiffLimit = 1;
        this.incrementsStep = 1;
        this.incrementsPage = 5;

        this._settings = settings;
        this.ctlPath = null;
    }

    isAvailable() {
        if (!dmiVendor()?.includes('Framework'))
            return false;
        if (!fileExists(BAT1_START_PATH))
            return false;
        if (!fileExists(BAT1_END_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        this._endValue = this._settings.get_int(`current-${chargingMode}-end-threshold`);
        this._startValue = this._settings.get_int(`current-${chargingMode}-start-threshold`);

        if (this._verifyThreshold())
            return exitCode.SUCCESS;

        // Some device wont update end threshold if start threshold > end threshold
        const cmd = this._startValue >= this.endLimitValue ? 'BAT1_END_START' : 'BAT1_START_END';
        const [status] = await runCommandCtl(this.ctlPath, cmd, `${this._endValue}`, `${this._startValue}`);
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
        this.endLimitValue = readFileInt(BAT1_END_PATH);
        this.startLimitValue = readFileInt(BAT1_START_PATH);
        if (this.endLimitValue === this._endValue && this.startLimitValue === this._startValue) {
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

