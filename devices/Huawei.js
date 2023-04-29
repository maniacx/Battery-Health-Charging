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
        if (!fileExists(HUAWEI_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let limitValue = ['0', '0'];
        const settings = ExtensionUtils.getSettings();
        const endValue = settings.get_int(`current-${chargingMode}-end-threshold`);
        const startValue = settings.get_int(`current-${chargingMode}-start-threshold`);
        limitValue = readFile(HUAWEI_PATH).split(' ');
        if ((endValue === parseInt(limitValue[1])) && (startValue === parseInt(limitValue[0]))) {
            this.endLimitValue = endValue;
            this.startLimitValue = startValue;
            this.emit('read-completed');
            return 0;
        }
        let status = await runCommandCtl('HUAWEI', `${endValue}`, `${startValue}`, false);
        if (status === 0)  {
            limitValue = readFile(HUAWEI_PATH).split(' ');
            this.endLimitValue = parseInt(limitValue[1]);
            this.startLimitValue = parseInt(limitValue[0]);
            if ((endValue === this.endLimitValue) && (startValue === this.startLimitValue)) {
                this.emit('read-completed');
                return 0;
            }
        }
        log('Battery Health Charging: Error threshold values not updated');
        return 1;
    }
});
