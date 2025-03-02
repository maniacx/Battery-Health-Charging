'use strict';
/* Dell Laptops using package smbios-battery-ctl from https://github.com/dell/libsmbios */
/* Dell Laptops using package dell command configure from https://www.dell.com/support/kbdoc/en-us/000178000/dell-command-configure */
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Secret from 'gi://Secret';
import * as Helper from '../lib/helper.js';

const {exitCode, fileExists, findValidProgramInPath, readFile, readFileInt, runCommandCtl} = Helper;

const DELL_PATH = '/sys/devices/platform/dell-laptop';
const SMBIOS_PATH = '/usr/sbin/smbios-battery-ctl';
const CCTK_PATH = '/opt/dell/dcc/cctk';

const BAT0_CHARGETYPES_PATH = '/sys/class/power_supply/BAT0/charge_types';
const BAT0_END_PATH = '/sys/class/power_supply/BAT0/charge_control_end_threshold';
const BAT0_START_PATH = '/sys/class/power_supply/BAT0/charge_control_start_threshold';

const BAT1_CHARGETYPES_PATH = '/sys/class/power_supply/BAT1/charge_types';
const BAT1_END_PATH = '/sys/class/power_supply/BAT1/charge_control_end_threshold';
const BAT1_START_PATH = '/sys/class/power_supply/BAT1/charge_control_start_threshold';

