'use strict';
/* Thinkpad Legacy Laptops using dkms https://github.com/linux-thinkpad/tp_smapi  */
const {GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const TP_BAT0_END = '/sys/devices/platform/smapi/BAT0/stop_charge_thresh';
const TP_BAT0_START = '/sys/devices/platform/smapi/BAT0/start_charge_thresh';
const TP_BAT1_END = '/sys/devices/platform/smapi/BAT1/stop_charge_thresh';
const TP_BAT1_START = '/sys/devices/platform/smapi/BAT1/start_charge_thresh';

var ThinkpadLegacyDualBattery = GObject.registerClass({
    Signals: {'read-completed': {}},
}, class ThinkpadLegacyDualBattery extends GObject.Object {
    name = 'Thinkpad Legacy with Dual Battery';
    type = 13;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = true;
    deviceHaveStartThreshold = true;
    deviceHaveVariableThreshold = true;
    deviceHaveBalancedMode = true;
    deviceHaveAdaptiveMode = false;
    deviceHaveExpressMode = false;
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
        if (!fileExists(TP_BAT1_START))
            return false;
        if (!fileExists(TP_BAT1_END))
            return false;
        if (!fileExists(TP_BAT0_START))
            return false;
        if (!fileExists(TP_BAT0_END))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        const settings = ExtensionUtils.getSettings();
        const endValue = settings.get_int(`current-${chargingMode}-end-threshold`);
        const startValue = settings.get_int(`current-${chargingMode}-start-threshold`);
        if ((readFileInt(TP_BAT0_END) === endValue) && (readFileInt(TP_BAT0_START) === startValue)) {
            this.endLimitValue = endValue;
            this.startLimitValue = startValue;
            this.emit('read-completed');
            return 0;
        }
        let status = await runCommandCtl('TP_BAT0_END_START', `${endValue}`, `${startValue}`, false);
        if (status === 0)  {
            this.endLimitValue = readFileInt(TP_BAT0_END);
            this.startLimitValue = readFileInt(TP_BAT0_START);
            if ((endValue === this.endLimitValue) && (startValue === this.startLimitValue)) {
                this.emit('read-completed');
                return 0;
            }
        }
        log('Battery Health Charging: Error threshold values not updated');
        return 1;
    }

    async setThresholdLimit2(chargingMode2) {
        const settings = ExtensionUtils.getSettings();
        const endValue = settings.get_int(`current-${chargingMode2}-end-threshold2`);
        const startValue = settings.get_int(`current-${chargingMode2}-start-threshold2`);
        if ((readFileInt(TP_BAT1_END) === endValue) && (readFileInt(TP_BAT1_START) === startValue)) {
            this.endLimit2Value = endValue;
            this.startLimit2Value = startValue;
            this.emit('read-completed');
            return 0;
        }
        let status = await runCommandCtl('TP_BAT1_END_START', `${endValue}`, `${startValue}`, false);
        if (status === 0)  {
            this.endLimit2Value = readFileInt(TP_BAT1_END);
            this.startLimit2Value = readFileInt(TP_BAT1_START);
            if ((endValue === this.endLimit2Value) && (startValue === this.startLimit2Value)) {
                this.emit('read-completed');
                return 0;
            }
        }
        log('Battery Health Charging: Error threshold2 values not updated');
        return 1;
    }

    async setThresholdLimitDual() {
        const settings = ExtensionUtils.getSettings();
        let status = await this.setThresholdLimit(settings.get_string('charging-mode'));
        if (status === 0)
            status = await this.setThresholdLimit2(settings.get_string('charging-mode2'));
        return status;
    }
});

var ThinkpadLegacySingleBatteryBAT0 = GObject.registerClass({
    Signals: {'read-completed': {}},
}, class ThinkpadLegacySingleBatteryBAT0 extends GObject.Object {
    name = 'Thinkpad Legacy with Single Battery BAT0';
    type = 14;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = true;
    deviceHaveVariableThreshold = true;
    deviceHaveBalancedMode = true;
    deviceHaveAdaptiveMode = false;
    deviceHaveExpressMode = false;
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
        if (!fileExists(TP_BAT0_START))
            return false;
        if (!fileExists(TP_BAT0_END))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        const settings = ExtensionUtils.getSettings();
        const endValue = settings.get_int(`current-${chargingMode}-end-threshold`);
        const startValue = settings.get_int(`current-${chargingMode}-start-threshold`);
        if ((readFileInt(TP_BAT0_END) === endValue) && (readFileInt(TP_BAT0_START) === startValue)) {
            this.endLimitValue = endValue;
            this.startLimitValue = startValue;
            this.emit('read-completed');
            return 0;
        }
        let status = await runCommandCtl('TP_BAT0_END_START', `${endValue}`, `${startValue}`, false);
        if (status === 0)  {
            this.endLimitValue = readFileInt(TP_BAT0_END);
            this.startLimitValue = readFileInt(TP_BAT0_START);
            if ((endValue === this.endLimitValue) && (startValue === this.startLimitValue)) {
                this.emit('read-completed');
                return 0;
            }
        }
        log('Battery Health Charging: Error threshold values not updated');
        return 1;
    }
});

var ThinkpadLegacySingleBatteryBAT1 = GObject.registerClass({
    Signals: {'read-completed': {}},
}, class ThinkpadLegacySingleBatteryBAT1 extends GObject.Object {
    name = 'Thinkpad Legacy with Single Battery BAT1';
    type = 15;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = true;
    deviceHaveVariableThreshold = true;
    deviceHaveBalancedMode = true;
    deviceHaveAdaptiveMode = false;
    deviceHaveExpressMode = false;
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
        if (!fileExists(TP_BAT1_START))
            return false;
        if (!fileExists(TP_BAT1_END))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        const settings = ExtensionUtils.getSettings();
        const endValue = settings.get_int(`current-${chargingMode}-end-threshold`);
        const startValue = settings.get_int(`current-${chargingMode}-start-threshold`);
        if ((readFileInt(TP_BAT1_END) === endValue) && (readFileInt(TP_BAT1_START) === startValue)) {
            this.endLimitValue = endValue;
            this.startLimitValue = startValue;
            this.emit('read-completed');
            return 0;
        }
        let status = await runCommandCtl('TP_BAT1_END_START', `${endValue}`, `${startValue}`, false);
        if (status === 0)  {
            this.endLimitValue = readFileInt(TP_BAT1_END);
            this.startLimitValue = readFileInt(TP_BAT1_START);
            if ((endValue === this.endLimitValue) && (startValue === this.startLimitValue)) {
                this.emit('read-completed');
                return 0;
            }
        }
        log('Battery Health Charging: Error threshold values not updated');
        return 1;
    }
});

