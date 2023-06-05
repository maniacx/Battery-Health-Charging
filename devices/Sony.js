'use strict';
/* Sony Laptops */
const {GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const SONY_PATH = '/sys/devices/platform/sony-laptop/battery_care_limiter';

var SonySingleBattery = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_BOOLEAN]}},
}, class SonySingleBattery extends GObject.Object {
    name = 'Sony';
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
            batteryCareLimiter = 0;
        else if (chargingMode === 'bal')
            batteryCareLimiter = 80;
        else if (chargingMode === 'max')
            batteryCareLimiter = 50;
        if (readFileInt(SONY_PATH) === batteryCareLimiter) {
            this.endLimitValue = batteryCareLimiter === 0 ? 100 : batteryCareLimiter;
            this.emit('threshold-applied', true);
            return 0;
        }
        const status = await runCommandCtl('SONY', `${batteryCareLimiter}`, null, false);
        if (status === 0) {
            const endLimitValue = readFileInt(SONY_PATH);
            if (batteryCareLimiter === endLimitValue) {
                this.endLimitValue = endLimitValue === 0 ? 100 : endLimitValue;
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

