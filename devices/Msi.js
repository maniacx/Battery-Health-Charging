'use strict';
/* MSI Laptops using dkms https://github.com/BeardOverflow/msi-ec */
const {GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const VENDOR_MSI = '/sys/devices/platform/msi-ec/';
const BAT0_END_PATH = '/sys/class/power_supply/BAT0/charge_control_end_threshold';

var MsiSingleBattery = GObject.registerClass({
    Signals: {'read-completed': {}},
}, class MsiSingleBattery extends GObject.Object {
    name = 'Msi with Single Battery';
    type = 18;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = false;
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

    isAvailable() {
        if (!fileExists(VENDOR_MSI))
            return false;
        if (!fileExists(BAT0_END_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        const settings = ExtensionUtils.getSettings();
        const endValue = settings.get_int(`current-${chargingMode}-end-threshold`);
        if (readFileInt(BAT0_END_PATH) === endValue) {
            this.endLimitValue = endValue;
            this.emit('read-completed');
            return 0;
        }
        let status = await runCommandCtl('BAT0_END', `${endValue}`, null, false);
        if (status === 0)  {
            this.endLimitValue = readFileInt(BAT0_END_PATH);
            if (endValue === this.endLimitValue) {
                this.emit('read-completed');
                return 0;
            }
        }
        log('Battery Health Charging: Error threshold values not updated');
        return 1;
    }
});
