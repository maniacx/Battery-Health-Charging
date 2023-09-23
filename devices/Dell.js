'use strict';
/* Dell Laptops using package smbios-battery-ctl from libsmbios  https://github.com/dell/libsmbios */
/* Dell Laptops using package dell command configure from libsmbios  https://www.dell.com/support/kbdoc/en-us/000178000/dell-command-configure */
import GObject from 'gi://GObject';
import * as Helper from '../lib/helper.js';

const {fileExists, runCommandCtl} = Helper;

const DELL_PATH = '/sys/devices/platform/dell-laptop';
const SMBIOS_PATH = '/usr/sbin/smbios-battery-ctl';
const CCTK_PATH = '/opt/dell/dcc/cctk';

export const DellSmBiosSingleBattery = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_BOOLEAN]}},
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
        if (!this._usesCctk && !this._usesLibSmbios)
            return false;
        const bothPackageAvailable = this._usesCctk && this._usesLibSmbios;
        this._settings.set_boolean('show-dell-option', bothPackageAvailable);
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
        const ctlPath = this._settings.get_string('ctl-path');
        let output, filteredOutput, splitOutput, firstLine, secondLine, endValue, startValue;
        if (chargingMode !== 'adv' && chargingMode !== 'exp') {
            endValue = this._settings.get_int(`current-${chargingMode}-end-threshold`);
            startValue = this._settings.get_int(`current-${chargingMode}-start-threshold`);
            if ((endValue - startValue) < 5)
                startValue = endValue - 5;
        }
        output = await runCommandCtl('DELL_SMBIOS_BAT_READ', null, null, ctlPath, true);
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
        await runCommandCtl('DELL_SMBIOS_BAT_WRITE', arg2, arg3, ctlPath, false);
        output = await runCommandCtl('DELL_SMBIOS_BAT_READ', null, null, ctlPath, true);
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
        const ctlPath = this._settings.get_string('ctl-path');
        let output, filteredOutput, splitOutput, endValue, startValue;
        if (chargingMode !== 'adv' && chargingMode !== 'exp') {
            endValue = this._settings.get_int(`current-${chargingMode}-end-threshold`);
            startValue = this._settings.get_int(`current-${chargingMode}-start-threshold`);
            if ((endValue - startValue) < 5)
                startValue = endValue - 5;
        }
        output = await runCommandCtl('DELL_CCTK_BAT_READ', null, null, ctlPath, true);
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
        await runCommandCtl('DELL_CCTK_BAT_WRITE', arg2, arg3, ctlPath, false);
        output = await runCommandCtl('DELL_CCTK_BAT_READ', null, null, ctlPath, true);
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