export const DellSmBiosSingleBattery = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_STRING]}},
}, class DellSmBiosSingleBattery extends GObject.Object {
    constructor(settings) {
        super();
        this.name = 'Dell';
        this.type = 22;
        this.deviceNeedRootPermission = true;
        this.deviceHaveDualBattery = false;
        this.deviceHaveStartThreshold = true;
        this.deviceHaveVariableThreshold = true;
        this.deviceHaveBalancedMode = true;
        this.deviceHaveAdaptiveMode = true;
        this.deviceHaveExpressMode = true;
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
        this.minDiffLimit = 5;
        this.incrementsStep = 1;
        this.incrementsPage = 5;

        this._settings = settings;
        this.ctlPath = null;
        this.endLimitValue = -1;
        this.startLimitValue = -1;
    }

    isAvailable() {
        if (!fileExists(DELL_PATH))
            return false;

        this._supportedConfiguration = [];

        const usesBAT0 = fileExists(BAT0_CHARGETYPES_PATH);
        const usesBAT1 = fileExists(BAT1_CHARGETYPES_PATH);

        if (usesBAT0 || usesBAT1) {
            this._supportedConfiguration.push('sysfs');
            this._chargeTypesPath = usesBAT0 ? BAT0_CHARGETYPES_PATH : BAT1_CHARGETYPES_PATH;
            this._endPath = usesBAT0 ? BAT0_END_PATH : BAT1_END_PATH;
            this._startPath = usesBAT0 ? BAT0_START_PATH : BAT1_START_PATH;
            this._dellEndStartCmd = usesBAT0 ? 'DELL_BAT0_END_START' : 'DELL_BAT1_END_START';
            this._dellStartEndCmd = usesBAT0 ? 'DELL_BAT0_START_END' : 'DELL_BAT1_START_END';
        }

        this._smbiosPath = findValidProgramInPath('smbios-battery-ctl');
        if (this._smbiosPath === null)
            this._smbiosPath = fileExists(SMBIOS_PATH) ? SMBIOS_PATH : null;
        if (this._smbiosPath)
            this._supportedConfiguration.push('libsmbios');

        this._cctkPath = findValidProgramInPath('cctk');
        if (this._cctkPath === null)
            this._cctkPath = fileExists(CCTK_PATH) ? CCTK_PATH : null;
        if (this._cctkPath)
            this._supportedConfiguration.push('cctk');

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
        else if (config === 'libsmbios')
            status = await this._setThresholdLimitLibSmbios();
        else if (config === 'cctk')
            status = await this._setThresholdLimitCctk();
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
        const cmd = this._startValue >= this._oldEndValue ? this._dellEndStartCmd : this._dellStartEndCmd;
        const [status] = await runCommandCtl(this.ctlPath, cmd, this._chargingMode, `${this._endValue}`, `${this._startValue}`);
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
        const chargeTypes = readFile(this._chargeTypesPath);
        const mode = chargeTypes?.substring(chargeTypes?.indexOf('[') + 1, chargeTypes?.lastIndexOf(']'));
        if (mode === 'Adaptive' && this._chargingMode === 'adv' || mode === 'Fast' && this._chargingMode === 'exp') {
            this.mode = this._chargingMode;
            this.endLimitValue = 100;
            this.startLimitValue = 95;
            this.emit('threshold-applied', 'success');
            return true;
        } else if (mode === 'Custom' && (this._chargingMode === 'ful' || this._chargingMode === 'bal' || this._chargingMode === 'max')) {
            this._oldEndValue = readFileInt(this._endPath);
            this._oldStartValue = readFileInt(this._startPath);
            if (this._oldEndValue === this._endValue && this._oldStartValue === this._startValue) {
                this.mode = this._chargingMode;
                this.endLimitValue = this._endValue;
                this.startLimitValue = this._startValue;
                this.emit('threshold-applied', 'success');
                return true;
            }
        }
        return false;
    }

    // libsmbios
    async _setThresholdLimitLibSmbios() {
        let status;
        let verified = await this._verifySmbiosThreshold();
        if (verified)
            return exitCode.SUCCESS;

        if (this._chargingMode === 'adv' || this._chargingMode === 'exp')
            [status] = await runCommandCtl(this.ctlPath, 'DELL_SMBIOS_WRITE', this._smbiosPath, this._chargingMode);
        else
            [status] = await runCommandCtl(this.ctlPath, 'DELL_SMBIOS_WRITE', this._smbiosPath, `${this._startValue}`, `${this._endValue}`);

        if (status !== exitCode.SUCCESS) {
            this._emitThresholdError(status);
            return exitCode.ERROR;
        }

        verified = await this._verifySmbiosThreshold();
        if (verified)
            return exitCode.SUCCESS;

        this.emit('threshold-applied', 'not-updated');
        return exitCode.ERROR;
    }

    async _verifySmbiosThreshold() {
        const [status, output] = await runCommandCtl(this.ctlPath, 'DELL_SMBIOS_READ', this._smbiosPath);
        if (status !== exitCode.SUCCESS) {
            this._emitThresholdError(status);
            return false;
        }

        const modeMatch = output?.match(/Charging mode:\s*(\w+)/);
        if (modeMatch) {
            const mode = modeMatch[1];
            if (mode === 'adaptive' && this._chargingMode === 'adv' || mode === 'express' && this._chargingMode === 'exp') {
                this.mode = this._chargingMode;
                this.startLimitValue = 100;
                this.endLimitValue = 95;
                this.emit('threshold-applied', 'success');
                return true;
            } else if (mode === 'custom' &&
               (this._chargingMode === 'ful' || this._chargingMode === 'bal' || this._chargingMode === 'max')) {
                const thresholdMatch = output?.match(/Charging interval:\s*\((\d+),\s*(\d+)\)/);
                if (thresholdMatch && parseInt(thresholdMatch[1]) === this._startValue &&
                 parseInt(thresholdMatch[2]) === this._endValue) {
                    this.mode = this._chargingMode;
                    this.startLimitValue = this._startValue;
                    this.endLimitValue = this._endValue;
                    this.emit('threshold-applied', 'success');
                    return true;
                }
            }
        }

        return false;
    }

    // cctk
    async _setThresholdLimitCctk() {
        const verified = await this._verifyCctkThreshold();
        if (verified)
            return exitCode.SUCCESS;

        if (this._settings.get_boolean('need-bios-password'))
            this._writeCctkThresholdWithPassword();
        else
            await this._writeCctkThreshold(null);

        return exitCode.SUCCESS;
    }

    _writeCctkThresholdWithPassword() {
        if (!this._secretSchema) {
            this._secretSchema = new Secret.Schema('org.gnome.shell.extensions.Battery-Health-Charging',
                Secret.SchemaFlags.NONE, {'string': Secret.SchemaAttributeType.STRING});
        }

        Secret.password_lookup(this._secretSchema, {'string': 'Battery-Health-Charging-Gnome-Extension'}, null, (o, result) => {
            try {
                const pass = Secret.password_lookup_finish(result);
                this._writeCctkThreshold(pass);
            } catch {
                log('Battery Health Charging: Failed to lookup password from Gnome Keyring');
            }
        });
    }

    async _writeCctkThreshold(pass) {
        let status;
        const arg1 = this._chargingMode === 'adv' || this._chargingMode === 'exp' ? this._chargingMode : `${this._startValue}`;
        const arg2 = this._chargingMode === 'adv' || this._chargingMode === 'exp' ? null : `${this._endValue}`;

        if (pass)
            [status] = await runCommandCtl(this.ctlPath, 'DELL_CCTK_AUTH_WRITE', this._cctkPath, pass, arg1, arg2);
        else
            [status] = await runCommandCtl(this.ctlPath, 'DELL_CCTK_WRITE', this._cctkPath, arg1, arg2);

        if (status === 65 || status === 58) {
            this.emit('threshold-applied', 'password-required');
            return exitCode.SUCCESS;
        } else if (status !== exitCode.SUCCESS) {
            this._emitThresholdError(status);
            return exitCode.ERROR;
        }

        const verified = await this._verifyCctkThreshold();
        if (verified)
            return exitCode.SUCCESS;

        this.emit('threshold-applied', 'not-updated');
        return exitCode.ERROR;
    }

    async _verifyCctkThreshold() {
        const [status, output] = await runCommandCtl(this.ctlPath, 'DELL_CCTK_READ', this._cctkPath);
        if (status !== exitCode.SUCCESS) {
            this._emitThresholdError(status);
            return false;
        }

        const modeMatch = output?.match(/PrimaryBattChargeCfg=(\w+)(?::(\d+)-(\d+))?/);
        if (modeMatch) {
            const mode = modeMatch[1];
            if (mode === 'Adaptive' && this._chargingMode === 'adv' ||
                mode === 'Express' && this._chargingMode === 'exp') {
                this.mode = this._chargingMode;
                this.startLimitValue = 100;
                this.endLimitValue = 95;
                this.emit('threshold-applied', 'success');
                return true;
            } else if (mode === 'Custom' && (this._chargingMode === 'ful' || this._chargingMode === 'bal' || this._chargingMode === 'max')) {
                if (parseInt(modeMatch[2]) === this._startValue && parseInt(modeMatch[3]) === this._endValue) {
                    this.mode = this._chargingMode;
                    this.startLimitValue = this._startValue;
                    this.endLimitValue = this._endValue;
                    this.emit('threshold-applied', 'success');
                    return true;
                }
            }
        }
        return false;
    }

    destroy() {
        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        this._delayReadTimeoutId = null;
        this._secretSchema = null;
    }
});

