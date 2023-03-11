'use strict';
/* Asus Laptops with BAT0, BAT1, BATC and BATT */
const {GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const VENDOR_ASUS = '/sys/module/asus_wmi';
const BAT0_END_PATH = '/sys/class/power_supply/BAT0/charge_control_end_threshold';
const BAT1_END_PATH = '/sys/class/power_supply/BAT1/charge_control_end_threshold';
const BATC_END_PATH = '/sys/class/power_supply/BATC/charge_control_end_threshold';
const BATT_END_PATH = '/sys/class/power_supply/BATT/charge_control_end_threshold';

var AsusSingleBatteryBAT0 = GObject.registerClass({
    Signals: {'read-completed': {}},
}, class AsusSingleBatteryBAT0 extends GObject.Object {
    name = 'Asus with Single Battery BAT0';
    type = 1;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = false;
    deviceHaveVariableThreshold = true;
    deviceHaveBalancedMode = true;
    iconForFullCapMode = 'ful100';
    iconForBalanceMode = 'bal080';
    iconForMaxLifeMode = 'max060';

    isAvailable() {
        if (!fileExists(VENDOR_ASUS))
            return false;
        if (!fileExists(BAT0_END_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let returnError = false;
        const settings = ExtensionUtils.getSettings();
        const endValue = settings.get_int(`current-${chargingMode}-end-threshold`);
        let status = await runCommandCtl('BAT0_END', `${endValue}`, null, false);
        if (status === 0)  {
            this.endLimitValue = readFileInt(BAT0_END_PATH);
            if (endValue === this.endLimitValue)
                this.emit('read-completed');
            else
                returnError = true;
        } else {
            returnError = true;
        }
        if (returnError) {
            log('Battery Health Charging: Error threshold values not updated');
            status = 1;
        }
        return status;
    }
});

var AsusSingleBatteryBAT1 = GObject.registerClass({
    Signals: {'read-completed': {}},
}, class AsusSingleBatteryBAT1 extends GObject.Object {
    name = 'Asus with Single Battery BAT1';
    type = 2;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = false;
    deviceHaveVariableThreshold = true;
    deviceHaveBalancedMode = true;
    iconForFullCapMode = 'ful100';
    iconForBalanceMode = 'bal080';
    iconForMaxLifeMode = 'max060';

    isAvailable() {
        if (!fileExists(VENDOR_ASUS))
            return false;
        if (!fileExists(BAT1_END_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let returnError = false;
        const settings = ExtensionUtils.getSettings();
        const endValue = settings.get_int(`current-${chargingMode}-end-threshold`);
        let status = await runCommandCtl('BAT1_END', `${endValue}`, null, false);
        if (status === 0)  {
            this.endLimitValue = readFileInt(BAT1_END_PATH);
            if (endValue === this.endLimitValue)
                this.emit('read-completed');
            else
                returnError = true;
        } else {
            returnError = true;
        }
        if (returnError) {
            log('Battery Health Charging: Error threshold values not updated');
            status = 1;
        }
        return status;
    }
});

var AsusSingleBatteryBATC = GObject.registerClass({
    Signals: {'read-completed': {}},
}, class AsusSingleBatteryBATC extends GObject.Object {
    name = 'Asus with Single Battery BATC';
    type = 3;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = false;
    deviceHaveVariableThreshold = true;
    deviceHaveBalancedMode = true;
    iconForFullCapMode = 'ful100';
    iconForBalanceMode = 'bal080';
    iconForMaxLifeMode = 'max060';

    isAvailable() {
        if (!fileExists(VENDOR_ASUS))
            return false;
        if (!fileExists(BATC_END_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let returnError = false;
        const settings = ExtensionUtils.getSettings();
        const endValue = settings.get_int(`current-${chargingMode}-end-threshold`);
        let status = await runCommandCtl('BATC_END', `${endValue}`, null, false);
        if (status === 0)  {
            this.endLimitValue = readFileInt(BATC_END_PATH);
            if (endValue === this.endLimitValue)
                this.emit('read-completed');
            else
                returnError = true;
        } else {
            returnError = true;
        }
        if (returnError) {
            log('Battery Health Charging: Error threshold values not updated');
            status = 1;
        }
        return status;
    }
});

var AsusSingleBatteryBATT = GObject.registerClass({
    Signals: {'read-completed': {}},
}, class AsusSingleBatteryBATT extends GObject.Object {
    name = 'Asus with Single Battery BATT';
    type = 4;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = false;
    deviceHaveVariableThreshold = true;
    deviceHaveBalancedMode = true;
    iconForFullCapMode = 'ful100';
    iconForBalanceMode = 'bal080';
    iconForMaxLifeMode = 'max060';

    isAvailable() {
        if (!fileExists(VENDOR_ASUS))
            return false;
        if (!fileExists(BATT_END_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let returnError = false;
        const settings = ExtensionUtils.getSettings();
        const endValue = settings.get_int(`current-${chargingMode}-end-threshold`);
        let status = await runCommandCtl('BATT_END', `${endValue}`, null, false);
        if (status === 0)  {
            this.endLimitValue = readFileInt(BATT_END_PATH);
            if (endValue === this.endLimitValue)
                this.emit('read-completed');
            else
                returnError = true;
        } else {
            returnError = true;
        }
        if (returnError) {
            log('Battery Health Charging: Error threshold values not updated');
            status = 1;
        }
        return status;
    }
});

