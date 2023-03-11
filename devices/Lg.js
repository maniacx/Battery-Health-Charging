'use strict';
/* LG Laptop */
const {GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const LG_PATH = '/sys/devices/platform/lg-laptop/battery_care_limit';

var LgSingleBattery = GObject.registerClass({
    Signals: {'read-completed': {}},
}, class LgSingleBattery extends GObject.Object {
    name = 'LG with Single Battery';
    type = 5;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = false;
    deviceHaveVariableThreshold = false;
    deviceHaveBalancedMode = false;
    iconForFullCapMode = 'ful100';
    iconForBalanceMode = null;
    iconForMaxLifeMode = 'max080';

    isAvailable() {
        if (!fileExists(LG_PATH))
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
        let status = await runCommandCtl('LG', `${endValue}`, null, false);
        if (status === 0)  {
            this.endLimitValue = readFileInt(LG_PATH);
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

