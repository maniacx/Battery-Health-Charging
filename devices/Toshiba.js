'use strict';
/* Toshiba Laptop */
const {GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const VENDOR_TOSHIBA = '/sys/module/toshiba_acpi';
const BAT0_END_PATH = '/sys/class/power_supply/BAT0/charge_control_end_threshold';
const BAT1_END_PATH = '/sys/class/power_supply/BAT1/charge_control_end_threshold';

var ToshibaSingleBatteryBAT0 = GObject.registerClass({
    Signals: {'read-completed': {}},
}, class ToshibaSingleBatteryBAT0 extends GObject.Object {
    name = 'Toshiba with Single Battery BAT0';
    type = 9;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = false;
    deviceHaveVariableThreshold = false;
    deviceHaveBalancedMode = false;
    iconForFullCapMode = 'ful100';
    iconForBalanceMode = null;
    iconForMaxLifeMode = 'max080';

    isAvailable() {
        if (!fileExists(VENDOR_TOSHIBA))
            return false;
        if (!fileExists(BAT0_END_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let returnError = false;
        let endValue;
        if (chargingMode === 'ful')
            endValue = 100;
        else if (chargingMode === 'max')
            endValue = 80;
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

var ToshibaSingleBatteryBAT1 = GObject.registerClass({
    Signals: {'read-completed': {}},
}, class ToshibaSingleBatteryBAT1 extends GObject.Object {
    name = 'Toshiba with Single Battery BAT1';
    type = 10;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = false;
    deviceHaveVariableThreshold = false;
    deviceHaveBalancedMode = false;
    iconForFullCapMode = 'ful100';
    iconForBalanceMode = null;
    iconForMaxLifeMode = 'max080';

    isAvailable() {
        if (!fileExists(VENDOR_TOSHIBA))
            return false;
        if (!fileExists(BAT1_END_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let returnError = false;
        let endValue;
        if (chargingMode === 'ful')
            endValue = 100;
        else if (chargingMode === 'max')
            endValue = 80;
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


