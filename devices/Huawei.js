'use strict';
/* Huawei Laptops */
const {GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFile, runCommandCtl} = Helper;

const HUAWEI_PATH = '/sys/devices/platform/huawei-wmi/charge_control_thresholds';

var HuaweiSingleBattery = GObject.registerClass({
    Signals: {'read-completed': {}},
}, class HuaweiSingleBattery extends GObject.Object {
    name = 'Huawei with Single Battery';
    type = 8;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = true;
    deviceHaveVariableThreshold = true;
    deviceHaveBalancedMode = true;
    iconForFullCapMode = 'ful100';
    iconForBalanceMode = 'bal080';
    iconForMaxLifeMode = 'max060';

    isAvailable() {
        if (!fileExists(HUAWEI_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let returnError = false;
        const settings = ExtensionUtils.getSettings();
        const endValue = settings.get_int(`current-${chargingMode}-end-threshold`);
        const startValue = settings.get_int(`current-${chargingMode}-start-threshold`);
        let status = await runCommandCtl('HUAWEI', `${endValue}`, `${startValue}`, false);
        if (status === 0)  {
            const limitValue = readFile(HUAWEI_PATH).split(' ');
            this.endLimitValue = parseInt(limitValue[1]);
            this.startLimitValue = parseInt(limitValue[0]);
            if ((endValue === this.endLimitValue) && (startValue === this.startLimitValue))
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
