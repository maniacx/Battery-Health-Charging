'use strict';
/* Gigabyte Laptop using dkms https://github.com/tangalbert919/gigabyte-laptop-wmi  */
const {GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const GIGABYTE_MODE = '/sys/devices/platform/gigabyte_laptop/charge_mode';
const GIGABYTE_LIMIT = '/sys/devices/platform/gigabyte_laptop/charge_limit';

var GigabyteSingleBattery = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_BOOLEAN]}},
}, class GigabyteSingleBattery extends GObject.Object {
    name = 'Gigabyte Laptop';
    type = 28;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = false;
    deviceHaveVariableThreshold = true;
    deviceHaveBalancedMode = true;
    deviceHaveAdaptiveMode = false;
    deviceHaveExpressMode = false;
    deviceUsesModeNotValue = false;
    iconForFullCapMode = '100';
    iconForBalanceMode = '080';
    iconForMaxLifeMode = '060';
    endFullCapacityRangeMax = 100;
    endFullCapacityRangeMin = 80;
    endBalancedRangeMax = 85;
    endBalancedRangeMin = 65;
    endMaxLifeSpanRangeMax = 85;
    endMaxLifeSpanRangeMin = 60;

    isAvailable() {
        if (!fileExists(GIGABYTE_MODE))
            return false;
        if (!fileExists(GIGABYTE_LIMIT))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let updateMode = 'true';
        const settings = ExtensionUtils.getSettings();
        const endValue = settings.get_int(`current-${chargingMode}-end-threshold`);
        if (readFileInt(GIGABYTE_MODE) === 1)
            updateMode = 'false';
        if ((readFileInt(GIGABYTE_LIMIT) === endValue) && (updateMode === 'false')) {
            this.endLimitValue = endValue;
            this.emit('threshold-applied', true);
            return 0;
        }
        const status = await runCommandCtl('GIGABYTE_THRESHOLD', updateMode, `${endValue}`, false);
        if (status === 0) {
            if (readFileInt(GIGABYTE_MODE) === 1) {
                this.endLimitValue = readFileInt(GIGABYTE_LIMIT);
                if (endValue === this.endLimitValue) {
                    this.emit('threshold-applied', true);
                    return 0;
                }
            }
        }
        this.emit('threshold-applied', false);
        return 1;
    }

    destroy() {
        // Nothing to destroy for this device
    }
});
