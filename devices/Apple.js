'use strict';
/* Apple SMC = Need Apple SMC install dkms https://github.com/c---/applesmc-next  */
const {GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const VENDOR_APPLE = '/sys/module/applesmc';
const BAT0_END_PATH = '/sys/class/power_supply/BAT0/charge_control_end_threshold';

var AppleSingleBattery = GObject.registerClass({
    Signals: {'read-completed': {}},
}, class AppleSingleBattery extends GObject.Object {
    name = 'Apple with Single Battery';
    type = 19;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = false;
    deviceHaveVariableThreshold = true;
    deviceHaveBalancedMode = true;
    iconForFullCapMode = 'ful100';
    iconForBalanceMode = 'bal080';
    iconForMaxLifeMode = 'max060';

    isAvailable() {
        if (!fileExists(VENDOR_APPLE))
            return false;
        if (!fileExists(BAT0_END_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let returnError = false;
        const settings = ExtensionUtils.getSettings();
        const endValue = settings.get_int(`current-${chargingMode}-end-threshold`);
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
