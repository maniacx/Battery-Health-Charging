'use strict';
/* Dell Laptops using package smbios-battery-ctl from libsmbios  https://github.com/dell/libsmbios */
/* Dell Laptops using package dell command configure from libsmbios  https://www.dell.com/support/kbdoc/en-us/000178000/dell-command-configure */
const {GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, runCommandCtl} = Helper;

const DELL_PATH = '/sys/devices/platform/dell-laptop';
const SMBIOS_PATH = '/usr/sbin/smbios-battery-ctl';
const CCTK_PATH = '/opt/dell/dcc/cctk';

var DellSmBiosSingleBattery = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_BOOLEAN]}},
}, class DellSmBiosSingleBattery extends GObject.Object {
    name = 'Dell';
    type = 22;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = true;
    deviceHaveVariableThreshold = true;
    deviceHaveBalancedMode = true;
    deviceHaveAdaptiveMode = true;
    deviceHaveExpressMode = true;
    deviceUsesModeNotValue = false;
    iconForFullCapMode = '100';
    iconForBalanceMode = '080';
    iconForMaxLifeMode = '060';
    endFullCapacityRangeMax = 100;
    endFullCapacityRangeMin = 80;
    endBalancedRangeMax = 85;
    endBalancedRangeMin = 65;
    endMaxLifeSpanRangeMax = 85;
    endMaxLifeSpanRangeMin = 55;
    startFullCapacityRangeMax = 95;
    startFullCapacityRangeMin = 75;
    startBalancedRangeMax = 80;
    startBalancedRangeMin = 60;
    startMaxLifeSpanRangeMax = 80;
    startMaxLifeSpanRangeMin = 50;
    minDiffLimit = 5;

    isAvailable() {
        if (!fileExists(DELL_PATH))
            return false;
        this._usesLibSmbios = fileExists(SMBIOS_PATH);
        this._usesCctk = fileExists(CCTK_PATH);
        if (!this._usesCctk && !this._usesLibSmbios)
            return false;
        const bothPackageAvailable = this._usesCctk && this._usesLibSmbios;
        ExtensionUtils.getSettings().set_boolean('show-dell-option', bothPackageAvailable);
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let status = 0;
        if (this._usesCctk && this._usesLibSmbios) {
            const dellPackage = ExtensionUtils.getSettings().get_int('dell-package-type');
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
        const settings = ExtensionUtils.getSettings();
        let output, filteredOutput, splitOutput, firstLine, secondLine, endValue, startValue;
        if (chargingMode !== 'adv' && chargingMode !== 'exp') {
            endValue = settings.get_int(`current-${chargingMode}-end-threshold`);
            startValue = settings.get_int(`current-${chargingMode}-start-threshold`);
            if ((endValue - startValue) < 5)
                startValue = endValue - 5;
        }
        output = await runCommandCtl('DELL_SMBIOS_BAT_READ', null, null, true);
        filteredOutput = output.trim().replace('(', '').replace(')', '').replace(',', '').replace(/:/g, '');
        splitOutput = filteredOutput.split('\n');
        firstLine = splitOutput[0].split(' ');
        if (firstLine[0] === 'Charging' && firstLine[1] === 'mode') {
            const modeRead = firstLine[2];
            if (((modeRead === 'adaptive') && (chargingMode === 'adv')) || ((modeRead === 'express') && (chargingMode === 'exp'))) {
                this.mode = chargingMode;
                this.startLimitValue = 100;
                this.endLimitValue = 95;
                this.emit('threshold-applied', true);
                return 0;
            } else if ((modeRead === 'custom') && ((chargingMode === 'ful') || (chargingMode === 'bal') || (chargingMode === 'max'))) {
                secondLine = splitOutput[1].split(' ');
                if (secondLine[0] === 'Charging' && secondLine[1] === 'interval') {
                    if ((parseInt(secondLine[2]) === startValue) && (parseInt(secondLine[3]) === endValue)) {
                        this.mode = chargingMode;
                        this.startLimitValue = startValue;
                        this.endLimitValue = endValue;
                        this.emit('threshold-applied', true);
                        return 0;
                    }
                }
            }
        }

        let arg2, arg3;
        if (chargingMode === 'adv' || chargingMode === 'exp') {
            arg2 = chargingMode;
            arg3 = null;
        } else {
            arg2 = `${endValue}`;
            arg3 = `${startValue}`;
        }
        await runCommandCtl('DELL_SMBIOS_BAT_WRITE', arg2, arg3, false);
        output = await runCommandCtl('DELL_SMBIOS_BAT_READ', null, null, true);
        filteredOutput = output.trim().replace('(', '').replace(')', '').replace(',', '').replace(/:/g, '');
        splitOutput = filteredOutput.split('\n');
        firstLine = splitOutput[0].split(' ');
        if (firstLine[0] === 'Charging' && firstLine[1] === 'mode') {
            if (firstLine[2] === 'express') {
                this.mode = 'exp';
                this.startLimitValue = 100;
                this.endLimitValue = 95;
                this.emit('threshold-applied', true);
                return 0;
            } else if (firstLine[2] === 'adaptive') {
                this.mode = 'adv';
                this.startLimitValue = 100;
                this.endLimitValue = 95;
                this.emit('threshold-applied', true);
                return 0;
            } else if (firstLine[2] === 'custom') {
                secondLine = splitOutput[1].split(' ');
                if (secondLine[0] === 'Charging' && secondLine[1] === 'interval') {
                    this.mode = chargingMode;
                    this.startLimitValue = parseInt(secondLine[2]);
                    this.endLimitValue = parseInt(secondLine[3]);
                    this.emit('threshold-applied', true);
                    return 0;
                }
            }
        }
        this.emit('threshold-applied', false);
        return 1;
    }

    async setThresholdLimitCctk(chargingMode) {
        const settings = ExtensionUtils.getSettings();
        let output, filteredOutput, splitOutput, endValue, startValue;
        if (chargingMode !== 'adv' && chargingMode !== 'exp') {
            endValue = settings.get_int(`current-${chargingMode}-end-threshold`);
            startValue = settings.get_int(`current-${chargingMode}-start-threshold`);
            if ((endValue - startValue) < 5)
                startValue = endValue - 5;
        }
        output = await runCommandCtl('DELL_CCTK_BAT_READ', null, null, true);
        filteredOutput = output.trim().replace('=', ' ').replace(':', ' ').replace('-', ' ');
        splitOutput = filteredOutput.split(' ');
        if (splitOutput[0] === 'PrimaryBattChargeCfg') {
            const modeRead = splitOutput[1];
            if (((modeRead === 'Adaptive') && (chargingMode === 'adv')) || ((modeRead === 'Express') && (chargingMode === 'exp'))) {
                this.mode = chargingMode;
                this.startLimitValue = 100;
                this.endLimitValue = 95;
                this.emit('threshold-applied', true);
                return 0;
            } else if ((modeRead === 'Custom') && ((chargingMode === 'ful') || (chargingMode === 'bal') || (chargingMode === 'max'))) {
                if ((parseInt(splitOutput[2]) === startValue) && (parseInt(splitOutput[3]) === endValue)) {
                    this.mode = chargingMode;
                    this.startLimitValue = startValue;
                    this.endLimitValue = endValue;
                    this.emit('threshold-applied', true);
                    return 0;
                }
            }
        }

        let arg2, arg3;
        if (chargingMode === 'adv' || chargingMode === 'exp') {
            arg2 = chargingMode;
            arg3 = null;
        } else {
            arg2 = `${endValue}`;
            arg3 = `${startValue}`;
        }
        await runCommandCtl('DELL_CCTK_BAT_WRITE', arg2, arg3, false);
        output = await runCommandCtl('DELL_CCTK_BAT_READ', null, null, true);
        filteredOutput = output.trim().replace('=', ' ').replace(':', ' ').replace('-', ' ');
        splitOutput = filteredOutput.split(' ');
        if (splitOutput[0] === 'PrimaryBattChargeCfg') {
            const outputMode = splitOutput[1];
            if (outputMode === 'Express') {
                this.mode = 'exp';
                this.startLimitValue = 100;
                this.endLimitValue = 95;
                this.emit('threshold-applied', true);
                return 0;
            } else if (outputMode === 'Adaptive') {
                this.mode = 'adv';
                this.startLimitValue = 100;
                this.endLimitValue = 95;
                this.emit('threshold-applied', true);
                return 0;
            } else if (outputMode === 'Custom') {
                this.mode = chargingMode;
                this.startLimitValue = parseInt(splitOutput[2]);
                this.endLimitValue = parseInt(splitOutput[3]);
                this.emit('threshold-applied', true);
                return 0;
            }
        }
        this.emit('threshold-applied', false);
        return 1;
    }

    destroy() {
        // Nothing to destroy for this device
    }
});

