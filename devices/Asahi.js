'use strict';
/* Apple Mac book with M-series processor - Asahi linux Laptop https://asahilinux.org/ */
const {GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const ASAHI_END_PATH = '/sys/class/power_supply/macsmc-battery/charge_control_end_threshold';
const ASAHI_START_PATH = '/sys/class/power_supply/macsmc-battery/charge_control_start_threshold';

var AsahiSingleBattery = GObject.registerClass({
    Signals: {'read-completed': {}},
}, class AsahiSingleBattery extends GObject.Object {
    name = 'AppleAsahiLinux with Single Battery';
    type = 25;
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
    endMaxLifeSpanRangeMin = 52;
    startFullCapacityRangeMax = 98;
    startFullCapacityRangeMin = 75;
    startBalancedRangeMax = 83;
    startBalancedRangeMin = 60;
    startMaxLifeSpanRangeMax = 83;
    startMaxLifeSpanRangeMin = 50;
    minDiffLimit = 2;

    isAvailable() {
        if (!fileExists(ASAHI_END_PATH))
            return false;
        if (!fileExists(ASAHI_START_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let returnError = false;
        const settings = ExtensionUtils.getSettings();
        const endValue = settings.get_int(`current-${chargingMode}-end-threshold`);
        const startValue = settings.get_int(`current-${chargingMode}-start-threshold`);
        let status = await runCommandCtl('ASAHI_END_START', `${endValue}`, `${startValue}`, false);
        if (status === 0)  {
            this.endLimitValue = readFileInt(ASAHI_END_PATH);
            this.startLimitValue = readFileInt(ASAHI_START_PATH);
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

