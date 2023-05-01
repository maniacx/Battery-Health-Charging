'use strict';
/* Thinkpad Laptops */
const {GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const VENDOR_THINKPAD = '/sys/devices/platform/thinkpad_acpi';
const BAT0_END_PATH = '/sys/class/power_supply/BAT0/charge_control_end_threshold';
const BAT0_START_PATH = '/sys/class/power_supply/BAT0/charge_control_start_threshold';
const BAT1_END_PATH = '/sys/class/power_supply/BAT1/charge_control_end_threshold';
const BAT1_START_PATH = '/sys/class/power_supply/BAT1/charge_control_start_threshold';

var ThinkpadDualBattery = GObject.registerClass({
    Signals: {'read-completed': {}},
}, class ThinkpadDualBattery extends GObject.Object {
    name = 'Thinkpad with Dual Battery';
    type = 19;
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
        if (!fileExists(VENDOR_THINKPAD))
            return false;
        if (!fileExists(BAT1_START_PATH))
            return false;
        if (!fileExists(BAT1_END_PATH))
            return false;
        if (!fileExists(BAT0_START_PATH))
            return false;
        if (!fileExists(BAT0_END_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        const settings = ExtensionUtils.getSettings();
        const endValue = settings.get_int(`current-${chargingMode}-end-threshold`);
        const startValue = settings.get_int(`current-${chargingMode}-start-threshold`);
        if ((readFileInt(BAT0_END_PATH) === endValue) && (readFileInt(BAT0_START_PATH) === startValue)) {
            this.endLimitValue = endValue;
            this.startLimitValue = startValue;
            this.emit('read-completed');
            return 0;
        }
        let status = await runCommandCtl('BAT0_END_START', `${endValue}`, `${startValue}`, false);
        if (status === 0)  {
            this.endLimitValue = readFileInt(BAT0_END_PATH);
            this.startLimitValue = readFileInt(BAT0_START_PATH);
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
        if ((readFileInt(BAT1_END_PATH) === endValue) && (readFileInt(BAT1_START_PATH) === startValue)) {
            this.endLimit2Value = endValue;
            this.startLimit2Value = startValue;
            this.emit('read-completed');
            return 0;
        }
        let status = await runCommandCtl('BAT1_END_START', `${endValue}`, `${startValue}`, false);
        if (status === 0)  {
            this.endLimit2Value = readFileInt(BAT1_END_PATH);
            this.startLimit2Value = readFileInt(BAT1_START_PATH);
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

var ThinkpadSingleBatteryBAT0 = GObject.registerClass({
    Signals: {'read-completed': {}},
}, class ThinkpadSingleBatteryBAT0 extends GObject.Object {
    name = 'Thinkpad with Single Battery BAT0';
    type = 20;
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
        if (!fileExists(VENDOR_THINKPAD))
            return false;
        if (!fileExists(BAT0_START_PATH))
            return false;
        if (!fileExists(BAT0_END_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        const settings = ExtensionUtils.getSettings();
        const endValue = settings.get_int(`current-${chargingMode}-end-threshold`);
        const startValue = settings.get_int(`current-${chargingMode}-start-threshold`);
        if ((readFileInt(BAT0_END_PATH) === endValue) && (readFileInt(BAT0_START_PATH) === startValue)) {
            this.endLimitValue = endValue;
            this.startLimitValue = startValue;
            this.emit('read-completed');
            return 0;
        }
        let status = await runCommandCtl('BAT0_END_START', `${endValue}`, `${startValue}`, false);
        if (status === 0)  {
            this.endLimitValue = readFileInt(BAT0_END_PATH);
            this.startLimitValue = readFileInt(BAT0_START_PATH);
            if ((endValue === this.endLimitValue) && (startValue === this.startLimitValue)) {
                this.emit('read-completed');
                return 0;
            }
        }
        log('Battery Health Charging: Error threshold values not updated');
        return 1;
    }
});

var ThinkpadSingleBatteryBAT1 = GObject.registerClass({
    Signals: {'read-completed': {}},
}, class ThinkpadSingleBatteryBAT1 extends GObject.Object {
    name = 'Thinkpad with Single Battery BAT1';
    type = 21;
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
        if (!fileExists(VENDOR_THINKPAD))
            return false;
        if (!fileExists(BAT1_START_PATH))
            return false;
        if (!fileExists(BAT1_END_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        const settings = ExtensionUtils.getSettings();
        const endValue = settings.get_int(`current-${chargingMode}-end-threshold`);
        const startValue = settings.get_int(`current-${chargingMode}-start-threshold`);
        if ((readFileInt(BAT1_END_PATH) === endValue) && (readFileInt(BAT1_START_PATH) === startValue)) {
            this.endLimitValue = endValue;
            this.startLimitValue = startValue;
            this.emit('read-completed');
            return 0;
        }
        let status = await runCommandCtl('BAT1_END_START', `${endValue}`, `${startValue}`, false);
        if (status === 0)  {
            this.endLimitValue = readFileInt(BAT1_END_PATH);
            this.startLimitValue = readFileInt(BAT1_START_PATH);
            if ((endValue === this.endLimitValue) && (startValue === this.startLimitValue)) {
                this.emit('read-completed');
                return 0;
            }
        }
        log('Battery Health Charging: Error threshold values not updated');
        return 1;
    }
});

