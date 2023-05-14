'use strict';
/* Sony Laptops */
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
    deviceHaveAdaptiveMode = false;
    deviceHaveExpressMode = false;
    deviceUsesModeNotValue = false;
    iconForFullCapMode = '100';
    iconForBalanceMode = '080';
    iconForMaxLifeMode = '050';

    isAvailable() {
        if (!fileExists(SONY_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let batteryCareLimiter;
        if (chargingMode === 'ful')
            batteryCareLimiter = 100;
        else if (chargingMode === 'bal')
            batteryCareLimiter = 80;
        else if (chargingMode === 'max')
            batteryCareLimiter = 50;
        if (readFileInt(SONY_PATH) === batteryCareLimiter) {
            this.endLimitValue = batteryCareLimiter;
            this.emit('read-completed');
            return 0;
        }
        let status = await runCommandCtl('SONY', `${batteryCareLimiter}`, null, false);
        if (status === 0)  {
            let endLimitValue = readFileInt(SONY_PATH);
            if (endLimitValue === 0)
                endLimitValue = 100;
            if (batteryCareLimiter === endLimitValue) {
                this.endLimitValue = endLimitValue;
                this.emit('read-completed');
                return 0;
            }
        }
        log('Battery Health Charging: Error threshold values not updated');
        return 1;
    }
});

