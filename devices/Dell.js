'use strict';
/* Dell Laptops using package smbios-battery-ctl from libsmbios  https://github.com/dell/libsmbios */
/* Dell Laptops using package dell command configure from libsmbios  https://www.dell.com/support/kbdoc/en-us/000178000/dell-command-configure */
const {GObject, Secret} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, runCommandCtl} = Helper;

const DELL_PATH = '/sys/devices/platform/dell-laptop';
const SMBIOS_PATH = '/usr/sbin/smbios-battery-ctl';
const CCTK_PATH = '/opt/dell/dcc/cctk';

var DellSmBiosSingleBattery = GObject.registerClass({
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
    }

    isAvailable() {
        if (!fileExists(DELL_PATH))
            return false;
        this._usesLibSmbios = fileExists(SMBIOS_PATH);
        this._usesCctk = fileExists(CCTK_PATH);
        this._settings.set_boolean('detected-libsmbios', this._usesLibSmbios);
        this._settings.set_boolean('detected-cctk', this._usesCctk);
        if (!this._usesCctk && !this._usesLibSmbios)
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let status = 0;
        if (this._usesCctk && this._usesLibSmbios) {
            const dellPackage = this._settings.get_int('dell-package-type');
            if (dellPackage === 0)
                status = await this.setThresholdLimitLibSmbios(chargingMode);
            else if (dellPackage === 1)
                status = await this.setThresholdLimitCctk(chargingMode);
        } else if (this._usesLibSmbios) {
            status = await this.setThresholdLimitLibSmbios(chargingMode);
        } else if (this._usesCctk) {
            status = await this.setThresholdLimitCctk(chargingMode);
        }
        return status;
    }

    async setThresholdLimitLibSmbios(chargingMode) {
        this._chargingMode = chargingMode;
        this._ctlPath = this._settings.get_string('ctl-path');

        if (this._chargingMode !== 'adv' && this._chargingMode !== 'exp') {
            this._endValue = this._settings.get_int(`current-${this._chargingMode}-end-threshold`);
            this._startValue = this._settings.get_int(`current-${this._chargingMode}-start-threshold`);
            if ((this._endValue - this._startValue) < 5)
                this._startValue = this._endValue - 5;
        }
        let verified = await this._verifySmbiosThreshold();
        if (verified)
            return 0;

        let arg1, arg2;
        if (this._chargingMode === 'adv' || this._chargingMode === 'exp') {
            arg1 = this._chargingMode;
            arg2 = null;
        } else {
            arg1 = `${this._endValue}`;
            arg2 = `${this._startValue}`;
        }
        await runCommandCtl(this._ctlPath, 'DELL_SMBIOS_BAT_WRITE', arg1, arg2, null);
        verified = await this._verifySmbiosThreshold();
        if (verified)
            return 0;
        this.emit('threshold-applied', 'failed');
        return 1;
    }

    async _verifySmbiosThreshold() {
        const [, output] = await runCommandCtl(this._ctlPath, 'DELL_SMBIOS_BAT_READ', null, null, null);
        const filteredOutput = output.trim().replace('(', '').replace(')', '').replace(',', '').replace(/:/g, '');
        const splitOutput = filteredOutput.split('\n');
        const firstLine = splitOutput[0].split(' ');
        if (firstLine[0] === 'Charging' && firstLine[1] === 'mode') {
            const modeRead = firstLine[2];
            if (((modeRead === 'adaptive') && (this._chargingMode === 'adv')) || ((modeRead === 'express') && (this._chargingMode === 'exp'))) {
                this.mode = this._chargingMode;
                this.startLimitValue = 100;
                this.endLimitValue = 95;
                this.emit('threshold-applied', 'success');
                return true;
            } else if ((modeRead === 'custom') && ((this._chargingMode === 'ful') || (this._chargingMode === 'bal') || (this._chargingMode === 'max'))) {
                const secondLine = splitOutput[1].split(' ');
                if (secondLine[0] === 'Charging' && secondLine[1] === 'interval') {
                    if ((parseInt(secondLine[2]) === this._startValue) && (parseInt(secondLine[3]) === this._endValue)) {
                        this.mode = this._chargingMode;
                        this.startLimitValue = this._startValue;
                        this.endLimitValue = this._endValue;
                        this.emit('threshold-applied', 'success');
                        return true;
                    }
                }
            }
        }
        return false;
    }

    async setThresholdLimitCctk(chargingMode) {
        this._chargingMode = chargingMode;
        this._ctlPath = this._settings.get_string('ctl-path');

        if (this._chargingMode !== 'adv' && this._chargingMode !== 'exp') {
            this._endValue = this._settings.get_int(`current-${this._chargingMode}-end-threshold`);
            this._startValue = this._settings.get_int(`current-${this._chargingMode}-start-threshold`);
            if ((this._endValue - this._startValue) < 5)
                this._startValue = this._endValue - 5;
        }

        const verified = await this._verifyCctkThreshold();
        if (verified)
            return 0;

        if (this._chargingMode === 'adv' || this._chargingMode === 'exp') {
            this._arg1 = this._chargingMode;
            this._arg2 = 'null';
        } else {
            this._arg1 = `${this._endValue}`;
            this._arg2 = `${this._startValue}`;
        }

        if (this._settings.get_boolean('need-bios-password'))
            this._writeCctkThresholdWithPassword();
        else
            await this._writeCctkThreshold(null);

        return 0;
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
            } catch (e) {
                log('Battery Health Charging: Failed to lookup password from Gnome Keyring');
            }
        });
    }

    async _writeCctkThreshold(arg3) {
        const cmd = arg3 ? 'DELL_CCTK_PASSWORD_BAT_WRITE' : 'DELL_CCTK_BAT_WRITE';
        const [status] = await runCommandCtl(this._ctlPath, cmd, this._arg1, this._arg2, arg3);
        if (status === 65 || status === 58) {
            this.emit('threshold-applied', 'password-required');
            return 0;
        }
        const verified = await this._verifyCctkThreshold();
        if (verified)
            return 0;
        this.emit('threshold-applied', 'failed');
        return 1;
    }

    async _verifyCctkThreshold() {
        const [, output] = await runCommandCtl(this._ctlPath, 'DELL_CCTK_BAT_READ', null, null, null);
        const filteredOutput = output.trim().replace('=', ' ').replace(':', ' ').replace('-', ' ');
        const splitOutput = filteredOutput.split(' ');
        if (splitOutput[0] === 'PrimaryBattChargeCfg') {
            const modeRead = splitOutput[1];
            if (((modeRead === 'Adaptive') && (this._chargingMode === 'adv')) || ((modeRead === 'Express') && (this._chargingMode === 'exp'))) {
                this.mode = this._chargingMode;
                this.startLimitValue = 100;
                this.endLimitValue = 95;
                this.emit('threshold-applied', 'success');
                return true;
            } else if ((modeRead === 'Custom') && ((this._chargingMode === 'ful') || (this._chargingMode === 'bal') || (this._chargingMode === 'max'))) {
                if ((parseInt(splitOutput[2]) === this._startValue) && (parseInt(splitOutput[3]) === this._endValue)) {
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
        this._secretSchema = null;
    }
});

