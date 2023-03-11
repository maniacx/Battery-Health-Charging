'use strict';
/* Sony Laptop */
const {GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const SONY_PATH = '/sys/devices/platform/sony-laptop/battery_care_limiter';

var SonySingleBattery = GObject.registerClass({
    Signals: {'read-completed': {}},
}, class SonySingleBattery extends GObject.Object {
    name = 'Sony with Single Battery';
    type = 7;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = false;
    deviceHaveVariableThreshold = false;
    deviceHaveBalancedMode = true;
    iconForFullCapMode = 'ful100';
    iconForBalanceMode = 'bal080';
    iconForMaxLifeMode = 'max050';

    isAvailable() {
        if (!fileExists(SONY_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let returnError = false;
        let endValue;
        if (chargingMode === 'ful')
            endValue = 100;
        else if (chargingMode === 'bal')
            endValue = 80;
        else if (chargingMode === 'max')
            endValue = 50;
        let status = await runCommandCtl('SONY', `${endValue}`, null, false);
        if (status === 0)  {
            let endLimitValue = readFileInt(SONY_PATH);
            if (endLimitValue === 0)
                endLimitValue = 100;
            if (endValue === endLimitValue) {
                this.endLimitValue = endLimitValue;
                this.emit('read-completed');
            } else {
                returnError = true;
            }
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

